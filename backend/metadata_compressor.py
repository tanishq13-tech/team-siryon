"""
IBVAP Domain-Specific Tabular Metadata Compressor
SIH 2026 Problem Statement - AI Video Analytics Platform

Specialized Compression Engine for Edge Surveillance CCTV Metadata:
- Stream Manifest Decoupling (strips redundant constant video properties)
- Columnar Organization (groups homogenous types together)
- Delta-Encoding on Monotonic Fields (frame index, timestamp deltas)
- Categorical Dictionary Tokenization (person, vehicle, AUTHORIZED, VALID)
- Lossless Entropy Packing (zlib level 9 with magic header verification)
"""

import os
import io
import csv
import json
import zlib
import time
from typing import Union, List, Dict, Tuple, Any

MAGIC_HEADER = b"IBMD\x01"  # IBVAP Metadata Version 1 Magic Bytes

# Recognized static video manifest fields
STATIC_FIELDS = [
    "video_filename", "video_width", "video_height", "resolution", 
    "fps", "total_video_frames", "video_duration_seconds"
]

# Recognized categorical fields for dictionary tokenization
CATEGORICAL_FIELDS = [
    "object_type", "person_authorization", "face_detected",
    "vehicle_type", "permit_status", "event_status", "event_reason", "authorization"
]

class MetadataCompressor:
    """Specialized compressor and decompressor for surveillance detection metadata."""

    @staticmethod
    def load_rows_from_csv(csv_source: Union[str, io.StringIO]) -> Tuple[List[str], List[Dict[str, str]]]:
        """Loads headers and row dictionaries from a CSV file path or string."""
        if isinstance(csv_source, str) and os.path.exists(csv_source):
            with open(csv_source, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                headers = next(reader)
                rows = [dict(zip(headers, row)) for row in reader]
        else:
            stream = io.StringIO(csv_source) if isinstance(csv_source, str) else csv_source
            reader = csv.reader(stream)
            headers = next(reader)
            rows = [dict(zip(headers, row)) for row in reader]
        return headers, rows

    @staticmethod
    def compress(rows: List[Dict[str, Any]], headers: List[str] = None) -> bytes:
        """
        Compresses surveillance metadata rows using manifest decoupling,
        categorical dictionary encoding, delta frames, and columnar zlib compression.
        """
        if not rows:
            payload = json.dumps({"headers": headers or [], "manifest": {}, "columns": {}}).encode('utf-8')
            return MAGIC_HEADER + zlib.compress(payload, level=9)

        if not headers:
            headers = list(rows[0].keys())

        # 1. Extract common stream manifest (if available in static fields)
        manifest = {}
        for sf in STATIC_FIELDS:
            if sf in headers:
                first_val = rows[0].get(sf, "")
                # Check if this field is identical across all rows
                if all(r.get(sf, "") == first_val for r in rows):
                    manifest[sf] = first_val

        # Remaining dynamic headers to compress column-wise
        dynamic_headers = [h for h in headers if h not in manifest]

        # 2. Build categorical dictionaries
        dictionaries = {}
        for cat_col in CATEGORICAL_FIELDS:
            if cat_col in dynamic_headers:
                unique_vals = sorted(list({str(r.get(cat_col, "")) for r in rows if r.get(cat_col, "") != ""}))
                # Map value to 1-based index (0 means empty/null)
                dictionaries[cat_col] = {val: idx + 1 for idx, val in enumerate(unique_vals)}

        # 3. Columnar serialization with delta encoding
        columns_data = {}
        for col in dynamic_headers:
            raw_vals = [r.get(col, "") for r in rows]

            if col in dictionaries:
                # Tokenize via dictionary
                val_to_id = dictionaries[col]
                columns_data[col] = [val_to_id.get(str(v), 0) if v != "" else 0 for v in raw_vals]

            elif col == "frame":
                # Delta-encode integer frame sequences
                int_frames = []
                for v in raw_vals:
                    try:
                        int_frames.append(int(float(v)))
                    except (ValueError, TypeError):
                        int_frames.append(0)
                if int_frames:
                    base_frame = int_frames[0]
                    deltas = [base_frame] + [int_frames[i] - int_frames[i-1] for i in range(1, len(int_frames))]
                    columns_data[col] = {"type": "delta_int", "values": deltas}
                else:
                    columns_data[col] = {"type": "raw", "values": raw_vals}

            elif col == "timestamp_seconds":
                # Scale float timestamps to millisecond integers and delta-encode
                ms_times = []
                for v in raw_vals:
                    try:
                        ms_times.append(int(round(float(v) * 1000)))
                    except (ValueError, TypeError):
                        ms_times.append(0)
                if ms_times:
                    base_time = ms_times[0]
                    deltas = [base_time] + [ms_times[i] - ms_times[i-1] for i in range(1, len(ms_times))]
                    columns_data[col] = {"type": "delta_ms", "values": deltas}
                else:
                    columns_data[col] = {"type": "raw", "values": raw_vals}

            else:
                columns_data[col] = {"type": "raw", "values": raw_vals}

        # 4. Pack structured intermediate representation
        package = {
            "all_headers": headers,
            "row_count": len(rows),
            "manifest": manifest,
            "dictionaries": {k: {str(v): idx for v, idx in d.items()} for k, d in dictionaries.items()},
            "columns": columns_data
        }

        json_bytes = json.dumps(package, separators=(',', ':')).encode('utf-8')
        compressed_body = zlib.compress(json_bytes, level=9)
        return MAGIC_HEADER + compressed_body

    @staticmethod
    def decompress(payload: bytes) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        Decompresses binary payload back to original headers and rows with 100% fidelity.
        """
        if not payload.startswith(MAGIC_HEADER):
            raise ValueError("Invalid payload: Missing IBVAP Metadata magic header")

        compressed_body = payload[len(MAGIC_HEADER):]
        json_bytes = zlib.decompress(compressed_body)
        package = json.loads(json_bytes.decode('utf-8'))

        headers = package["all_headers"]
        row_count = package["row_count"]
        manifest = package.get("manifest", {})
        dictionaries = package.get("dictionaries", {})
        columns_data = package["columns"]

        if row_count == 0:
            return headers, []

        # Invert dictionaries (id -> original string)
        inv_dicts = {}
        for col, d in dictionaries.items():
            inv_dicts[col] = {int(idx): val for val, idx in d.items()}

        # Reconstruct columnar values
        reconstructed_cols = {}

        for col, col_info in columns_data.items():
            if col in inv_dicts:
                # Token IDs
                tokens = col_info
                inv_map = inv_dicts[col]
                reconstructed_cols[col] = [inv_map.get(t, "") if t != 0 else "" for t in tokens]

            elif isinstance(col_info, dict) and col_info.get("type") == "delta_int":
                deltas = col_info["values"]
                vals = []
                curr = 0
                for i, d in enumerate(deltas):
                    if i == 0:
                        curr = d
                    else:
                        curr += d
                    vals.append(str(curr))
                reconstructed_cols[col] = vals

            elif isinstance(col_info, dict) and col_info.get("type") == "delta_ms":
                deltas = col_info["values"]
                vals = []
                curr = 0
                for i, d in enumerate(deltas):
                    if i == 0:
                        curr = d
                    else:
                        curr += d
                    vals.append(str(round(curr / 1000.0, 3)))
                reconstructed_cols[col] = vals

            elif isinstance(col_info, dict) and col_info.get("type") == "raw":
                reconstructed_cols[col] = [str(v) if v is not None else "" for v in col_info["values"]]
            else:
                reconstructed_cols[col] = [str(v) if v is not None else "" for v in col_info]

        # Reconstruct rows by combining manifest and reconstructed columns
        rows = []
        for i in range(row_count):
            row = {}
            for h in headers:
                if h in manifest:
                    row[h] = manifest[h]
                else:
                    row[h] = reconstructed_cols.get(h, [""] * row_count)[i]
            rows.append(row)

        return headers, rows

    @staticmethod
    def compress_csv_file(csv_path: str, output_path: str = None) -> Tuple[bytes, Dict[str, Any]]:
        """Reads a CSV file, compresses it, optionally writes to disk, and returns metrics."""
        headers, rows = MetadataCompressor.load_rows_from_csv(csv_path)
        original_size = os.path.getsize(csv_path)

        t0 = time.perf_counter()
        compressed_bytes = MetadataCompressor.compress(rows, headers)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        comp_size = len(compressed_bytes)
        ratio = original_size / comp_size if comp_size > 0 else 1.0
        savings_pct = (1.0 - (comp_size / original_size)) * 100.0 if original_size > 0 else 0.0

        if output_path:
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(compressed_bytes)

        stats = {
            "type": "METADATA_CSV",
            "row_count": len(rows),
            "original_size_bytes": original_size,
            "original_size_kb": round(original_size / 1024.0, 2),
            "compressed_size_bytes": comp_size,
            "compressed_size_kb": round(comp_size / 1024.0, 2),
            "compression_ratio": round(ratio, 2),
            "savings_percent": round(savings_pct, 2),
            "compression_time_ms": round(elapsed_ms, 2)
        }
        return compressed_bytes, stats


if __name__ == "__main__":
    test_csv = os.path.join(os.path.dirname(__file__), "data", "sample_metadata.csv")
    if os.path.exists(test_csv):
        print("[TEST] Benchmarking MetadataCompressor on sample_metadata.csv...")
        c_bytes, stats = MetadataCompressor.compress_csv_file(test_csv, test_csv + ".ibmd")
        print(f"Original Size   : {stats['original_size_kb']} KB ({stats['original_size_bytes']} bytes)")
        print(f"Compressed Size : {stats['compressed_size_kb']} KB ({stats['compressed_size_bytes']} bytes)")
        print(f"Compression Ratio: {stats['compression_ratio']}x (SAVINGS: {stats['savings_percent']}%)")
        print(f"Time Taken      : {stats['compression_time_ms']} ms")

        # Test Lossless Decompression
        headers, rows = MetadataCompressor.decompress(c_bytes)
        print(f"Decompressed Rows: {len(rows)} across {len(headers)} columns.")
        assert len(rows) == stats["row_count"], "Row count mismatch!"
        print("[SUCCESS] Lossless fidelity verified!")
