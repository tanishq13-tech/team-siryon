-- IBVAP Border Surveillance Database Schema
-- SIH 2026 Problem Statement - AI Video Analytics Platform
-- Supports Page 1 Sensor Fusion, Page 2 15-Day Local Retention, and Page 3 Cloud Sync

PRAGMA foreign_keys = ON;

-- 1. CAMERAS TABLE
CREATE TABLE IF NOT EXISTS cameras (
    camera_id VARCHAR(50) PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL,
    bop_sector VARCHAR(50) NOT NULL,
    rtsp_url VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 24-HOUR VIDEO RECORDINGS TABLE
CREATE TABLE IF NOT EXISTS video_recordings (
    recording_id VARCHAR(36) PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_seconds INTEGER NOT NULL,
    file_size_mb FLOAT NOT NULL,
    recording_type VARCHAR(30) DEFAULT 'CONTINUOUS_24H',
    sync_status VARCHAR(20) DEFAULT 'PENDING',
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(camera_id) ON DELETE CASCADE
);

-- 3. VEHICLE DETECTIONS TABLE (ANPR & ByteTrack)
CREATE TABLE IF NOT EXISTS vehicle_detections (
    detection_id VARCHAR(36) PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    vehicle_track_id INTEGER NOT NULL,
    frame_index INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    vehicle_type VARCHAR(30) DEFAULT 'SUV',
    vehicle_photo_path VARCHAR(255) NOT NULL,
    license_plate_number VARCHAR(20) NOT NULL,
    plate_photo_path VARCHAR(255) NOT NULL,
    confidence FLOAT DEFAULT 0.95,
    bbox_json VARCHAR(100) NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'PENDING',
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(camera_id) ON DELETE CASCADE
);

-- 4. PERSON DETECTIONS TABLE (Person Crops & FRS)
CREATE TABLE IF NOT EXISTS person_detections (
    detection_id VARCHAR(36) PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    person_track_id INTEGER NOT NULL,
    frame_index INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    person_photo_path VARCHAR(255) NOT NULL,
    face_photo_path VARCHAR(255) NOT NULL,
    frs_suspect_name VARCHAR(100) DEFAULT 'UNKNOWN',
    behavior_tag VARCHAR(50) DEFAULT 'WALKING',
    confidence FLOAT DEFAULT 0.94,
    bbox_json VARCHAR(100) NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'PENDING',
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(camera_id) ON DELETE CASCADE
);

-- 5. OBJECT DETECTIONS TABLE (Weapons/Baggage)
CREATE TABLE IF NOT EXISTS object_detections (
    detection_id VARCHAR(36) PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    object_track_id INTEGER NOT NULL,
    associated_person_track_id INTEGER,
    object_type VARCHAR(50) NOT NULL,
    object_photo_path VARCHAR(255) NOT NULL,
    confidence FLOAT DEFAULT 0.90,
    timestamp TIMESTAMP NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'PENDING',
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(camera_id) ON DELETE CASCADE
);

-- 6. INTRUSION EVENTS TABLE (Real-time Border Alerts)
CREATE TABLE IF NOT EXISTS intrusion_events (
    event_id VARCHAR(36) PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    track_id INTEGER NOT NULL,
    snapshot_path VARCHAR(255) NOT NULL,
    geo_lat FLOAT DEFAULT 31.6241,
    geo_lng FLOAT DEFAULT 74.5821,
    timestamp TIMESTAMP NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'PENDING',
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(camera_id) ON DELETE CASCADE
);

-- 7. RADAR TRACKS TABLE (Page 1 Radar Processing & Tracking)
CREATE TABLE IF NOT EXISTS radar_tracks (
    track_record_id VARCHAR(36) PRIMARY KEY,
    radar_id VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    range_meters FLOAT NOT NULL,
    azimuth_deg FLOAT NOT NULL,
    velocity_mps FLOAT NOT NULL,
    heading_deg FLOAT NOT NULL,
    x_pos FLOAT NOT NULL,
    y_pos FLOAT NOT NULL,
    status VARCHAR(30) DEFAULT 'TRACKING',
    timestamp TIMESTAMP NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'PENDING',
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. COMBINED OBJECTS TABLE (Page 1 & 2 Sensor Fusion & Behavior Analysis)
CREATE TABLE IF NOT EXISTS combined_objects (
    combined_id VARCHAR(36) PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    visual_track_id INTEGER,
    radar_id VARCHAR(50),
    object_type VARCHAR(50) NOT NULL,
    visual_bbox_json VARCHAR(100),
    license_plate VARCHAR(50),
    person_id VARCHAR(100),
    range_meters FLOAT NOT NULL,
    azimuth_deg FLOAT NOT NULL,
    velocity_mps FLOAT NOT NULL,
    classification VARCHAR(20) DEFAULT 'NORMAL',  -- NORMAL or ALERT
    behavior_label VARCHAR(50) DEFAULT 'TRANSIT',
    threat_score FLOAT DEFAULT 0.0,
    timestamp TIMESTAMP NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'PENDING',
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR FAST QUERY PERFORMANCE & 15-DAY RETENTION PURGING
CREATE INDEX IF NOT EXISTS idx_veh_plate ON vehicle_detections(license_plate_number);
CREATE INDEX IF NOT EXISTS idx_veh_track ON vehicle_detections(vehicle_track_id);
CREATE INDEX IF NOT EXISTS idx_person_track ON person_detections(person_track_id);
CREATE INDEX IF NOT EXISTS idx_recording_time ON video_recordings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_veh_sync ON vehicle_detections(sync_status, timestamp);
CREATE INDEX IF NOT EXISTS idx_person_sync ON person_detections(sync_status, timestamp);
CREATE INDEX IF NOT EXISTS idx_event_sync ON intrusion_events(sync_status, timestamp);
CREATE INDEX IF NOT EXISTS idx_fused_sync ON combined_objects(sync_status, timestamp);
