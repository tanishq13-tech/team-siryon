import cv2
import os
from ultralytics import YOLO

# ==========================================
# PATHS
# ==========================================

VIDEO_PATH = r"C:\Border\data\raw\border_cctv.mp4"
MODEL_PATH = r"C:\Border\yolo26n.pt"

OUTPUT_DIR = r"C:\Border\outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

OUTPUT_VIDEO = os.path.join(
    OUTPUT_DIR,
    "person_authorization.mp4"
)

# ==========================================
# AUTHORIZED PERSON IDs
# ==========================================
# For this prototype:
# Person ID 2 = Authorized
#
# Later we will replace this with a proper
# uniform / ID-card / registration system.

AUTHORIZED_PERSON_IDS = {1}


# ==========================================
# LOAD MODEL
# ==========================================

print("Loading YOLO model...")

model = YOLO(MODEL_PATH)

print("YOLO model loaded.")


# ==========================================
# OPEN VIDEO
# ==========================================

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video.")
    exit()


# ==========================================
# VIDEO INFORMATION
# ==========================================

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)

if fps <= 0:
    fps = 24


# ==========================================
# OUTPUT VIDEO
# ==========================================

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    OUTPUT_VIDEO,
    fourcc,
    fps,
    (width, height)
)


# ==========================================
# PROCESS VIDEO
# ==========================================

frame_number = 0

while True:

    success, frame = cap.read()

    if not success:
        break

    frame_number += 1

    # --------------------------------------
    # YOLO + BYTETRACK
    # --------------------------------------

    results = model.track(
        frame,
        persist=True,
        tracker="bytetrack.yaml",
        conf=0.35,
        classes=[0],       # COCO class 0 = person
        verbose=False
    )

    result = results[0]

    if result.boxes is not None:

        boxes = result.boxes

        for i in range(len(boxes)):

            # --------------------------------
            # TRACK ID
            # --------------------------------

            if boxes.id is None:
                continue

            person_id = int(
                boxes.id[i].item()
            )

            confidence = float(
                boxes.conf[i].item()
            )

            # --------------------------------
            # BOUNDING BOX
            # --------------------------------

            x1, y1, x2, y2 = map(
                int,
                boxes.xyxy[i].tolist()
            )

            # --------------------------------
            # AUTHORIZATION
            # --------------------------------

            if person_id in AUTHORIZED_PERSON_IDS:

                status = "AUTHORIZED"

                # Bounding box
                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2
                )

            else:

                status = "UNAUTHORIZED"

                # Bounding box
                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 0, 255),
                    2
                )

            # --------------------------------
            # LABEL
            # --------------------------------

            label = (
                f"Person ID: {person_id} | "
                f"{status} | "
                f"{confidence:.2f}"
            )

            cv2.putText(
                frame,
                label,
                (x1, max(y1 - 10, 25)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 255, 255),
                2
            )

            # --------------------------------
            # ALERT FOR UNAUTHORIZED PERSON
            # --------------------------------

            if status == "UNAUTHORIZED":

                cv2.putText(
                    frame,
                    "WARNING: UNAUTHORIZED PERSON",
                    (30, 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    3
                )


    # ======================================
    # FRAME NUMBER
    # ======================================

    cv2.putText(
        frame,
        f"Frame: {frame_number}",
        (20, height - 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )


    # ======================================
    # DISPLAY
    # ======================================

    cv2.imshow(
        "Border Surveillance - Authorization",
        frame
    )

    out.write(frame)

    # Press Q to stop
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# ==========================================
# CLEANUP
# ==========================================

cap.release()
out.release()
cv2.destroyAllWindows()


print("\n======================================")
print("Person authorization completed.")
print("======================================")

print("\nOutput saved to:")
print(OUTPUT_VIDEO)

print("======================================")