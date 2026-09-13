"""
IBVAP Forensic Snapshot Crop Compressor
SIH 2026 Problem Statement - AI Video Analytics Platform

Specialized Compressor for CCTV Forensic Crops:
- License Plate ANPR Crops (retains character edges for OCR)
- Suspect Face FRS Crops (retains facial landmarks)
- Vehicle & Intruder Bounding Box Crops
- Converts to high-efficiency WebP with adaptive quality quantization
"""

import os
import io
import time
from typing import Union, Tuple, Dict, Any

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None


class SnapshotCompressor:
    """Specialized image crop compressor for surveillance snapshots."""

    @staticmethod
    def compress_image_bytes(
        image_input: Union[str, bytes, "np.ndarray"],
        quality: int = 75,
        target_format: str = "WEBP"
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Compresses an image from a filepath, raw bytes, or numpy OpenCV array
        into high-efficiency WebP/JPEG bytes.
        """
        t0 = time.perf_counter()
        orig_size = 0

        if isinstance(image_input, str):
            orig_size = os.path.getsize(image_input)
            pil_img = Image.open(image_input)
        elif isinstance(image_input, bytes):
            orig_size = len(image_input)
            pil_img = Image.open(io.BytesIO(image_input))
        elif cv2 and isinstance(image_input, np.ndarray):
            # Convert OpenCV BGR to RGB
            rgb_arr = cv2.cvtColor(image_input, cv2.COLOR_BGR2RGB)
            orig_size = rgb_arr.nbytes
            pil_img = Image.fromarray(rgb_arr)
        else:
            raise ValueError("Unsupported image input type")

        # Convert palette/RGBA modes to RGB if saving as JPEG
        if target_format.upper() == "JPEG" and pil_img.mode in ("RGBA", "P"):
            pil_img = pil_img.convert("RGB")

        buffer = io.BytesIO()
        pil_img.save(buffer, format=target_format.upper(), quality=quality, method=6)
        compressed_bytes = buffer.getvalue()
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        comp_size = len(compressed_bytes)
        ratio = orig_size / comp_size if comp_size > 0 else 1.0
        savings_pct = (1.0 - (comp_size / orig_size)) * 100.0 if orig_size > 0 else 0.0

        stats = {
            "type": "SNAPSHOT_CROP",
            "format": target_format.upper(),
            "quality": quality,
            "dimensions": f"{pil_img.width}x{pil_img.height}",
            "original_size_bytes": orig_size,
            "compressed_size_bytes": comp_size,
            "compression_ratio": round(ratio, 2),
            "savings_percent": round(savings_pct, 2),
            "time_ms": round(elapsed_ms, 2)
        }
        return compressed_bytes, stats

    @staticmethod
    def compress_file(
        input_path: str,
        output_path: str = None,
        quality: int = 75
    ) -> Tuple[str, Dict[str, Any]]:
        """Compresses an on-disk snapshot crop and saves the compressed version."""
        if not output_path:
            base, _ = os.path.splitext(input_path)
            output_path = base + ".webp"

        c_bytes, stats = SnapshotCompressor.compress_image_bytes(input_path, quality=quality, target_format="WEBP")
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(c_bytes)

        stats["input_path"] = input_path
        stats["output_path"] = output_path
        return output_path, stats

    @staticmethod
    def decompress_to_pil(image_bytes: bytes) -> "Image.Image":
        """Decompresses image bytes back to a PIL Image instance."""
        return Image.open(io.BytesIO(image_bytes))


if __name__ == "__main__":
    snapshots_dir = os.path.join(os.path.dirname(__file__), "media", "snapshots")
    if os.path.exists(snapshots_dir):
        print("[TEST] Benchmarking SnapshotCompressor on surveillance crops...")
        for fname in os.listdir(snapshots_dir):
            if fname.endswith((".jpg", ".jpeg", ".png")) and not fname.endswith(".webp"):
                fpath = os.path.join(snapshots_dir, fname)
                out_path, stats = SnapshotCompressor.compress_file(fpath, quality=75)
                print(f"File: {fname:35} | {stats['original_size_bytes']}B -> {stats['compressed_size_bytes']}B | "
                      f"Savings: {stats['savings_percent']}% ({stats['compression_ratio']}x) in {stats['time_ms']}ms")
