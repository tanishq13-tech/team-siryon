"""
IBVAP End-to-End Workflow Backend Verification Test Suite
SIH 2026 Problem Statement - AI Video Analytics Platform

Verifies all backend components mapped to the 3-Page Workflow:
- Page 1: Radar processing, Radar ID, Sensor Fusion (Camera + Radar -> CombinedObject)
- Page 2: 3D CNN / AI Behavior Analysis (Normal vs Alert), Local DB 15-day conditional retention
- Page 3: Dual Sync Pipelines (Primary vs Recovery), Blockchain SHA256/Hyperledger ledger, AWS targets
"""

import os
import sys
import time
import unittest
import sqlite3
from datetime import datetime, timezone, timedelta

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from radar_fusion import RadarProcessor, SensorFusionEngine, BehaviorAnalysisEngine, execute_full_sensor_fusion_pipeline
import database
from blockchain_ledger import BlockchainLedger
from cloud_sync_engine import CloudSyncEngine, PendingQueue


class TestFullWorkflowBackend(unittest.TestCase):

    def setUp(self):
        database.init_db()
        database.register_camera("CAM_TEST", "Test Checkpost", "Sector 4", "rtsp://127.0.0.1:554/live")

    # --- 1. PAGE 1: SENSOR INGESTION & RADAR FUSION ---

    def test_page1_radar_processing_and_tracking(self):
        """Tests Radar FFT detection, tracking, and persistent Radar ID assignment."""
        radar = RadarProcessor(radar_id="BOP_RADAR_SEC4")
        raw_detections = radar.process_raw_signal()
        self.assertGreater(len(raw_detections), 0, "Radar should produce raw detections")

        tracks = radar.update_tracks(raw_detections)
        self.assertEqual(len(tracks), len(raw_detections))

        first_track = tracks[0]
        self.assertTrue(first_track.radar_id.startswith("RAD-"), "Radar ID must follow RAD-XXXX convention")
        self.assertGreater(first_track.range_meters, 0)
        self.assertIsNotNone(first_track.velocity_mps)

    def test_page1_sensor_fusion_camera_plus_radar(self):
        """Tests cross-modal association linking visual detections with radar tracks into CombinedObject."""
        cam_detections = [
            {
                "vehicle_type": "SUV",
                "vehicle_track_id": 102,
                "bbox": [930, 740, 1170, 860],
                "license_plate_number": "PB08-X-9988",
                "timestamp": "2026-09-04T12:00:00.000Z"
            },
            {
                "frs_suspect_name": "SUSPECT_01 (Intruder Alpha)",
                "person_track_id": 42,
                "bbox": [960, 715, 990, 815],
                "timestamp": "2026-09-04T12:00:00.000Z"
            }
        ]

        fused_objects = execute_full_sensor_fusion_pipeline(cam_detections)
        self.assertGreaterEqual(len(fused_objects), 2)

        # Verify fused properties
        veh_fused = next(o for o in fused_objects if o.license_plate == "PB08-X-9988")
        self.assertIsNotNone(veh_fused.radar_id, "Vehicle must be associated with a Radar ID")
        self.assertTrue(veh_fused.combined_id.startswith("FUSED-"), "Combined Object ID must have FUSED- prefix")
        self.assertGreater(veh_fused.range_meters, 0)

    # --- 2. PAGE 2: BEHAVIOR ANALYSIS & 15-DAY LOCAL RETENTION ---

    def test_page2_3d_cnn_behavior_analysis_normal_vs_alert(self):
        """Tests 3D CNN / AI classification into NORMAL vs ALERT."""
        cam_detections = [
            {
                "frs_suspect_name": "SUSPECT_01 (Intruder Alpha)",
                "person_track_id": 42,
                "bbox": [960, 715, 990, 815],
                "timestamp": "2026-09-04T12:00:00.000Z"
            }
        ]
        fused = execute_full_sensor_fusion_pipeline(cam_detections)
        intruder_obj = fused[0]

        # Classification must be ALERT for suspect intruder prowling
        self.assertIn(intruder_obj.classification, ["NORMAL", "ALERT"])
        self.assertEqual(intruder_obj.classification, "ALERT")
        self.assertGreaterEqual(intruder_obj.threat_score, 0.70)

    def test_page2_15_day_conditional_retention_policy(self):
        """
        Tests the Page 2 Architectural Rule:
        'Data stored for 15 Days if it is uploaded to main server else it remains stored until data gets uploaded'
        
        1. Inserts a 20-day-old record with sync_status = 'SYNCED' -> MUST BE PURGED.
        2. Inserts a 20-day-old record with sync_status = 'PENDING' -> MUST BE PRESERVED.
        3. Inserts a 5-day-old record with sync_status = 'SYNCED' -> MUST BE PRESERVED.
        """
        conn = database.get_db_connection()
        now = datetime.now(timezone.utc)
        t_20d_ago = (now - timedelta(days=20)).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        t_5d_ago = (now - timedelta(days=5)).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

        # Record A: 20 days old, SYNCED (should be purged)
        id_synced_old = "test-retention-synced-old"
        conn.execute("""
            INSERT OR REPLACE INTO vehicle_detections (detection_id, camera_id, vehicle_track_id, frame_index, timestamp, vehicle_photo_path, license_plate_number, plate_photo_path, bbox_json, sync_status)
            VALUES (?, 'CAM_TEST', 991, 10, ?, 'path/a.jpg', 'PB01-OLD', 'path/b.jpg', '[0,0,0,0]', 'SYNCED')
        """, (id_synced_old, t_20d_ago))

        # Record B: 20 days old, PENDING (MUST NOT BE PURGED - offline rule)
        id_pending_old = "test-retention-pending-old"
        conn.execute("""
            INSERT OR REPLACE INTO vehicle_detections (detection_id, camera_id, vehicle_track_id, frame_index, timestamp, vehicle_photo_path, license_plate_number, plate_photo_path, bbox_json, sync_status)
            VALUES (?, 'CAM_TEST', 992, 10, ?, 'path/a.jpg', 'PB02-PENDING', 'path/b.jpg', '[0,0,0,0]', 'PENDING')
        """, (id_pending_old, t_20d_ago))

        # Record C: 5 days old, SYNCED (within 15-day window, MUST BE PRESERVED)
        id_synced_new = "test-retention-synced-new"
        conn.execute("""
            INSERT OR REPLACE INTO vehicle_detections (detection_id, camera_id, vehicle_track_id, frame_index, timestamp, vehicle_photo_path, license_plate_number, plate_photo_path, bbox_json, sync_status)
            VALUES (?, 'CAM_TEST', 993, 10, ?, 'path/a.jpg', 'PB03-NEW', 'path/b.jpg', '[0,0,0,0]', 'SYNCED')
        """, (id_synced_new, t_5d_ago))

        conn.commit()
        conn.close()

        # Run 15-day retention policy
        retention_report = database.enforce_15_day_retention_policy(retention_days=15)
        self.assertGreaterEqual(retention_report["total_synced_purged"], 1)

        # Check database contents
        conn = database.get_db_connection()
        row_synced_old = conn.execute("SELECT * FROM vehicle_detections WHERE detection_id = ?", (id_synced_old,)).fetchone()
        row_pending_old = conn.execute("SELECT * FROM vehicle_detections WHERE detection_id = ?", (id_pending_old,)).fetchone()
        row_synced_new = conn.execute("SELECT * FROM vehicle_detections WHERE detection_id = ?", (id_synced_new,)).fetchone()
        conn.close()

        self.assertIsNone(row_synced_old, "Synced record older than 15 days MUST BE PURGED")
        self.assertIsNotNone(row_pending_old, "Unsynced/pending record older than 15 days MUST BE PRESERVED INDEFINITELY")
        self.assertIsNotNone(row_synced_new, "Synced record younger than 15 days MUST BE PRESERVED")

    # --- 3. PAGE 3: SYNC PIPELINES, BLOCKCHAIN & AWS ---

    def test_page3_blockchain_sha256_hyperledger_verification(self):
        """Tests SHA-256 block hashing, Merkle root, and Hyperledger block validation."""
        ledger = BlockchainLedger()
        init_len = ledger.get_total_blocks()

        receipt = ledger.record_evidence(
            stream_type="ALERT_P1",
            payload_bytes=b"SAMPLE_36_BYTE_ENCRYPTED_SATCOM_ALERT",
            source_node="BOP_TEST"
        )
        self.assertEqual(receipt["status"], "COMMITTED_TO_HYPERLEDGER")
        self.assertEqual(ledger.get_total_blocks(), init_len + 1)
        self.assertTrue(ledger.verify_chain(), "Blockchain cryptographic hash chain must remain 100% valid")

    def test_page3_recovery_pipeline_queue_and_upload(self):
        """Tests Page 3 Pending Queue and Recovery Uploader mechanisms."""
        queue = PendingQueue()
        initial_size = queue.size()

        # Enqueue item
        item = queue.enqueue("ALERT_P1", {"test": "event", "severity": "CRITICAL"})
        self.assertEqual(queue.size(), initial_size + 1)

        # Retrieve pending
        pending = queue.get_pending()
        self.assertTrue(any(p["queue_id"] == item["queue_id"] for p in pending))

        # Mark recovered
        queue.mark_completed([item["queue_id"]])
        self.assertEqual(queue.size(), initial_size)


if __name__ == "__main__":
    unittest.main(verbosity=2)
