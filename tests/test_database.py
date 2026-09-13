"""
IBVAP Database Test & Verification Script
SIH 2026 Problem Statement - AI Video Analytics Platform
"""

import os
import sys
from datetime import datetime, timezone

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from backend import database
except ImportError:
    # pyrefly: ignore [missing-import]
    import database

def run_database_tests():
    print("\n" + "="*70)
    print(" [DATABASE] IBVAP SURVEILLANCE SQL DATABASE TESTING ENGINE ")
    print("="*70)
    
    # Create media directories for snapshots and 24-hour video clips
    base_dir = BACKEND_DIR
    os.makedirs(os.path.join(base_dir, "media", "snapshots"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "media", "recordings"), exist_ok=True)
    
    # 1. Initialize Database Schema
    database.init_db()
    
    # 2. Register Border Cameras
    cam1 = "BOP_SECTOR_4_CAM_01"
    cam2 = "BOP_SECTOR_4_CAM_02"
    database.register_camera(cam1, "Border Checkpost Alpha", "Sector 4", "rtsp://192.168.1.100:554/live")
    database.register_camera(cam2, "Perimeter Fence North", "Sector 4", "rtsp://192.168.1.101:554/live")
    print(f"[+] Registered Cameras: {cam1}, {cam2}")

    now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    # Path to actual clean video feed file
    checkpost_video_path = os.path.join(ROOT_DIR, "border_checkpost_raw_feed.mp4")

    # 3. Insert 24-Hour Video Recording Metadata linked to actual video file
    rec_id = database.insert_video_recording(
        camera_id=cam1,
        file_path=checkpost_video_path,
        start_time="2026-09-04T00:00:00.000Z",
        end_time="2026-09-04T23:59:59.000Z",
        duration_seconds=86400,
        file_size_mb=65.2,
        recording_type="CONTINUOUS_24H"
    )
    print(f"[+] Inserted 24-Hour Video Recording: ID {rec_id[:8]}... (Path: {checkpost_video_path})")

    # 4. Insert Vehicle Detection & ANPR Data
    veh_id = database.insert_vehicle_detection(
        camera_id=cam1,
        vehicle_track_id=102,
        frame_index=450,
        timestamp=now_iso,
        vehicle_type="SUV",
        vehicle_photo_path="backend/media/snapshots/veh_track_102_crop.jpg",
        license_plate_number="PB08-X-9988",
        plate_photo_path="backend/media/snapshots/anpr_pb08x9988_crop.jpg",
        confidence=0.96,
        bbox=[120, 580, 260, 715]
    )
    print(f"[+] Inserted Vehicle Detection: Track ID #102 | ANPR: PB08-X-9988")

    # 5. Insert Person Detection & FRS Data
    per_id = database.insert_person_detection(
        camera_id=cam2,
        person_track_id=42,
        frame_index=120,
        timestamp=now_iso,
        person_photo_path="backend/media/snapshots/person_track_42_body.jpg",
        face_photo_path="backend/media/snapshots/frs_track_42_face.jpg",
        frs_suspect_name="SUSPECT_01 (Intruder Alpha)",
        behavior_tag="CRAWLING",
        confidence=0.94,
        bbox=[450, 210, 530, 480]
    )
    print(f"[+] Inserted Person Detection: Track ID #42 | FRS: Intruder Alpha | Behavior: CRAWLING")

    # 6. Insert Object Detection Data
    obj_id = database.insert_object_detection(
        camera_id=cam2,
        object_track_id=5,
        associated_person_track_id=42,
        object_type="WEAPON_AK47",
        object_photo_path="backend/media/snapshots/obj_track_5_weapon.jpg",
        timestamp=now_iso,
        confidence=0.91
    )
    print(f"[+] Inserted Object Detection: Track ID #5 (AK47 Weapon) linked to Person Track ID #42")

    # 7. Insert Intrusion Event Log
    evt_id = database.insert_intrusion_event(
        camera_id=cam2,
        event_type="VIRTUAL_FENCE_INTRUSION",
        track_id=42,
        snapshot_path="backend/media/snapshots/evt_fence_crossing_frame120.jpg",
        timestamp=now_iso
    )
    print(f"[+] Inserted Intrusion Event: Virtual Fence Crossing linked to Person Track ID #42")

    print("="*70 + "\n")

if __name__ == "__main__":
    run_database_tests()
