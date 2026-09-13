"""
IBVAP Multi-Modal Compression & Cloud Synchronization Verification Test Suite
SIH 2026 Problem Statement - AI Video Analytics Platform
"""

import os
import sys
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from backend.metadata_compressor import MetadataCompressor
    from backend.alert_compressor import AlertCompressor
    from backend.snapshot_compressor import SnapshotCompressor
    from backend.video_compressor import VideoCompressor
except ImportError:
    # pyrefly: ignore [missing-import]
    from metadata_compressor import MetadataCompressor
    # pyrefly: ignore [missing-import]
    from alert_compressor import AlertCompressor
    # pyrefly: ignore [missing-import]
    from snapshot_compressor import SnapshotCompressor
    # pyrefly: ignore [missing-import]
    from video_compressor import VideoCompressor

class TestMultiModalCompression(unittest.TestCase):

    def setUp(self):
        self.sample_csv = os.path.join(BACKEND_DIR, "data", "sample_metadata.csv")
        self.sample_video = os.path.join(ROOT_DIR, "border_checkpost_raw_feed.mp4")
        self.sample_snapshot = os.path.join(BACKEND_DIR, "media", "snapshots", "face_track_42_frame180.jpg")

    def test_metadata_compression_and_lossless_roundtrip(self):
        """Tests that metadata compresses > 90% and restores with 100% fidelity."""
        self.assertTrue(os.path.exists(self.sample_csv), "sample_metadata.csv must exist")

        headers, original_rows = MetadataCompressor.load_rows_from_csv(self.sample_csv)
        self.assertGreater(len(original_rows), 100, "Should have more than 100 rows")

        c_bytes, stats = MetadataCompressor.compress_csv_file(self.sample_csv)
        self.assertGreater(stats["savings_percent"], 90.0, "Metadata savings must exceed 90%")
        self.assertGreater(stats["compression_ratio"], 10.0, "Compression ratio must exceed 10x")

        # Lossless decompression
        decomp_headers, decomp_rows = MetadataCompressor.decompress(c_bytes)
        self.assertEqual(len(decomp_rows), len(original_rows), "Row count must match perfectly")
        self.assertEqual(decomp_headers, headers, "Headers must match perfectly")

        # Verify exact field matching on sample rows
        for i in [0, 10, 50, 100, len(original_rows) - 1]:
            orig = original_rows[i]
            decomp = decomp_rows[i]
            self.assertEqual(orig["frame"], decomp["frame"])
            self.assertEqual(orig["object_type"], decomp["object_type"])
            self.assertEqual(orig["authorization"], decomp["authorization"])
            if orig.get("plate_number"):
                self.assertEqual(orig["plate_number"], decomp["plate_number"])

    def test_alert_compression_36_bytes(self):
        """Tests that critical alerts pack to exactly 36 bytes and restore faithfully."""
        alert = {
            "camera_id": "BOP_CAM_99",
            "event_type": "PERIMETER_BREACH",
            "severity": "CRITICAL",
            "track_id": 901,
            "geo_lat": 31.624185,
            "geo_lng": 74.582193,
            "timestamp": "2026-09-05T12:00:00.000Z"
        }

        packet, stats = AlertCompressor.compress_alert(alert)
        self.assertEqual(len(packet), 36, "Alert packet must be exactly 36 bytes")
        self.assertGreater(stats["savings_percent"], 80.0, "Alert savings must exceed 80%")

        restored = AlertCompressor.decompress_alert(packet)
        self.assertEqual(restored["event_type"], "PERIMETER_BREACH")
        self.assertEqual(restored["severity"], "CRITICAL")
        self.assertEqual(restored["track_id"], 901)
        self.assertAlmostEqual(restored["geo_lat"], 31.624185, places=4)
        self.assertAlmostEqual(restored["geo_lng"], 74.582193, places=4)

    def test_snapshot_compression(self):
        """Tests that facial/license plate crops compress to high-efficiency WebP."""
        if os.path.exists(self.sample_snapshot):
            c_bytes, stats = SnapshotCompressor.compress_image_bytes(self.sample_snapshot, quality=75)
            self.assertGreater(stats["savings_percent"], 70.0, "Snapshot savings must exceed 70%")
            pil_img = SnapshotCompressor.decompress_to_pil(c_bytes)
            self.assertGreater(pil_img.width, 0)
            self.assertGreater(pil_img.height, 0)

    def test_video_compressor_incident_clip(self):
        """Tests event-gated video clip compression."""
        if os.path.exists(self.sample_video):
            out_clip = os.path.join(BACKEND_DIR, "media", "recordings", "unit_test_clip.mp4")
            _, stats = VideoCompressor.extract_event_evidence_clip(
                self.sample_video, out_clip, trigger_frame=120, lead_frames=10, trail_frames=20
            )
            self.assertTrue(os.path.exists(out_clip))
            self.assertGreater(stats["savings_percent"], 90.0)

if __name__ == "__main__":
    unittest.main()
