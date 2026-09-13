"""
IBVAP Emergency Security Alert Binary Telemetry Compressor
SIH 2026 Problem Statement - AI Video Analytics Platform

Specialized Ultra-Low Latency Alert Compressor for Satellite Burst / Tactical Radio:
- Packs critical intrusion events into fixed 36-byte binary struct
- Zero JSON overhead (<50 bytes per mission-critical event)
- Compatible with Iridium SBD, LoRaWAN, and tactical military radios
"""

import struct
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

ALERT_MAGIC = b"\x18\x07"  # SIH 187 Magic Identifier

EVENT_TYPE_MAP = {
    "UNKNOWN": 0,
    "PERIMETER_BREACH": 1,
    "CHECKPOST_VEHICLE_INSPECTION": 2,
    "UNAUTHORIZED_PERSON": 3,
    "SUSPICIOUS_VEHICLE": 4,
    "WEAPON_DETECTED": 5,
    "BORDER_FENCE_INTRUSION": 6
}
INV_EVENT_TYPE_MAP = {v: k for k, v in EVENT_TYPE_MAP.items()}

SEVERITY_MAP = {
    "INFO": 0,
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4
}
INV_SEVERITY_MAP = {v: k for k, v in SEVERITY_MAP.items()}

# Binary format:
# Magic (2B) + EventType (1B) + Severity (1B) + TrackID (4B) +
# EpochMs (8B) + Lat (4B float) + Lng (4B float) + CamShortId (12B ascii)
# Total = 2 + 1 + 1 + 4 + 8 + 4 + 4 + 12 = 36 Bytes!
STRUCT_FORMAT = "!2sBB I Q ff 12s"
STRUCT_SIZE = struct.calcsize(STRUCT_FORMAT)

class AlertCompressor:
    """Encodes and decodes ultra-compact binary surveillance alerts."""

    @staticmethod
    def compress_alert(alert: Dict[str, Any]) -> Tuple[bytes, Dict[str, Any]]:
        """
        Compresses an alert dictionary into a compact 36-byte binary struct.
        """
        t0 = time.perf_counter()
        raw_json_str = json.dumps(alert)
        orig_bytes_len = len(raw_json_str.encode('utf-8'))

        event_type_str = str(alert.get("event_type", "UNKNOWN")).upper()
        event_code = EVENT_TYPE_MAP.get(event_type_str, 0)

        severity_str = str(alert.get("severity", "CRITICAL" if "BREACH" in event_type_str else "MEDIUM")).upper()
        severity_code = SEVERITY_MAP.get(severity_str, 3)

        track_id = int(alert.get("track_id", 0))

        # Parse or default timestamp to epoch milliseconds
        ts = alert.get("timestamp")
        if isinstance(ts, (int, float)):
            epoch_ms = int(ts * 1000) if ts < 1e11 else int(ts)
        elif isinstance(ts, str):
            try:
                # Handle ISO 8601
                clean_ts = ts.replace("Z", "+00:00")
                dt = datetime.fromisoformat(clean_ts)
                epoch_ms = int(dt.timestamp() * 1000)
            except Exception:
                epoch_ms = int(time.time() * 1000)
        else:
            epoch_ms = int(time.time() * 1000)

        geo_lat = float(alert.get("geo_lat", 31.6241))
        geo_lng = float(alert.get("geo_lng", 74.5821))

        cam_id = str(alert.get("camera_id", "CAM_01"))[:12].ljust(12)
        cam_bytes = cam_id.encode('ascii', errors='ignore')

        binary_packet = struct.pack(
            STRUCT_FORMAT,
            ALERT_MAGIC,
            event_code,
            severity_code,
            track_id,
            epoch_ms,
            geo_lat,
            geo_lng,
            cam_bytes
        )

        elapsed_us = (time.perf_counter() - t0) * 1_000_000.0
        comp_size = len(binary_packet)
        ratio = orig_bytes_len / comp_size if comp_size > 0 else 1.0
        savings_pct = (1.0 - (comp_size / orig_bytes_len)) * 100.0

        stats = {
            "type": "EMERGENCY_ALERT",
            "original_size_bytes": orig_bytes_len,
            "compressed_size_bytes": comp_size,
            "compression_ratio": round(ratio, 2),
            "savings_percent": round(savings_pct, 2),
            "time_microseconds": round(elapsed_us, 2)
        }
        return binary_packet, stats

    @staticmethod
    def decompress_alert(packet: bytes) -> Dict[str, Any]:
        """
        Unpacks a 36-byte binary struct back into a full alert dictionary.
        """
        if len(packet) != STRUCT_SIZE:
            raise ValueError(f"Invalid alert packet size: expected {STRUCT_SIZE}, got {len(packet)}")

        magic, event_code, severity_code, track_id, epoch_ms, geo_lat, geo_lng, cam_bytes = struct.unpack(
            STRUCT_FORMAT, packet
        )

        if magic != ALERT_MAGIC:
            raise ValueError("Invalid alert packet magic header")

        iso_time = datetime.fromtimestamp(epoch_ms / 1000.0, timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

        return {
            "event_type": INV_EVENT_TYPE_MAP.get(event_code, "UNKNOWN"),
            "severity": INV_SEVERITY_MAP.get(severity_code, "INFO"),
            "track_id": track_id,
            "timestamp": iso_time,
            "geo_lat": round(geo_lat, 6),
            "geo_lng": round(geo_lng, 6),
            "camera_id": cam_bytes.decode('ascii', errors='ignore').strip()
        }


if __name__ == "__main__":
    sample_alert = {
        "event_id": "evt-7721-sector4",
        "camera_id": "BOP_SEC4_01",
        "event_type": "PERIMETER_BREACH",
        "severity": "CRITICAL",
        "track_id": 42,
        "geo_lat": 31.624185,
        "geo_lng": 74.582193,
        "timestamp": "2026-09-05T11:45:00.000Z",
        "snapshot_path": "backend/media/snapshots/person_track_42_frame180.jpg"
    }

    print("[TEST] Benchmarking AlertCompressor on sample security breach...")
    packet, stats = AlertCompressor.compress_alert(sample_alert)
    print(f"Original JSON Size : {stats['original_size_bytes']} bytes")
    print(f"Binary Packet Size : {stats['compressed_size_bytes']} bytes")
    print(f"Compression Ratio  : {stats['compression_ratio']}x (SAVINGS: {stats['savings_percent']}%) in {stats['time_microseconds']} us")

    restored = AlertCompressor.decompress_alert(packet)
    print(f"Restored Alert: {restored}")
    assert restored["event_type"] == "PERIMETER_BREACH"
    assert restored["track_id"] == 42
    print("[SUCCESS] Alert telemetry verified!")
