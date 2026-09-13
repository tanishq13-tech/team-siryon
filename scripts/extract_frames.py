import cv2
import os

video_path = r"C:\Border\data\raw\border_cctv.mp4"
output_folder = r"C:\Border\data\frames"

os.makedirs(output_folder, exist_ok=True)

cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("ERROR: Could not open video")
    exit()

frame_number = 0
saved_count = 0

# Save one frame every 5 frames
frame_interval = 5

while True:
    ret, frame = cap.read()

    if not ret:
        break

    if frame_number % frame_interval == 0:
        filename = os.path.join(
            output_folder,
            f"frame_{saved_count:05d}.jpg"
        )

        cv2.imwrite(filename, frame)
        saved_count += 1

    frame_number += 1

cap.release()

print("\n========== FRAME EXTRACTION ==========")
print(f"Total video frames: {frame_number}")
print(f"Frames saved: {saved_count}")
print(f"Output folder: {output_folder}")
print("======================================")