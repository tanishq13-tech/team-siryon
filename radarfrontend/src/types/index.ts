export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';

export type AlertType = 
  | 'PERIMETER_BREACH' 
  | 'FRS_SUSPECT' 
  | 'ANPR_FLAGGED' 
  | 'SUSPICIOUS_LOITERING' 
  | 'NIGHT_INTRUSION' 
  | 'UNATTENDED_OBJECT'
  | 'VEHICLE_SPEEDING'
  | 'RADAR_INTRUSION'
  | 'DRONE_DETECTED';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export interface Alert {
  id: string;
  timestamp: string;
  cameraId: string;
  cameraName: string;
  bopId: string;
  bopName: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  confidence: number;
  details: string;
  snapshotUrl?: string;
  sopSteps: {
    title: string;
    completed: boolean;
  }[];
  metadata?: {
    personId?: string;
    personName?: string;
    plateNumber?: string;
    vehicleType?: string;
    coordinates?: [number, number];
    loiterDurationSec?: number;
    matchScore?: number;
  };
}

export type CameraType = 'OPTICAL_HD' | 'THERMAL_IR' | 'PTZ_DOME' | 'ANPR_CHECKPOST';

export interface TripwirePoint {
  x: number; // 0 to 1 relative
  y: number; // 0 to 1 relative
}

export interface Tripwire {
  id: string;
  name: string;
  cameraId: string;
  points: TripwirePoint[];
  direction: 'INWARD' | 'OUTWARD' | 'BIDIRECTIONAL';
  enabled: boolean;
  triggerCount: number;
}

export interface Camera {
  id: string;
  name: string;
  bopId: string;
  bopName: string;
  locationDescription: string;
  ip: string;
  rtspUrl: string;
  type: CameraType;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  fps: number;
  resolution: string;
  fovAngle: number; // in degrees for tactical map
  fovDirection: number; // compass heading 0-360
  coordinates: [number, number];
  visionMode: 'STANDARD' | 'NIGHT_VISION' | 'THERMAL_FLIR';
  aiFeatures: {
    humanDetection: boolean;
    vehicleClassification: boolean;
    faceRecognition: boolean;
    anpr: boolean;
    virtualFence: boolean;
    loiteringDetection: boolean;
    nightMovement: boolean;
  };
  sourceType?: 'SIMULATION' | 'WEBCAM' | 'VIDEO_URL' | 'FILE_UPLOAD';
  customStreamUrl?: string;
  tripwires: Tripwire[];
  ptz: {
    pan: number; // -180 to 180
    tilt: number; // -90 to 90
    zoom: number; // 1 to 20
  };
}

export interface BOP {
  id: string;
  name: string;
  sector: string;
  coordinates: [number, number];
  cameraCount: number;
  activeAlertCount: number;
  status: 'NORMAL' | 'ELEVATED' | 'HIGH_ALERT';
  officerInCharge: string;
  contactNumber: string;
  networkStatus: 'FIBER_ONLINE' | 'TACTICAL_RF' | 'SATCOM_FAILOVER';
  personnelStrength: number;
}

export interface FRSPerson {
  id: string;
  name: string;
  alias: string;
  category: 'SUSPECT' | 'BORDER_RESIDENT' | 'SECURITY_FORCE' | 'OFFICIAL';
  watchlistStatus: boolean;
  nationalId: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  lastSeenLocation: string;
  lastSeenTime: string;
  photoUrl: string;
  notes: string;
}

export interface ANPRRecord {
  id: string;
  plateNumber: string;
  ownerName: string;
  vehicleType: string;
  color: string;
  registrationStatus: 'WANTED' | 'SUSPICIOUS' | 'AUTHORIZED' | 'CIVILIAN_PASS';
  state: string;
  lastSeenCamera: string;
  bopName: string;
  timestamp: string;
  speedKmh: number;
  confidence: number;
}

export interface QRTUnit {
  id: string;
  callsign: string;
  bopId: string;
  status: 'STANDBY' | 'DISPATCHED' | 'ON_SCENE';
  strength: number;
  commander: string;
  vehicleType: string;
  coordinates: [number, number];
}

export interface SystemMetrics {
  edgeCpuPercent: number;
  edgeGpuPercent: number;
  edgeMemoryPercent: number;
  activeCameras: number;
  totalCameras: number;
  fpsThroughput: number;
  bandwidthUsageKbps: number;
  edgeSyncStatus: 'REALTIME_SYNC' | 'BUFFERED_QUEUE' | 'OFFLINE_CACHE';
  threatLevel: 'DEFCON_4' | 'DEFCON_3' | 'DEFCON_2' | 'DEFCON_1';
}

export type RadarTargetClass = 'CRAWLER_HUMAN' | 'PEDESTRIAN' | 'VEHICLE' | 'DRONE_UAV' | 'UNKNOWN';

export interface RadarTarget {
  id: string;
  callsign: string;
  rangeMeters: number;
  azimuthDeg: number;
  elevationDeg?: number;
  radialVelocityKmh: number;
  rcsM2: number;
  classification: RadarTargetClass;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  bopId: string;
  nearestCameraId: string;
  coordinates: [number, number];
  lastUpdated: string;
  history: Array<{ range: number; azimuth: number }>;
}

export interface RadarStation {
  id: string;
  name: string;
  model: string;
  bopId: string;
  bopName: string;
  coordinates: [number, number];
  maxRangeKm: number;
  currentRangeKm: number;
  scanAngleDeg: number;
  rpm: number;
  status: 'ACTIVE_SEARCH' | 'TRACK_WHILE_SCAN' | 'STANDBY';
  frequencyBand: string;
  transmitterPower: string;
}
