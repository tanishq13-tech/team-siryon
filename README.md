# Intelligent Border Video Analytics Platform (IBVAP)
### Multi-Modal Surveillance Data Compression & Cloud Synchronization Engine
**Smart India Hackathon (SIH 187)**

---

## 📌 Executive Summary

Remote border surveillance outposts and Border Outposts (BOPs) operate under extreme network bandwidth constraints (e.g. 64 kbps satellite links, tactical radio, or degraded 2G). Transmitting raw continuous CCTV feeds (65+ MB per minute) or raw telemetry over these channels is operationally impossible.

**IBVAP** solves this challenge through a **Multi-Modal Domain-Specific Compression Suite**:
1. **Metadata Compressor** (97.6% savings, 41.8x ratio, < 8 ms): Columnar delta-encoding, stream manifest decoupling, and categorical dictionary tokenization on surveillance CSV detections with 100% lossless fidelity.
2. **Video Compressor** (99.88% savings, 835x ratio, ~1.0 s): Event-gated incident clip extraction (pre/post trigger burst) with adaptive resolution downscaling (360p) and frame decimation.
3. **Snapshot Compressor** (85–89% savings, < 2 ms): High-efficiency forensic WebP quantization preserving high-frequency edges for ANPR plates and facial recognition.
4. **Alert Compressor** (83.4% savings, 50 µs): Compact 36-byte binary C-struct serialization for tactical satellite radio short-burst messaging.

---

## 📊 Measured Compression & Bandwidth Audit

Measured on actual surveillance CCTV feed and reference telemetry (655 detection records):

| Surveillance Modality | Specialized Compressor | Raw Original Size | Compressed Size | Reduction Ratio | Bandwidth Saved | Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Detection Metadata (CSV)** | `backend/metadata_compressor.py` | **72.14 KB** | **1.72 KB** | **41.87x** | **97.61%** | **7.9 ms** |
| **CCTV Incident Video** | `backend/video_compressor.py` | **65.17 MB** | **0.08 MB (81 KB)** | **835.0x** | **99.88%** | **1.07 s** |
| **Forensic Face Crop** | `backend/snapshot_compressor.py` | **866 Bytes** | **104 Bytes** | **8.33x** | **87.99%** | **< 2 ms** |
| **Forensic License Plate** | `backend/snapshot_compressor.py` | **1,650 Bytes** | **240 Bytes** | **6.88x** | **85.45%** | **< 2 ms** |
| **Emergency Breach Alert** | `backend/alert_compressor.py` | **217 Bytes** | **36 Bytes** | **6.03x** | **83.41%** | **~50 µs** |
| **OVERALL SYSTEM TOTAL** | **Full Multi-Modal Suite** | **65.25 MB** | **0.085 MB (85 KB)** | **767.6x** | **99.87%** | **Real-time** |

---

## 🗂️ Clean Project Directory Structure

```
ibvap_surveillance/
│
├── backend/                                # Core Engine & Compression Modules
│   ├── alert_compressor.py                 # 36-Byte Binary Satcom Alert Compressor
│   ├── metadata_compressor.py              # Delta-Time + Columnar + Dict CSV Compressor
│   ├── snapshot_compressor.py              # Forensic WebP Faces/Plates Compressor
│   ├── video_compressor.py                 # Event-Gated Adaptive Bitrate Video Compressor
│   ├── cloud_sync_engine.py                # Priority Queue Sync Agent (Alerts > Meta > Snaps > Video)
│   ├── cloud_server.py                     # Central Ingestion REST API & Web Dashboard (Port 5050)
│   ├── database.py                         # Edge SQLite Surveillance Database Manager
│   ├── schema.sql                          # Edge Surveillance DB DDL Schema
│   ├── view_db.py                          # Unified DB Inspector (Edge & Cloud DBs)
│   │
│   ├── data/
│   │   ├── sample_metadata.csv             # 655-row Reference Telemetry CSV
│   │   └── sample_metadata.csv.ibmd        # Lossless compressed binary metadata payload
│   │
│   ├── media/
│   │   ├── snapshots/                      # Raw crops (.jpg) & optimized crops (.webp)
│   │   └── recordings/                     # Extracted incident evidence clips (.mp4)
│   │
│   ├── cloud_storage/                      # Central cloud storage for ingested media
│   ├── cloud_surveillance.db               # Central Cloud Ingest Database
│   └── ibvap_surveillance.db               # Edge Node Local Surveillance Database
│
├── tests/                                  # Automated Test Suites
│   ├── test_compression_suite.py           # Multi-Modal Compression Unit Tests (4/4 Passing)
│   └── test_database.py                    # Edge Database Unit Tests
│
├── web_ui/                                 # Operator Visual Dashboards
│   ├── backend_dashboard.html              # Edge Station Surveillance HTML Console
│   └── border_cctv_simulator.html          # Virtual CCTV Camera Feed Simulator HTML
│
├── border_checkpost_raw_feed.mp4           # Reference 1080p CCTV Footage (68 MB)
├── real_human_surveillance.avi             # Reference Human Detection Surveillance Clip (8 MB)
│
├── run_cloud_sync_demo.py                  # One-Click Multi-Modal Compression & Cloud Sync Runner
├── run_live_pipeline.py                    # Live Video -> AI Detection -> Edge DB -> Cloud Sync
├── requirements.txt                        # Python Dependencies
└── README.md                               # System Documentation & Usage Guide
```

---

## 🚀 Quickstart & Execution Guide

### 1. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 2. Run the End-to-End Compression & Cloud Sync Demo
Launches the Cloud Ingestion Server, compresses all 4 modalities, uploads them, and prints the audit table:
```powershell
python run_cloud_sync_demo.py
```

### 3. Access the Live Web Dashboard
Open your browser and navigate to:
```
http://localhost:5050
```
* View live compression gauges (99.87% saved).
* Inspect all 655 decompressed telemetry rows stored in `cloud_surveillance.db`.
* Trigger sync runs directly with interactive UI buttons.

### 4. Run Automated Test Suites
```powershell
python tests/test_compression_suite.py
python tests/test_database.py
```

### 5. Run Live Edge Detection Pipeline
Processes video frames, extracts crops, records to SQLite, and automatically syncs to cloud:
```powershell
python run_live_pipeline.py
```

### 6. Inspect Databases
View both Edge DB and Cloud Server DB tables:
```powershell
python backend/view_db.py --db=all
```
*(Options: `--db=edge`, `--db=cloud`, or `--db=all`)*
