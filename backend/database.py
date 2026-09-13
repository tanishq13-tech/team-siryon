"""
IBVAP Ultra-Lightweight Database Access Layer (DAO)
SIH 2026 Problem Statement - AI Video Analytics Platform
Optimized for Minimal Memory & Disk Footprint on Edge Nodes

Supports Page 1 Sensor Fusion, Page 2 15-Day Local Retention Policy, and Page 3 Cloud Sync
"""

import os
import sqlite3
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "ibvap_surveillance.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Ultra-Lightweight SQLite Memory Optimizations
    conn.execute("PRAGMA page_size = 4096;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA auto_vacuum = FULL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def _migrate_columns_if_missing(conn):
    """Ensures existing SQLite database instances get new columns seamlessly."""
    tables_to_check = [
        "vehicle_detections", "person_detections", "object_detections",
        "intrusion_events", "video_recordings"
    ]
    for tbl in tables_to_check:
        try:
            cur = conn.execute(f"PRAGMA table_info({tbl});")
            cols = [r["name"] for r in cur.fetchall()]
            if cols and "sync_status" not in cols:
                conn.execute(f"ALTER TABLE {tbl} ADD COLUMN sync_status VARCHAR(20) DEFAULT 'PENDING';")
            if cols and "synced_at" not in cols:
                conn.execute(f"ALTER TABLE {tbl} ADD COLUMN synced_at TIMESTAMP;")
        except Exception:
            pass
    conn.commit()

def init_db():
    """Initializes ultra-lightweight database tables from schema.sql."""
    conn = get_db_connection()
    # First ensure any existing tables get new columns before indexes are built
    _migrate_columns_if_missing(conn)
    with open(SCHEMA_PATH, "r") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    _migrate_columns_if_missing(conn)
    conn.commit()
    conn.close()
    
    db_size_kb = round(os.path.getsize(DB_PATH) / 1024.0, 2)
    print(f"[SUCCESS] Ultra-Lightweight DB initialized at: {DB_PATH} (Actual Disk Size: {db_size_kb} KB!)")

def register_camera(camera_id, location_name, bop_sector, rtsp_url, status="ACTIVE"):
    conn = get_db_connection()
    conn.execute("""
        INSERT OR REPLACE INTO cameras (camera_id, location_name, bop_sector, rtsp_url, status)
        VALUES (?, ?, ?, ?, ?)
    """, (camera_id, location_name, bop_sector, rtsp_url, status))
    conn.commit()
    conn.close()

def insert_video_recording(camera_id, file_path, start_time, end_time, duration_seconds, file_size_mb, recording_type="EVENT_TRIGGERED", sync_status="PENDING"):
    recording_id = str(uuid.uuid4())
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO video_recordings (recording_id, camera_id, file_path, start_time, end_time, duration_seconds, file_size_mb, recording_type, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (recording_id, camera_id, file_path, start_time, end_time, duration_seconds, file_size_mb, recording_type, sync_status))
    conn.commit()
    conn.close()
    return recording_id

def insert_vehicle_detection(camera_id, vehicle_track_id, frame_index, timestamp, vehicle_type, vehicle_photo_path, license_plate_number, plate_photo_path, confidence=0.95, bbox=[120, 580, 260, 715], sync_status="PENDING"):
    detection_id = str(uuid.uuid4())
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO vehicle_detections (detection_id, camera_id, vehicle_track_id, frame_index, timestamp, vehicle_type, vehicle_photo_path, license_plate_number, plate_photo_path, confidence, bbox_json, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (detection_id, camera_id, vehicle_track_id, frame_index, timestamp, vehicle_type, vehicle_photo_path, license_plate_number, plate_photo_path, confidence, str(bbox), sync_status))
    conn.commit()
    conn.close()
    return detection_id

def insert_person_detection(camera_id, person_track_id, frame_index, timestamp, person_photo_path, face_photo_path, frs_suspect_name="UNKNOWN", behavior_tag="WALKING", confidence=0.94, bbox=[450, 210, 530, 480], sync_status="PENDING"):
    detection_id = str(uuid.uuid4())
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO person_detections (detection_id, camera_id, person_track_id, frame_index, timestamp, person_photo_path, face_photo_path, frs_suspect_name, behavior_tag, confidence, bbox_json, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (detection_id, camera_id, person_track_id, frame_index, timestamp, person_photo_path, face_photo_path, frs_suspect_name, behavior_tag, confidence, str(bbox), sync_status))
    conn.commit()
    conn.close()
    return detection_id

def insert_object_detection(camera_id, object_track_id, associated_person_track_id, object_type, object_photo_path, timestamp, confidence=0.90, sync_status="PENDING"):
    detection_id = str(uuid.uuid4())
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO object_detections (detection_id, camera_id, object_track_id, associated_person_track_id, object_type, object_photo_path, confidence, timestamp, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (detection_id, camera_id, object_track_id, associated_person_track_id, object_type, object_photo_path, confidence, timestamp, sync_status))
    conn.commit()
    conn.close()
    return detection_id

def insert_intrusion_event(camera_id, event_type, track_id, snapshot_path, timestamp, geo_lat=31.6241, geo_lng=74.5821, sync_status="PENDING"):
    event_id = str(uuid.uuid4())
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO intrusion_events (event_id, camera_id, event_type, track_id, snapshot_path, geo_lat, geo_lng, timestamp, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (event_id, camera_id, event_type, track_id, snapshot_path, geo_lat, geo_lng, timestamp, sync_status))
    conn.commit()
    conn.close()
    return event_id

def insert_radar_track(radar_id, target_id, range_meters, azimuth_deg, velocity_mps, heading_deg, x_pos, y_pos, timestamp, status="TRACKING", sync_status="PENDING"):
    track_record_id = str(uuid.uuid4())
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO radar_tracks (track_record_id, radar_id, target_id, range_meters, azimuth_deg, velocity_mps, heading_deg, x_pos, y_pos, status, timestamp, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (track_record_id, radar_id, target_id, range_meters, azimuth_deg, velocity_mps, heading_deg, x_pos, y_pos, status, timestamp, sync_status))
    conn.commit()
    conn.close()
    return track_record_id

def insert_combined_object(camera_id, visual_track_id, radar_id, object_type, visual_bbox, license_plate, person_id, range_meters, azimuth_deg, velocity_mps, classification, behavior_label, threat_score, timestamp, sync_status="PENDING"):
    combined_id = f"FUSED-{uuid.uuid4().hex[:8].upper()}"
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO combined_objects (combined_id, camera_id, visual_track_id, radar_id, object_type, visual_bbox_json, license_plate, person_id, range_meters, azimuth_deg, velocity_mps, classification, behavior_label, threat_score, timestamp, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (combined_id, camera_id, visual_track_id, radar_id, object_type, str(visual_bbox), license_plate, person_id, range_meters, azimuth_deg, velocity_mps, classification, behavior_label, threat_score, timestamp, sync_status))
    conn.commit()
    conn.close()
    return combined_id

# --- Page 2: Local Database 15-Day Retention Policy ---

def mark_records_synced(table_name: str, id_col: str, record_ids: List[str]):
    """Marks uploaded records as SYNCED with timestamp."""
    if not record_ids:
        return
    conn = get_db_connection()
    now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    placeholders = ",".join("?" * len(record_ids))
    conn.execute(f"""
        UPDATE {table_name}
        SET sync_status = 'SYNCED', synced_at = ?
        WHERE {id_col} IN ({placeholders})
    """, [now_iso] + list(record_ids))
    conn.commit()
    conn.close()

def mark_all_pending_as_synced(table_name: str):
    """Marks all pending records in a table as SYNCED."""
    conn = get_db_connection()
    now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    conn.execute(f"""
        UPDATE {table_name}
        SET sync_status = 'SYNCED', synced_at = ?
        WHERE sync_status = 'PENDING'
    """, (now_iso,))
    conn.commit()
    conn.close()

def enforce_15_day_retention_policy(retention_days: int = 15) -> Dict[str, Any]:
    """
    Implements Page 2 Architectural Rule:
    'Data stored for 15 Days if it is uploaded to main server else it remains stored until data gets uploaded'
    
    - Deletes records ONLY if sync_status = 'SYNCED' and age > retention_days.
    - Preserves records with sync_status = 'PENDING' indefinitely regardless of age.
    """
    conn = get_db_connection()
    cutoff_dt = datetime.now(timezone.utc) - timedelta(days=retention_days)
    cutoff_iso = cutoff_dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    tables = [
        ("vehicle_detections", "timestamp"),
        ("person_detections", "timestamp"),
        ("intrusion_events", "timestamp"),
        ("radar_tracks", "timestamp"),
        ("combined_objects", "timestamp"),
        ("video_recordings", "start_time")
    ]

    purged_counts = {}
    preserved_pending = {}

    for tbl, time_col in tables:
        try:
            # Count pending records that are preserved regardless of age
            cur_p = conn.execute(f"SELECT COUNT(*) FROM {tbl} WHERE sync_status != 'SYNCED'")
            preserved_pending[tbl] = cur_p.fetchone()[0]

            # Delete only uploaded records older than retention threshold
            cur_d = conn.execute(f"""
                DELETE FROM {tbl}
                WHERE sync_status = 'SYNCED' AND datetime({time_col}) <= datetime(?)
            """, (cutoff_iso,))
            purged_counts[tbl] = cur_d.rowcount
        except Exception:
            purged_counts[tbl] = 0
            preserved_pending[tbl] = 0

    conn.commit()
    conn.close()

    total_purged = sum(purged_counts.values())
    total_preserved = sum(preserved_pending.values())

    return {
        "retention_days": retention_days,
        "cutoff_timestamp": cutoff_iso,
        "total_synced_purged": total_purged,
        "total_pending_preserved": total_preserved,
        "details_purged": purged_counts,
        "details_pending": preserved_pending
    }

def get_pending_records_for_recovery(limit: int = 100) -> Dict[str, List[Dict[str, Any]]]:
    """Retrieves pending records from local cache for Page 3 Recovery Pipeline upload."""
    conn = get_db_connection()
    result = {}
    tables = ["intrusion_events", "vehicle_detections", "person_detections", "combined_objects"]
    for tbl in tables:
        try:
            rows = conn.execute(f"SELECT * FROM {tbl} WHERE sync_status != 'SYNCED' ORDER BY created_at ASC LIMIT ?", (limit,)).fetchall()
            result[tbl] = [dict(r) for r in rows]
        except Exception:
            result[tbl] = []
    conn.close()
    return result

def get_db_file_size_kb():
    if os.path.exists(DB_PATH):
        return round(os.path.getsize(DB_PATH) / 1024.0, 2)
    return 0.0

def get_vehicle_detections():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM vehicle_detections ORDER BY timestamp DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_person_detections():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM person_detections ORDER BY timestamp DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_combined_objects():
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM combined_objects ORDER BY timestamp DESC").fetchall()
    except Exception:
        rows = []
    conn.close()
    return [dict(r) for r in rows]

def get_24h_recordings(camera_id=None):
    conn = get_db_connection()
    if camera_id:
        rows = conn.execute("SELECT * FROM video_recordings WHERE camera_id = ? ORDER BY start_time DESC", (camera_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM video_recordings ORDER BY start_time DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]
