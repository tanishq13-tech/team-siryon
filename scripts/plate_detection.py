import cv2
import easyocr
import csv
import os
import re
from collections import defaultdict

# ============================================================
# PATHS
# ============================================================

VIDEO_PATH = r"C:\Border\data\raw\border_cctv.mp4"

OUTPUT_VIDEO = r"C:\Border\outputs\plate_detection_output.mp4"

OUTPUT_CSV = r"C:\Border\outputs\plate_metadata.csv"

OUTPUT_CROP = r"C:\Border\outputs\detected_plate.jpg"


# ============================================================
# OCR
# ============================================================

print("Loading EasyOCR...")

reader = easyocr.Reader(
    ["en"],
    gpu=False
)

print("EasyOCR loaded.")


# ============================================================
# OPEN VIDEO
# ============================================================

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video.")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)

width = int(
    cap.get(cv2.CAP_PROP_FRAME_WIDTH)
)

height = int(
    cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
)

frame_count = int(
    cap.get(cv2.CAP_PROP_FRAME_COUNT)
)

print()
print("Video information:")
print(f"Width       : {width}")
print(f"Height      : {height}")
print(f"FPS         : {fps}")
print(f"Frame count : {frame_count}")


# ============================================================
# OUTPUT VIDEO
# ============================================================

os.makedirs(
    os.path.dirname(OUTPUT_VIDEO),
    exist_ok=True
)

fourcc = cv2.VideoWriter_fourcc(
    *"mp4v"
)

out = cv2.VideoWriter(
    OUTPUT_VIDEO,
    fourcc,
    fps,
    (width, height)
)


# ============================================================
# CSV
# ============================================================

csv_file = open(
    OUTPUT_CSV,
    "w",
    newline="",
    encoding="utf-8"
)

writer = csv.writer(csv_file)

writer.writerow([
    "frame",
    "timestamp",
    "vehicle_id",
    "plate_number",
    "ocr_confidence"
])


# ============================================================
# FUNCTIONS
# ============================================================

def clean_text(text):
    """
    Clean OCR output.
    Keep only A-Z and 0-9.
    """

    text = text.upper()

    text = re.sub(
        r"[^A-Z0-9]",
        "",
        text
    )

    return text


def preprocess_plate(plate):
    """
    Generate multiple versions of the plate
    for OCR.
    """

    # --------------------------------------------------------
    # Resize
    # --------------------------------------------------------

    resized = cv2.resize(
        plate,
        None,
        fx=4,
        fy=4,
        interpolation=cv2.INTER_CUBIC
    )

    # --------------------------------------------------------
    # Grayscale
    # --------------------------------------------------------

    gray = cv2.cvtColor(
        resized,
        cv2.COLOR_BGR2GRAY
    )

    # --------------------------------------------------------
    # Equalization
    # --------------------------------------------------------

    equalized = cv2.equalizeHist(
        gray
    )

    # --------------------------------------------------------
    # Blur
    # --------------------------------------------------------

    blurred = cv2.GaussianBlur(
        equalized,
        (3, 3),
        0
    )

    # --------------------------------------------------------
    # Sharpen
    # --------------------------------------------------------

    sharpened = cv2.addWeighted(
        equalized,
        1.5,
        blurred,
        -0.5,
        0
    )

    # --------------------------------------------------------
    # OTSU threshold
    # --------------------------------------------------------

    threshold = cv2.threshold(
        sharpened,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )[1]

    # --------------------------------------------------------
    # Adaptive threshold
    # --------------------------------------------------------

    adaptive = cv2.adaptiveThreshold(
        sharpened,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        5
    )

    return [
        resized,
        gray,
        equalized,
        sharpened,
        threshold,
        adaptive
    ]


def perform_ocr(image):
    """
    Run OCR on an image and return results.
    """

    results = reader.readtext(
        image,
        allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        detail=1,
        paragraph=False
    )

    output = []

    for result in results:

        text = clean_text(
            result[1]
        )

        confidence = float(
            result[2]
        )

        if len(text) >= 5:

            output.append(
                (text, confidence)
            )

    return output


def get_best_plate_ocr(plate):
    """
    Run OCR on multiple preprocessing versions
    and choose the strongest result.
    """

    versions = preprocess_plate(
        plate
    )

    all_results = []

    for image in versions:

        results = perform_ocr(
            image
        )

        for text, confidence in results:

            all_results.append(
                (text, confidence)
            )

    if not all_results:
        return "", 0.0

    # --------------------------------------------------------
    # Count how often each OCR result appears
    # --------------------------------------------------------

    text_counts = defaultdict(int)

    text_confidences = defaultdict(list)

    for text, confidence in all_results:

        text_counts[text] += 1

        text_confidences[text].append(
            confidence
        )

    # --------------------------------------------------------
    # Score results
    #
    # Repeated OCR results get preference.
    # Confidence is also considered.
    # --------------------------------------------------------

    best_text = ""

    best_score = -1

    best_confidence = 0

    for text in text_counts:

        count = text_counts[text]

        avg_confidence = sum(
            text_confidences[text]
        ) / len(
            text_confidences[text]
        )

        score = (
            count * 0.50
            +
            avg_confidence * 0.50
        )

        if score > best_score:

            best_score = score

            best_text = text

            best_confidence = avg_confidence

    return (
        best_text,
        best_confidence
    )


# ============================================================
# TRACKING DATA
# ============================================================

# Temporary placeholder.
# We will connect this to your actual
# YOLO + ByteTrack IDs later.

vehicle_id = 0

last_plate = ""

frame_number = 0


# ============================================================
# MAIN LOOP
# ============================================================

print()
print("======================================")
print("Starting automatic plate detection")
print("======================================")
print()

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1

    # ========================================================
    # PLATE CANDIDATE DETECTION
    # ========================================================

    gray = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2GRAY
    )

    # Improve contrast
    gray = cv2.equalizeHist(
        gray
    )

    # Edge detection
    edges = cv2.Canny(
        gray,
        80,
        180
    )

    # Find contours
    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    possible_plates = []

    for contour in contours:

        x, y, w, h = cv2.boundingRect(
            contour
        )

        if h == 0:
            continue

        aspect_ratio = w / float(h)

        area = w * h

        # ----------------------------------------------------
        # Plate shape filtering
        # ----------------------------------------------------

        if (
            2.0 <= aspect_ratio <= 6.5
            and
            500 <= area <= 100000
            and
            w >= 60
            and
            h >= 15
        ):

            possible_plates.append(
                (x, y, w, h)
            )


    # ========================================================
    # OCR CANDIDATES
    # ========================================================

    best_plate = None

    best_text = ""

    best_confidence = 0.0


    for x, y, w, h in possible_plates:

        # ----------------------------------------------------
        # Add margin around detected region
        # ----------------------------------------------------

        margin_x = int(
            w * 0.10
        )

        margin_y = int(
            h * 0.20
        )

        x1 = max(
            0,
            x - margin_x
        )

        y1 = max(
            0,
            y - margin_y
        )

        x2 = min(
            width,
            x + w + margin_x
        )

        y2 = min(
            height,
            y + h + margin_y
        )


        # ----------------------------------------------------
        # Crop plate
        # ----------------------------------------------------

        plate_crop = frame[
            y1:y2,
            x1:x2
        ]


        if plate_crop.size == 0:
            continue


        # ----------------------------------------------------
        # OCR
        # ----------------------------------------------------

        text, confidence = get_best_plate_ocr(
            plate_crop
        )


        if text == "":
            continue


        # ----------------------------------------------------
        # Select best candidate
        # ----------------------------------------------------

        if confidence > best_confidence:

            best_confidence = confidence

            best_text = text

            best_plate = (
                x1,
                y1,
                x2,
                y2
            )


    # ========================================================
    # DRAW RESULT
    # ========================================================

    if best_plate is not None:

        x1, y1, x2, y2 = best_plate


        # ----------------------------------------------------
        # Draw plate rectangle
        # ----------------------------------------------------

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            3
        )


        # ----------------------------------------------------
        # Display OCR result
        # ----------------------------------------------------

        label = (
            f"PLATE: {best_text} "
            f"({best_confidence:.2f})"
        )


        cv2.putText(
            frame,
            label,
            (
                x1,
                max(
                    30,
                    y1 - 10
                )
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )


        # ----------------------------------------------------
        # Save best plate crop
        # ----------------------------------------------------

        plate_crop = frame[
            y1:y2,
            x1:x2
        ]

        cv2.imwrite(
            OUTPUT_CROP,
            plate_crop
        )


        # ====================================================
        # SAVE METADATA
        # ====================================================

        timestamp = (
            frame_number / fps
        )


        # ----------------------------------------------------
        # Don't repeatedly store identical result
        # ----------------------------------------------------

        if (
            best_text != last_plate
            and
            best_confidence >= 0.30
        ):

            writer.writerow([
                frame_number,
                round(timestamp, 2),
                vehicle_id,
                best_text,
                round(
                    best_confidence,
                    3
                )
            ])

            csv_file.flush()


            print(
                f"Frame {frame_number} | "
                f"Plate: {best_text} | "
                f"Confidence: "
                f"{best_confidence:.2f}"
            )


            last_plate = best_text


    # ========================================================
    # SAVE OUTPUT FRAME
    # ========================================================

    out.write(
        frame
    )


    # --------------------------------------------------------
    # Display
    # --------------------------------------------------------

    cv2.imshow(
        "Automatic Plate Detection",
        frame
    )


    # --------------------------------------------------------
    # Press Q to quit
    # --------------------------------------------------------

    if cv2.waitKey(1) & 0xFF == ord("q"):

        break


# ============================================================
# CLEANUP
# ============================================================

cap.release()

out.release()

csv_file.close()

cv2.destroyAllWindows()


print()
print("======================================")
print("Plate detection completed")
print("======================================")

print(
    f"Output video : {OUTPUT_VIDEO}"
)

print(
    f"Metadata CSV : {OUTPUT_CSV}"
)

print(
    f"Plate crop   : {OUTPUT_CROP}"
)