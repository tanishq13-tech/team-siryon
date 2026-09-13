"""
IBVAP Live Surveillance Video AI Pipeline Runner
SIH 2026 Problem Statement - AI Video Analytics Platform

Connects Video Stream AI Detection -> Automatic SQL Database Storage -> Cloud Sync:
1. Reads Border CCTV Video Feed (border_checkpost_raw_feed.mp4)
2. Detects Vehicle & ANPR License Plate -> Saves Photo Crop & Inserts into Edge SQL DB
3. Detects Person & Face FRS -> Saves Photo Crop & Inserts into Edge SQL DB
4. Detects Boundary Intrusion -> Inserts Alert into Edge SQL DB
5. Automatically triggers Cloud Priority Synchronization Engine
"""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from backend.run_live_video_to_database import run_video_to_database_pipeline
except ImportError:
    # pyrefly: ignore [missing-import]
    from run_live_video_to_database import run_video_to_database_pipeline

if __name__ == "__main__":
    video = os.path.join(ROOT_DIR, "border_checkpost_raw_feed.mp4")
    run_video_to_database_pipeline(video_path=video, sync_to_cloud=True)
