import argparse
from pathlib import Path

import cv2
from ultralytics import YOLO


def find_input_video(input_dir: Path, requested_name: str | None) -> Path:
    if requested_name:
        requested_path = input_dir / requested_name
        if requested_path.is_file():
            return requested_path
        raise FileNotFoundError(f"Input video not found: {requested_path}")

    videos = sorted(
        path for path in input_dir.iterdir()
        if path.suffix.lower() in {".mp4", ".avi", ".mov", ".mkv"}
    )
    if not videos:
        raise FileNotFoundError(f"No video found in {input_dir}")
    return videos[0]


parser = argparse.ArgumentParser(description="Detect objects crossing a virtual fence.")
parser.add_argument("--input", help="Input video filename inside input/.")
parser.add_argument("--output", default="output/result.mp4", help="Output video path.")
parser.add_argument("--no-display", action="store_true", help="Disable the preview window.")
args = parser.parse_args()

project_dir = Path(__file__).resolve().parent
model_path = project_dir / "yolo26n.pt"
if model_path.is_file() and model_path.stat().st_size > 0:
    model_source = str(model_path)
else:
    model_source = "yolo11n.pt"
    print(
        f"Warning: {model_path.name} is missing or empty; "
        f"using {model_source} instead."
    )

# Load model
model = YOLO(model_source)

# Input video
video_path = find_input_video(project_dir / "input", args.input)

cap = cv2.VideoCapture(str(video_path))
if not cap.isOpened():
    raise RuntimeError(f"Could not open input video: {video_path}")

fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
if fps <= 0 or width <= 0 or height <= 0:
    cap.release()
    raise RuntimeError(f"Input video has invalid metadata: {video_path}")

# Output video
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
output_path = project_dir / args.output
output_path.parent.mkdir(parents=True, exist_ok=True)
out = cv2.VideoWriter(
    str(output_path),
    fourcc,
    fps,
    (width, height)
)
if not out.isOpened():
    cap.release()
    raise RuntimeError(f"Could not create output video: {output_path}")

# -------------------------------
# VIRTUAL FENCE
# Change these coordinates
# -------------------------------

LINE_Y = int(height * 0.55)

previous_positions = {}

while True:

    ret, frame = cap.read()

    if not ret:
        break

    # YOLO tracking
    results = model.track(
        frame,
        persist=True,
        tracker="bytetrack.yaml",
        classes=[0, 2, 3, 5, 7],  # person, car, motorcycle, bus, truck
        verbose=False
    )

    # Draw virtual fence
    cv2.line(
        frame,
        (0, LINE_Y),
        (width, LINE_Y),
        (0, 0, 255),
        3
    )

    cv2.putText(
        frame,
        "VIRTUAL FENCE",
        (20, LINE_Y - 15),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 0, 255),
        2
    )

    if results[0].boxes.id is not None:

        boxes = results[0].boxes.xyxy.cpu().numpy()
        track_ids = results[0].boxes.id.cpu().numpy().astype(int)
        classes = results[0].boxes.cls.cpu().numpy().astype(int)

        for box, track_id, cls in zip(
            boxes, track_ids, classes
        ):

            x1, y1, x2, y2 = map(int, box)

            # Center of object
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)

            # Previous center
            previous_y = previous_positions.get(track_id)

            intrusion = False

            if previous_y is not None:

                # Detect crossing
                if previous_y < LINE_Y and cy >= LINE_Y:
                    intrusion = True

                elif previous_y > LINE_Y and cy <= LINE_Y:
                    intrusion = True

            previous_positions[track_id] = cy

            # Bounding box
            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            label = f"ID {track_id}"

            cv2.putText(
                frame,
                label,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

            # -------------------------
            # INTRUSION ALERT
            # -------------------------

            if intrusion:

                cv2.putText(
                    frame,
                    "!!! INTRUSION ALERT !!!",
                    (50, 70),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.2,
                    (0, 0, 255),
                    3
                )

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 0, 255),
                    4
                )

                print(
                    f"ALERT: Object ID {track_id} crossed virtual fence"
                )

    out.write(frame)

    if not args.no_display:
        cv2.imshow("Virtual Fence", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

cap.release()
out.release()
if not args.no_display:
    cv2.destroyAllWindows()

print("Processing complete!")
print(f"Output saved to {output_path}")