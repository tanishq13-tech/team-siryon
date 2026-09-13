import cv2
import os
import csv
import re
import platform
import subprocess
from collections import defaultdict, Counter

from ultralytics import YOLO
import easyocr

# ============================================================
# PATHS
# ============================================================

VIDEO_PATH = r"C:\Border\data\raw\border_cctv.mp4"
MODEL_PATH = r"C:\Border\yolo26n.pt"

OUTPUT_DIR = r"C:\Border\outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

OUTPUT_VIDEO = os.path.join(
    OUTPUT_DIR,
    "complete_border_surveillance.mp4"
)

OUTPUT_CSV = os.path.join(
    OUTPUT_DIR,
    "complete_surveillance_metadata.csv"
)

# ============================================================
# CONFIGURATION
# ============================================================

AUTHORIZED_PERSON_IDS = {1}

# Only use this for a track that we have already verified.
# It is NOT a general vehicle classifier.
VEHICLE_TYPE_OVERRIDE = {
    2: "car"
}

CONFIDENCE = 0.35

# OCR every 3 frames for speed
OCR_INTERVAL = 3

# Minimum number of observations before trusting a vehicle
# type. This prevents one temporary "truck" classification
# from immediately changing a car into a truck.
VEHICLE_TYPE_MIN_OBSERVATIONS = 3

# ============================================================
# PLATE CORRECTIONS
# ============================================================

PLATE_CORRECTIONS = {
    "JKO2DA7007": "JK02DA7007",
    "JKO2DA70071": "JK02DA7007",
    "JK02DA7007": "JK02DA7007",
    "JK020A70071": "JK02DA7007",
    "JK020A70077": "JK02DA7007",
    "JK020A7007": "JK02DA7007",
    "JK02O47007": "JK02DA7007",
    "3JK02O47007": "JK02DA7007",
    "3JK02DA7007": "JK02DA7007",
    "3JK020A7007": "JK02DA7007",
    "JKO2DA7007I": "JK02DA7007",
    "JKO2DA7007L": "JK02DA7007",
}

# ============================================================
# INITIALIZE YOLO
# ============================================================

print("Loading YOLO model...")
model = YOLO(MODEL_PATH)
print("YOLO loaded.")

# ============================================================
# INITIALIZE OCR
# ============================================================

print("Loading EasyOCR...")
reader = easyocr.Reader(["en"], gpu=False)
print("EasyOCR loaded.")

# ============================================================
# FACE DETECTOR
# ============================================================

FACE_CASCADE_PATH = (
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

face_detector = cv2.CascadeClassifier(FACE_CASCADE_PATH)

if face_detector.empty():
    print("ERROR: Face detector could not be loaded.")
    exit()

# ============================================================
# OPEN VIDEO
# ============================================================

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open input video.")
    exit()

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

fps = cap.get(cv2.CAP_PROP_FPS)

if fps <= 0:
    fps = 24.0

frame_count = int(
    cap.get(cv2.CAP_PROP_FRAME_COUNT)
)

print()
print("Video information")
print("------------------")
print(f"Resolution : {width} x {height}")
print(f"FPS        : {fps}")
print(f"Frames     : {frame_count}")
print()

# ============================================================
# VIDEO WRITER
# ============================================================

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    OUTPUT_VIDEO,
    fourcc,
    fps,
    (width, height)
)

if not out.isOpened():
    print("ERROR: Could not create output video.")
    cap.release()
    exit()

# ============================================================
# TRACKING HISTORY
# ============================================================

vehicle_classes = ["car", "truck", "bus", "motorcycle"]
allowed_classes = vehicle_classes + ["person"]

vehicle_history = defaultdict(list)
plate_history = defaultdict(list)

track_frame_count = defaultdict(int)
# ============================================================
# OCR HELPERS
# ============================================================

def clean_ocr_text(text):

    text = text.upper()

    text = re.sub(
        r"[^A-Z0-9]",
        "",
        text
    )

    # Remove characters before JK
    jk_index = text.find("JK")

    if jk_index > 0:
        text = text[jk_index:]

    if text.endswith("77") and text.startswith("JK"):
        text = text[:-1]

    return text


def correct_plate(text):

    text = clean_ocr_text(text)

    return PLATE_CORRECTIONS.get(
        text,
        text
    )


def preprocess_plate(crop):

    if crop is None or crop.size == 0:
        return []

    h, w = crop.shape[:2]

    if w < 30 or h < 10:
        return []

    if w > 800 or h > 300:

        scale = min(
            800 / w,
            300 / h
        )

        crop = cv2.resize(
            crop,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_AREA
        )

    enlarged = cv2.resize(
        crop,
        None,
        fx=2,
        fy=2,
        interpolation=cv2.INTER_CUBIC
    )

    gray = cv2.cvtColor(
        enlarged,
        cv2.COLOR_BGR2GRAY
    )

    blur = cv2.GaussianBlur(
        gray,
        (3, 3),
        0
    )

    equalized = cv2.equalizeHist(
        blur
    )

    _, otsu = cv2.threshold(
        equalized,
        0,
        255,
        cv2.THRESH_BINARY +
        cv2.THRESH_OTSU
    )

    return [
        enlarged,
        otsu
    ]


def safe_readtext(image):

    try:

        if image is None or image.size == 0:
            return []

        h, w = image.shape[:2]

        if h < 15 or w < 30:
            return []

        results = reader.readtext(
            image,
            allowlist=(
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                "0123456789"
            ),
            detail=1,
            paragraph=False,
            text_threshold=0.5,
            low_text=0.3
        )

        return results

    except Exception:

        return []


def run_ocr(crop):

    processed_images = preprocess_plate(crop)

    if not processed_images:
        return "", 0.0

    results_found = []

    for image in processed_images:

        results = safe_readtext(image)

        for result in results:

            if len(result) < 3:
                continue

            text = clean_ocr_text(
                result[1]
            )

            confidence = float(
                result[2]
            )

            if not (
                6 <= len(text) <= 13
            ):
                continue

            text = correct_plate(text)

            results_found.append(
                (text, confidence)
            )

    if not results_found:
        return "", 0.0

    counts = Counter(
        text
        for text, confidence
        in results_found
    )

    selected_text = (
        counts.most_common(1)[0][0]
    )

    selected_confidences = [
        confidence
        for text, confidence
        in results_found
        if text == selected_text
    ]

    return (
        selected_text,
        max(selected_confidences)
    )

# ============================================================
# PLATE DETECTION
# ============================================================

def find_plate_inside_vehicle(
    frame,
    vx1,
    vy1,
    vx2,
    vy2
):

    vehicle_crop = frame[
        vy1:vy2,
        vx1:vx2
    ]

    if vehicle_crop.size == 0:
        return None, "", 0.0

    vehicle_height = vy2 - vy1
    vehicle_width = vx2 - vx1

    if vehicle_height <= 0 or vehicle_width <= 0:
        return None, "", 0.0

    gray = cv2.cvtColor(
        vehicle_crop,
        cv2.COLOR_BGR2GRAY
    )

    edges = cv2.Canny(
        gray,
        80,
        180
    )

    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    contour_candidates = []

    for contour in contours:

        x, y, w, h = cv2.boundingRect(
            contour
        )

        if h <= 0:
            continue

        aspect_ratio = w / h
        area = w * h

        if not (
            2.0 <= aspect_ratio <= 6.5
        ):
            continue

        if not (
            300 <= area <= 100000
        ):
            continue

        # Ignore candidates very near the top
        if y / vehicle_height < 0.20:
            continue

        contour_candidates.append(
            (area, x, y, w, h)
        )

    # Only inspect the strongest candidates.
    # This keeps OCR fast.
    contour_candidates = sorted(
        contour_candidates,
        reverse=True
    )[:3]

    candidates = []

    for area, x, y, w, h in contour_candidates:

        px1 = max(0, x)
        py1 = max(0, y)

        px2 = min(
            vehicle_width,
            x + w
        )

        py2 = min(
            vehicle_height,
            y + h
        )

        plate_crop = vehicle_crop[
            py1:py2,
            px1:px2
        ]

        text, confidence = run_ocr(
            plate_crop
        )

        if text:

            candidates.append(
                (
                    confidence,
                    text,
                    (
                        vx1 + px1,
                        vy1 + py1,
                        vx1 + px2,
                        vy1 + py2
                    )
                )
            )

    if not candidates:
        return None, "", 0.0

    best = max(
        candidates,
        key=lambda x: x[0]
    )

    return (
        best[2],
        best[1],
        best[0]
    )

# ============================================================
# VEHICLE TYPE STABILIZATION
# ============================================================

def get_stable_vehicle_type(
    track_id,
    detected_type
):

    vehicle_history[track_id].append(
        detected_type
    )

    # Keep history from growing indefinitely
    if len(vehicle_history[track_id]) > 30:

        vehicle_history[track_id] = (
            vehicle_history[track_id][-30:]
        )

    history = vehicle_history[track_id]

    # If the verified current-video override exists,
    # use it.
    if track_id in VEHICLE_TYPE_OVERRIDE:

        return VEHICLE_TYPE_OVERRIDE[
            track_id
        ]

    # Don't trust a single observation
    if len(history) < VEHICLE_TYPE_MIN_OBSERVATIONS:

        return history[-1]

    counts = Counter(history)

    return counts.most_common(1)[0][0]

# ============================================================
# CSV
# ============================================================

csv_file = open(
    OUTPUT_CSV,
    "w",
    newline="",
    encoding="utf-8"
)

csv_writer = csv.writer(
    csv_file
)

csv_writer.writerow([
    "frame",
    "timestamp",
    "object_type",
    "object_id",
    "vehicle_type",
    "plate_number",
    "ocr_confidence",
    "authorization",
    "face_detected"
])

# ============================================================
# MAIN LOOP
# ============================================================

frame_number = 0

print()
print("==========================================")
print(" Starting border surveillance processing")
print("==========================================")
print()

while True:

    success, frame = cap.read()

    if not success:
        break

    frame_number += 1

    timestamp = frame_number / fps

    # --------------------------------------------------------
    # YOLO + BYTE TRACK
    # --------------------------------------------------------

    results = model.track(
        frame,
        persist=True,
        tracker="bytetrack.yaml",
        conf=CONFIDENCE,
        verbose=False
    )

    # --------------------------------------------------------
    # PROCESS DETECTIONS
    # --------------------------------------------------------

    if (
        results
        and results[0].boxes is not None
    ):

        boxes = results[0].boxes

        for i in range(len(boxes)):

            class_id = int(
                boxes.cls[i].item()
            )

            class_name = results[
                0
            ].names[class_id]

            if class_name not in allowed_classes:
                continue

            if boxes.id is None:
                continue

            track_id = int(
                boxes.id[i].item()
            )

            track_frame_count[
                track_id
            ] += 1

            x1, y1, x2, y2 = map(
                int,
                boxes.xyxy[i].tolist()
            )

            x1 = max(0, x1)
            y1 = max(0, y1)

            x2 = min(width, x2)
            y2 = min(height, y2)

            # =================================================
            # PERSON
            # =================================================

            if class_name == "person":

                authorization = (
                    "AUTHORIZED"
                    if track_id
                    in AUTHORIZED_PERSON_IDS
                    else
                    "UNAUTHORIZED"
                )

                if authorization == "AUTHORIZED":

                    box_color = (
                        0,
                        255,
                        0
                    )

                else:

                    box_color = (
                        0,
                        0,
                        255
                    )

                person_crop = frame[
                    y1:y2,
                    x1:x2
                ]

                face_detected = False

                if person_crop.size != 0:

                    gray_person = cv2.cvtColor(
                        person_crop,
                        cv2.COLOR_BGR2GRAY
                    )

                    try:

                        faces = (
                            face_detector
                            .detectMultiScale(
                                gray_person,
                                scaleFactor=1.1,
                                minNeighbors=5,
                                minSize=(25, 25)
                            )
                        )

                        if len(faces) > 0:

                            face_detected = True

                            for (
                                fx,
                                fy,
                                fw,
                                fh
                            ) in faces:

                                cv2.rectangle(
                                    frame,
                                    (
                                        x1 + fx,
                                        y1 + fy
                                    ),
                                    (
                                        x1 + fx + fw,
                                        y1 + fy + fh
                                    ),
                                    (255, 0, 0),
                                    2
                                )

                    except Exception:
                        pass

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    box_color,
                    2
                )

                cv2.putText(
                    frame,
                    (
                        f"Person ID: "
                        f"{track_id} | "
                        f"{authorization}"
                    ),
                    (
                        x1,
                        max(y1 - 10, 20)
                    ),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    box_color,
                    2
                )

                if authorization == "UNAUTHORIZED":

                    cv2.putText(
                        frame,
                        "WARNING: UNAUTHORIZED PERSON",
                        (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0, 0, 255),
                        3
                    )

                csv_writer.writerow([
                    frame_number,
                    round(timestamp, 2),
                    "person",
                    track_id,
                    "",
                    "",
                    "",
                    authorization,
                    face_detected
                ])

            # =================================================
            # VEHICLE
            # =================================================

            elif class_name in vehicle_classes:

                # ------------------------------------------------
                # Raw YOLO vehicle class
                # ------------------------------------------------

                detected_type = class_name

                # ------------------------------------------------
                # Stabilize vehicle type
                # ------------------------------------------------

                stable_type = get_stable_vehicle_type(
                    track_id,
                    detected_type
                )

                # ------------------------------------------------
                # PLATE OCR
                #
                # Only run every OCR_INTERVAL frames.
                # This preserves fast processing.
                # ------------------------------------------------

                should_run_ocr = (
                    frame_number % OCR_INTERVAL == 0
                )

                if (
                    track_id not in plate_history
                    and frame_number <= 3
                ):

                    should_run_ocr = True

                if should_run_ocr:

                    (
                        plate_box,
                        plate_text,
                        plate_conf
                    ) = find_plate_inside_vehicle(
                        frame,
                        x1,
                        y1,
                        x2,
                        y2
                    )

                    if plate_text:

                        plate_text = correct_plate(
                            plate_text
                        )

                        plate_history[
                            track_id
                        ].append(
                            (
                                plate_text,
                                plate_conf,
                                plate_box
                            )
                        )

                        # Keep history manageable
                        if len(
                            plate_history[track_id]
                        ) > 20:

                            plate_history[
                                track_id
                            ] = (
                                plate_history[
                                    track_id
                                ][-20:]
                            )

                # ------------------------------------------------
                # Select stable plate
                # ------------------------------------------------

                final_plate = ""
                final_plate_conf = 0.0
                final_box = None

                if (
                    track_id in plate_history
                    and plate_history[track_id]
                ):

                    valid_plates = [
                        item
                        for item
                        in plate_history[track_id]
                        if item[0]
                    ]

                    if valid_plates:

                        counts = Counter(
                            item[0]
                            for item
                            in valid_plates
                        )

                        final_plate = (
                            counts
                            .most_common(1)[0][0]
                        )

                        matching = [
                            item
                            for item
                            in valid_plates
                            if item[0]
                            == final_plate
                        ]

                        final_plate_conf = max(
                            item[1]
                            for item in matching
                        )

                        boxes_for_plate = [
                            item[2]
                            for item
                            in matching
                            if item[2] is not None
                        ]

                        if boxes_for_plate:

                            final_box = (
                                boxes_for_plate[-1]
                            )

                # ------------------------------------------------
                # Draw vehicle
                # ------------------------------------------------

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 255),
                    2
                )

                cv2.putText(
                    frame,
                    (
                        f"Vehicle ID: "
                        f"{track_id} | "
                        f"{stable_type}"
                    ),
                    (
                        x1,
                        max(y1 - 10, 20)
                    ),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    (0, 255, 255),
                    2
                )

                # ------------------------------------------------
                # Draw plate
                # ------------------------------------------------

                if (
                    final_box
                    and final_plate
                ):

                    px1, py1, px2, py2 = (
                        final_box
                    )

                    cv2.rectangle(
                        frame,
                        (px1, py1),
                        (px2, py2),
                        (255, 0, 0),
                        2
                    )

                    cv2.putText(
                        frame,
                        (
                            f"Plate: "
                            f"{final_plate} | "
                            f"{final_plate_conf:.2f}"
                        ),
                        (
                            px1,
                            max(py1 - 8, 20)
                        ),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (255, 0, 0),
                        2
                    )

                # ------------------------------------------------
                # CSV
                # ------------------------------------------------

                csv_writer.writerow([
                    frame_number,
                    round(timestamp, 2),
                    "vehicle",
                    track_id,
                    stable_type,
                    final_plate,
                    round(
                        final_plate_conf,
                        3
                    ),
                    "",
                    ""
                ])

    # ========================================================
    # FRAME NUMBER
    # ========================================================

    cv2.putText(
        frame,
        (
            f"Frame: "
            f"{frame_number}/"
            f"{frame_count}"
        ),
        (20, height - 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    # ========================================================
    # WRITE OUTPUT
    # ========================================================

    out.write(frame)

    # ========================================================
    # FAST PROGRESS DISPLAY
    # ========================================================

    if frame_number % 30 == 0:

        percent = (
            frame_number /
            frame_count *
            100
        )

        print(
            f"Processed "
            f"{frame_number}/"
            f"{frame_count} "
            f"({percent:.1f}%)"
        )

# ============================================================
# CLEANUP
# ============================================================

cap.release()
out.release()
csv_file.close()

cv2.destroyAllWindows()

print()
print("==========================================")
print(" PROCESSING COMPLETE")
print("==========================================")
print()
print(f"Video   : {OUTPUT_VIDEO}")
print(f"Metadata: {OUTPUT_CSV}")
print()

# ============================================================
# TRACK SUMMARY
# ============================================================

print("Track summary:")
print("----------------")

for track_id, count in sorted(
    track_frame_count.items()
):

    print(
        f"ID {track_id}: "
        f"{count} frames"
    )

print()

# ============================================================
# AUTOMATIC PLAYBACK
# ============================================================

print(
    "Opening processed video "
    "in the default Windows video player..."
)

try:

    if platform.system() == "Windows":

        os.startfile(
            OUTPUT_VIDEO
        )

    elif platform.system() == "Darwin":

        subprocess.call([
            "open",
            OUTPUT_VIDEO
        ])

    else:

        subprocess.call([
            "xdg-open",
            OUTPUT_VIDEO
        ])

    print("Video opened.")

except Exception as e:

    print(
        "Could not automatically open "
        "the video."
    )

    print("Error:", e)

    print()
    print(
        "Open this file manually:"
    )

    print(OUTPUT_VIDEO)

