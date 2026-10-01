# 🛡️ Intelligent Border Video Analytics Platform (IBVAP)

An intelligent, edge-first border monitoring system that combines **CCTV cameras, radar, AI-based object tracking, behavioral analysis, and secure cloud storage** to detect and record suspicious activities in real time.

The system is designed to continue monitoring even during temporary sensor or network interruptions by maintaining a **persistent local buffer** and asynchronously replicating stored data to the cloud.

---

## 🌐 Network Setup — Important Assumption

> **Note:** The system assumes high-speed **Optical Fiber Cable (OFC)** connectivity is available along the border for communication between surveillance points and the central/cloud infrastructure. This provides high-bandwidth and low-latency connectivity for normal system operation.

---

## 🔗 Quick Links & Media

* 📹 **Video Demo & Pitch:** [Watch Demo on YouTube](https://youtu.be/1okjnzSJWbU?si=OLqSf2DyF5jP6sXB)
* 📄 **Complete Project Report:** [Read Full Technical Report (PDF)](https://drive.google.com/drive/folders/1oznVKYI14lnGX_xuyjn0SQ1rodcpV4Jk?usp=drive_link)

---

## 🌟 Key Highlights

* 🎥 **Dual-Sensor Surveillance:** Combines CCTV and radar for visual, positional, and movement intelligence.
* 🤖 **AI-Based Detection & Tracking:** YOLO detects objects while ByteTrack maintains consistent object identities across frames.
* 📡 **Radar Intelligence:** Tracks target position, range, direction, speed, and movement zones independently.
* 🧠 **Behavior Analysis:** AI analyzes movement patterns to identify potentially suspicious activity.
* 🔐 **Data Integrity:** Event metadata is protected using SHA-256 cryptographic hashing.
* 💾 **Edge-First Processing:** Critical detection and tracking happen locally before data is synchronized with the cloud.
* ♻️ **Persistent Local Buffer:** Temporary connectivity or sensor failures do not immediately interrupt surveillance operations.
* ☁️ **Asynchronous Cloud Sync:** Buffered records are automatically replicated to AWS when connectivity is restored.
* 🚨 **Real-Time Alerts:** Suspicious events can be generated at the edge without waiting for cloud processing.

---

## 🏗️ System Architecture

```text
                    ┌──────────────────┐
                    │  CAMERA PIPELINE │
                    │    Independent   │
                    └────────┬─────────┘
                             │
                        Image Stream
                             │
                             ▼
                    ┌──────────────────┐
                    │                  │
                    │ BACKEND / EDGE   │
                    │    PROCESSING    │
                    │                  │
                    │ • Camera Data    │
                    │ • Radar Data     │
                    │ • Object Data    │
                    │ • Radar IDs      │
                    │ • Timestamps     │
                    └────────┬─────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ SENSOR FUSION & AI   │
                  │                      │
                  │ Camera + Radar Data  │
                  │        ↓             │
                  │ Combined Object      │
                  │        ↓             │
                  │ Behavior Analysis    │
                  │        ↓             │
                  │ 3D CNN / AI          │
                  │        ↓             │
                  │ Normal / Suspicious  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ METADATA FORMATION   │
                  │                      │
                  │ Event ID             │
                  │ Timestamp            │
                  │ Location             │
                  │ Object ID            │
                  │ Threat Level         │
                  │ Radar ID             │
                  │ Image Data           │
                  │ SHA-256 Hash         │
                  └──────────┬───────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
          ┌─────────────────┐  ┌──────────────────┐
          │ BLOCKCHAIN      │  │ LOCAL CACHE /    │
          │ LAYER           │  │ BUFFER           │
          │                 │  │                  │
          │ Create Block    │  │ Event Data       │
          │ Generate Hash   │  │ Images           │
          │ Validate Block  │  │ Radar ID         │
          │ Immutable Ledger│  │ Metadata         │
          └────────┬────────┘  │ Temporary Buffer │
                   │           └────────┬─────────┘
                   │                    │
                   └────────┬───────────┘
                            ▼
                    ┌────────────────┐
                    │   SYNC ENGINE  │
                    │                │
                    │ Monitor Data   │
                    │ Manage Queues  │
                    │ Handle Failures│
                    └───────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
      ┌─────────────────┐       ┌─────────────────┐
      │ PRIMARY PIPELINE│       │ RECOVERY        │
      │ Current Data    │       │ PIPELINE        │
      │ Immediate Upload│       │ Pending Events  │
      └────────┬────────┘       │ Recovery Upload │
               │                └────────┬────────┘
               └──────────────┬──────────┘
                              ▼
                    ┌──────────────────┐
                    │   AWS CLOUD      │
                    │                  │
                    │ S3 → Images /    │
                    │      Video       │
                    │                  │
                    │ DynamoDB →       │
                    │ Metadata / Events│
                    └──────────────────┘
```
---

## 🔄 How the Workflow Works

### 1. 🎥 Camera Pipeline – Visual Intelligence

The camera pipeline analyzes the border environment using computer vision. **YOLO** detects people and vehicles, while **ByteTrack** maintains consistent object identities across video frames. License plate regions are extracted from detected vehicles and processed using **OCR** to obtain plate numbers. Vehicle information can then be verified against authorization or permit records.

### 2. 📡 Radar Pipeline – Movement Intelligence

The radar pipeline independently tracks targets and provides movement information such as position, range, direction, speed, movement path, and detection zone. Each target receives a unique **Radar ID**, separate from the camera or vehicle tracking ID. This allows radar-based monitoring to continue even when the corresponding camera feed is temporarily unavailable.

### 3. 🧠 Edge Processing & Sensor Fusion

The edge processor receives information from both camera and radar pipelines. Object data, Radar IDs, timestamps, and movement information are correlated to build a unified representation of each detected target. The combined data is then analyzed by the AI layer to identify normal or potentially suspicious activity.

### 4. 🚨 Event & Metadata Formation

When relevant or suspicious activity is detected, the system generates a structured security event. Each event can contain the **Event ID, timestamp, location or zone, Object ID, Radar ID, object type, speed, license plate information, threat status, and supporting image or video reference**.

A **SHA-256 hash** is also generated to provide an integrity fingerprint for the recorded event data.

### 5. 🔐 Data Integrity & Persistent Local Buffer

Event records are processed through the integrity layer and maintained in a **persistent local buffer**. The buffer can temporarily store event metadata, images, radar information, and other locally available evidence during temporary network or connectivity interruptions.

The system therefore does not depend entirely on continuous cloud connectivity for critical edge processing and event recording.

### 6. 🔄 Synchronization & Recovery

The **Sync Engine** continuously monitors stored data, manages upload queues, and handles failed transfers. Current events can follow the primary upload pipeline, while previously buffered events are handled through the recovery pipeline.

When connectivity is restored, buffered records are **asynchronously replicated to the cloud** while live edge processing continues.

### 7. ☁️ AWS Cloud Storage

After synchronization, the processed data is stored in AWS for centralized access and long-term storage.

**Amazon S3** stores images, video clips, and other evidence files, while **Amazon DynamoDB** stores structured security events, timestamps, target information, threat metadata, Radar IDs, and integrity hashes.

This creates an end-to-end pipeline:

**Detection → Tracking → Sensor Fusion → AI Analysis → Event Creation → Local Buffer → Synchronization → AWS Cloud**

## 📊 Data Flow

```text
Raw Camera / Radar Data
          ↓
     Edge Processing
          ↓
Detection + Tracking
          ↓
Sensor Fusion
          ↓
AI Analysis
          ↓
Security Event
          ↓
Structured Metadata
          ↓
SHA-256 Integrity Hash
          ↓
Local Buffer
          ↓
Asynchronous Cloud Replication
          ↓
AWS S3 + DynamoDB
```

The architecture reduces unnecessary transmission of raw data by allowing the edge layer to generate and store **compact structured metadata** for long-term analysis.

---

## 🎯 Real-World Applications

* 🌐 International border monitoring
* 🪖 Restricted military installations
* 🏭 Critical infrastructure protection
* 🚧 Restricted-entry zones
* 🌙 Night-time surveillance
* 🌫️ Low-visibility monitoring using radar-assisted tracking

---

## 🛠️ Technologies Used

| Category        | Technologies                       | Purpose                                   |
| --------------- | ---------------------------------- | ----------------------------------------- |
| Computer Vision | OpenCV, YOLO, ByteTrack            | Object detection and tracking             |
| OCR             | PaddleOCR / EasyOCR                | License plate recognition                 |
| AI / ML         | PyTorch, 3D CNN                    | Behavioral analysis                       |
| Radar           | Radar Tracking Module              | Range, speed, direction and zone tracking |
| Edge Processing | Python, Industrial PC / NVIDIA GPU | Local real-time processing                |
| Data Integrity  | SHA-256                            | Event integrity verification              |
| Local Storage   | SSD / NVMe                         | Persistent local buffering                |
| Cloud Storage   | AWS S3                             | Images, videos and evidence               |
| Cloud Database  | AWS DynamoDB                       | Structured event metadata                 |
| Connectivity    | Optical Fiber (OFC)                | High-speed network communication          |

---
Reliability & Fault Handling

The system is designed to handle temporary component failures.

Failure Scenario	            System Response
Camera disconnected 	        Radar continues tracking
Camera unavailable	            Radar data continues reaching backend
Temporary data transfer issue	Data remains in local cache
Pending events	                Added to recovery queue
Connection restored	            Recovery pipeline uploads pending data
Normal operation	            Primary pipeline uploads current events
Cloud synchronization delay	    Local records remain available until synchronization

This creates a persistent local buffer + asynchronous recovery architecture instead of depending entirely on uninterrupted cloud connectivity.
---

## 📁 Project Outputs

The system generates multiple outputs during processing, including:

* 🎥 Processed surveillance video
* 📡 Radar tracking video
* 📋 Surveillance metadata
* 🚨 Security event records
* 🚗 Vehicle tracking information
* 🔤 License plate recognition results
* 👤 Person authorization results
* 💾 Locally buffered records for recovery

---

## ⚡ Quick Start

### Prerequisites

* Python 3.10+
* NVIDIA GPU recommended for accelerated inference
* Git
* AWS account for cloud integration
* Camera/radar input or sample datasets

### Installation

```bash
# Clone repository
git clone https://github.com/tanishq13-tech/team-siryon

cd border-surveillance-system

# Create virtual environment
python -m venv venv

# Activate environment
# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Create the required configuration/environment file and provide:

```text
Camera configuration
Radar configuration
AWS configuration
Storage paths
Model paths
```

> **Security:** Never commit AWS access keys, passwords, tokens, or other secrets to GitHub. Store credentials through environment variables or an appropriate secrets-management mechanism.

### Run

```bash
python main.py --config config/edge_config.yaml
```

---

## 🚀 Future Enhancements

* Multi-camera and multi-radar coordination
* Improved camera-radar target association
* Advanced anomaly detection
* Automated threat prioritization
* Centralized real-time monitoring dashboard
* Multi-site border deployment
* Model optimization for edge devices
* Improved long-term behavioral analytics

---

## 🏆 Project Goal

The goal of this project is to build a **reliable, AI-powered and edge-first border surveillance architecture** where cameras provide visual intelligence, radar provides movement intelligence, AI identifies potentially suspicious behavior, and cloud infrastructure provides scalable long-term storage and analysis.

The combination of **AI + Computer Vision + Radar + Edge Computing + Cloud + Secure Data Management** enables continuous monitoring while reducing dependence on uninterrupted cloud connectivity.
