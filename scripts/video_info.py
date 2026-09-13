import cv2
import os

video_path = r"C:\Border\data\raw\border_cctv.mp4"

cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("ERROR: Could not open video")
    exit()

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

duration = frame_count / fps if fps > 0 else 0

file_size = os.path.getsize(video_path)

print("\n========== VIDEO INFORMATION ==========")
print(f"File: {video_path}")
print(f"Size: {file_size / (1024 * 1024):.2f} MB")
print(f"Width: {width}")
print(f"Height: {height}")
print(f"Resolution: {width}x{height}")
print(f"FPS: {fps}")
print(f"Frame count: {frame_count}")
print(f"Duration: {duration:.2f} seconds")
print("========================================\n")

cap.release()
