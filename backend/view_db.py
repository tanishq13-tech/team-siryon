"""
IBVAP Unified Database Inspector
SIH 2026 Problem Statement - AI Video Analytics Platform

Inspects either:
1. Edge Node SQLite DB (backend/ibvap_surveillance.db)
2. Central Cloud SQLite DB (backend/cloud_surveillance.db)
"""

import os
import sys
import sqlite3
import argparse

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
EDGE_DB_PATH = os.path.join(BACKEND_DIR, "ibvap_surveillance.db")
CLOUD_DB_PATH = os.path.join(BACKEND_DIR, "cloud_surveillance.db")

def inspect_db(db_path: str, db_name: str, tables: list):
    if not os.path.exists(db_path):
        print(f"[!] Database file not found: {db_path}")
        return

    print("\n" + "="*75)
    print(f" [DB INSPECTOR] {db_name.upper()} ({os.path.basename(db_path)}) ")
    print("="*75)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    for table in tables:
        try:
            rows = cursor.execute(f"SELECT * FROM {table} LIMIT 10").fetchall()
            count = cursor.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"\n[+] TABLE: '{table}' ({count} Total Records, Showing top {len(rows)})")
            print("-" * 75)
            if not rows:
                print("    (Empty table)")
            else:
                for idx, r in enumerate(rows, 1):
                    d = dict(r)
                    summary = ", ".join(f"{k}={v}" for k, v in list(d.items())[:6])
                    print(f"    [{idx}] {summary}")
        except Exception as e:
            print(f"    [!] Error reading table {table}: {e}")

    conn.close()
    print("="*75)

def view_all():
    parser = argparse.ArgumentParser(description="IBVAP Unified Database Inspector")
    parser.add_argument("--db", choices=["edge", "cloud", "all"], default="all", help="Which database to inspect")
    args = parser.parse_args()

    if args.db in ["edge", "all"]:
        edge_tables = ["cameras", "video_recordings", "vehicle_detections", "person_detections", "object_detections", "intrusion_events"]
        inspect_db(EDGE_DB_PATH, "Edge Node Local Database", edge_tables)

    if args.db in ["cloud", "all"]:
        cloud_tables = ["cloud_ingestion_audit", "cloud_intrusion_events", "cloud_media_files", "cloud_metadata_records"]
        inspect_db(CLOUD_DB_PATH, "Central Cloud Server Database", cloud_tables)

if __name__ == "__main__":
    view_all()
