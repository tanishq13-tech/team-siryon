import { BOP, Camera, Alert, FRSPerson, ANPRRecord, QRTUnit, SystemMetrics, RadarStation, RadarTarget } from '../types';

export const INITIAL_BOPS: BOP[] = [
  {
    id: 'bop-trishul',
    name: 'BOP Trishul',
    sector: 'Sector Alpha (Kathua/Samba)',
    coordinates: [32.5532, 75.1215],
    cameraCount: 8,
    activeAlertCount: 2,
    status: 'HIGH_ALERT',
    officerInCharge: 'Assistant Commandant R. K. Sharma',
    contactNumber: '+91-1923-241088',
    networkStatus: 'FIBER_ONLINE',
    personnelStrength: 42,
  },
  {
    id: 'bop-cheetah',
    name: 'BOP Cheetah',
    sector: 'Sector Bravo (RS Pura)',
    coordinates: [32.6105, 74.7290],
    cameraCount: 12,
    activeAlertCount: 1,
    status: 'ELEVATED',
    officerInCharge: 'Inspector Manjeet Singh',
    contactNumber: '+91-191-255019',
    networkStatus: 'TACTICAL_RF',
    personnelStrength: 38,
  },
  {
    id: 'bop-vajra',
    name: 'BOP Vajra',
    sector: 'Sector Charlie (Riverine Akhnoor)',
    coordinates: [32.8980, 74.7420],
    cameraCount: 6,
    activeAlertCount: 1,
    status: 'NORMAL',
    officerInCharge: 'Deputy Commandant Vikram Rao',
    contactNumber: '+91-1924-220014',
    networkStatus: 'FIBER_ONLINE',
    personnelStrength: 50,
  },
  {
    id: 'bop-ranbhir',
    name: 'BOP Ranbhir',
    sector: 'Sector Delta (Arnia)',
    coordinates: [32.5180, 74.8020],
    cameraCount: 10,
    activeAlertCount: 0,
    status: 'NORMAL',
    officerInCharge: 'Inspector Gurpreet Singh',
    contactNumber: '+91-191-240182',
    networkStatus: 'SATCOM_FAILOVER',
    personnelStrength: 35,
  }
];

export const INITIAL_CAMERAS: Camera[] = [
  {
    id: 'CAM-TR-01',
    name: 'Perimeter Fence Line 4A',
    bopId: 'bop-trishul',
    bopName: 'BOP Trishul',
    locationDescription: 'North Fencing Grid - Sector A3 Post',
    ip: '10.142.12.101',
    rtspUrl: 'rtsp://10.142.12.101:554/h264/ch1/main',
    type: 'OPTICAL_HD',
    status: 'ONLINE',
    fps: 30,
    resolution: '1920x1080',
    fovAngle: 75,
    fovDirection: 310,
    coordinates: [32.5540, 75.1220],
    visionMode: 'STANDARD',
    aiFeatures: {
      humanDetection: true,
      vehicleClassification: true,
      faceRecognition: true,
      anpr: false,
      virtualFence: true,
      loiteringDetection: true,
      nightMovement: true,
    },
    tripwires: [
      {
        id: 'tw-1',
        name: 'Zero-Line Primary Fence',
        cameraId: 'CAM-TR-01',
        points: [{ x: 0.15, y: 0.72 }, { x: 0.85, y: 0.68 }],
        direction: 'INWARD',
        enabled: true,
        triggerCount: 14,
      }
    ],
    ptz: { pan: 0, tilt: -12, zoom: 1 },
  },
  {
    id: 'CAM-TR-02',
    name: 'Zero-Line Thermal Sentry',
    bopId: 'bop-trishul',
    bopName: 'BOP Trishul',
    locationDescription: 'Forward Observation Mound (Thermal IR FLIR)',
    ip: '10.142.12.102',
    rtspUrl: 'rtsp://10.142.12.102:554/thermal/live',
    type: 'THERMAL_IR',
    status: 'ONLINE',
    fps: 25,
    resolution: '1280x720',
    fovAngle: 90,
    fovDirection: 275,
    coordinates: [32.5528, 75.1205],
    visionMode: 'THERMAL_FLIR',
    aiFeatures: {
      humanDetection: true,
      vehicleClassification: true,
      faceRecognition: false,
      anpr: false,
      virtualFence: true,
      loiteringDetection: true,
      nightMovement: true,
    },
    tripwires: [
      {
        id: 'tw-2',
        name: 'Thermal Buffer Zone 100m',
        cameraId: 'CAM-TR-02',
        points: [{ x: 0.1, y: 0.6 }, { x: 0.9, y: 0.55 }],
        direction: 'INWARD',
        enabled: true,
        triggerCount: 8,
      }
    ],
    ptz: { pan: 15, tilt: -5, zoom: 2.5 },
  },
  {
    id: 'CAM-CH-01',
    name: 'Checkpost Gate Entry ANPR',
    bopId: 'bop-cheetah',
    bopName: 'BOP Cheetah',
    locationDescription: 'Forward Vehicle Sentry Barrier #1',
    ip: '10.142.14.205',
    rtspUrl: 'rtsp://10.142.14.205:554/anpr/stream',
    type: 'ANPR_CHECKPOST',
    status: 'ONLINE',
    fps: 30,
    resolution: '2560x1440',
    fovAngle: 45,
    fovDirection: 180,
    coordinates: [32.6110, 74.7285],
    visionMode: 'STANDARD',
    aiFeatures: {
      humanDetection: true,
      vehicleClassification: true,
      faceRecognition: true,
      anpr: true,
      virtualFence: false,
      loiteringDetection: false,
      nightMovement: false,
    },
    tripwires: [],
    ptz: { pan: 0, tilt: 0, zoom: 1 },
  },
  {
    id: 'CAM-CH-02',
    name: 'Watchtower 30x Long-Range PTZ',
    bopId: 'bop-cheetah',
    bopName: 'BOP Cheetah',
    locationDescription: 'Tower Top Sector Panoramic Sweeper',
    ip: '10.142.14.210',
    rtspUrl: 'rtsp://10.142.14.210:554/ptz/main',
    type: 'PTZ_DOME',
    status: 'ONLINE',
    fps: 60,
    resolution: '1920x1080',
    fovAngle: 60,
    fovDirection: 220,
    coordinates: [32.6098, 74.7295],
    visionMode: 'STANDARD',
    aiFeatures: {
      humanDetection: true,
      vehicleClassification: true,
      faceRecognition: true,
      anpr: true,
      virtualFence: true,
      loiteringDetection: true,
      nightMovement: true,
    },
    tripwires: [],
    ptz: { pan: -45, tilt: -10, zoom: 4.2 },
  },
  {
    id: 'CAM-VJ-01',
    name: 'Riverine Gorge Thermal Cam',
    bopId: 'bop-vajra',
    bopName: 'BOP Vajra',
    locationDescription: 'River Chenab Border Crossing Channel',
    ip: '10.142.16.15',
    rtspUrl: 'rtsp://10.142.16.15:554/riverine/thermal',
    type: 'THERMAL_IR',
    status: 'ONLINE',
    fps: 25,
    resolution: '1280x720',
    fovAngle: 110,
    fovDirection: 260,
    coordinates: [32.8975, 74.7410],
    visionMode: 'NIGHT_VISION',
    aiFeatures: {
      humanDetection: true,
      vehicleClassification: false,
      faceRecognition: false,
      anpr: false,
      virtualFence: true,
      loiteringDetection: true,
      nightMovement: true,
    },
    tripwires: [
      {
        id: 'tw-3',
        name: 'River Bank Tripwire',
        cameraId: 'CAM-VJ-01',
        points: [{ x: 0.2, y: 0.8 }, { x: 0.85, y: 0.75 }],
        direction: 'BIDIRECTIONAL',
        enabled: true,
        triggerCount: 3,
      }
    ],
    ptz: { pan: 10, tilt: -15, zoom: 1.5 },
  },
  {
    id: 'CAM-RB-01',
    name: 'Agricultural Border Road',
    bopId: 'bop-ranbhir',
    bopName: 'BOP Ranbhir',
    locationDescription: 'Perimeter Lateral Patrol Track km 14.2',
    ip: '10.142.18.52',
    rtspUrl: 'rtsp://10.142.18.52:554/h265/feed',
    type: 'OPTICAL_HD',
    status: 'ONLINE',
    fps: 30,
    resolution: '1920x1080',
    fovAngle: 80,
    fovDirection: 330,
    coordinates: [32.5185, 74.8015],
    visionMode: 'STANDARD',
    aiFeatures: {
      humanDetection: true,
      vehicleClassification: true,
      faceRecognition: true,
      anpr: true,
      virtualFence: true,
      loiteringDetection: true,
      nightMovement: true,
    },
    tripwires: [],
    ptz: { pan: 0, tilt: -8, zoom: 1 },
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-9082',
    timestamp: new Date(Date.now() - 1000 * 42).toLocaleTimeString(),
    cameraId: 'CAM-TR-01',
    cameraName: 'Perimeter Fence Line 4A',
    bopId: 'bop-trishul',
    bopName: 'BOP Trishul',
    type: 'PERIMETER_BREACH',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    confidence: 97.8,
    details: 'Virtual fence tripwire breached: Low-silhouette human crawling detected 18m inside Buffer Zone.',
    sopSteps: [
      { title: 'Confirm visual breach on CAM-TR-01 stream', completed: true },
      { title: 'Trigger BOP Trishul perimeter klaxon / floodlights', completed: false },
      { title: 'Dispatch QRT Unit #1 (Bravo-4) to Sector A3', completed: false },
      { title: 'Transmit encrypted SITREP to Sector HQ Command', completed: false }
    ],
    metadata: {
      personId: 'HUM-802',
      coordinates: [32.5542, 75.1221],
      loiterDurationSec: 68
    }
  },
  {
    id: 'ALT-9081',
    timestamp: new Date(Date.now() - 1000 * 180).toLocaleTimeString(),
    cameraId: 'CAM-CH-01',
    cameraName: 'Checkpost Gate Entry ANPR',
    bopId: 'bop-cheetah',
    bopName: 'BOP Cheetah',
    type: 'ANPR_FLAGGED',
    severity: 'HIGH',
    status: 'ACTIVE',
    confidence: 94.2,
    details: 'Flagged vehicle detected: Stolen white pickup truck (JK-02-AZ-8841) matching NIA border alert bulletin.',
    sopSteps: [
      { title: 'Lock down hydraulic barrier gate at Checkpost #1', completed: true },
      { title: 'Alert Checkpost Guard Commander (Insp. Manjeet)', completed: true },
      { title: 'Conduct secondary physical search & driver biometric scan', completed: false }
    ],
    metadata: {
      plateNumber: 'JK-02-AZ-8841',
      vehicleType: 'Mahindra Bolero Pickup',
      matchScore: 99.1
    }
  },
  {
    id: 'ALT-9080',
    timestamp: new Date(Date.now() - 1000 * 360).toLocaleTimeString(),
    cameraId: 'CAM-TR-02',
    cameraName: 'Zero-Line Thermal Sentry',
    bopId: 'bop-trishul',
    bopName: 'BOP Trishul',
    type: 'NIGHT_INTRUSION',
    severity: 'HIGH',
    status: 'ACKNOWLEDGED',
    confidence: 91.5,
    details: 'FLIR Thermal infrared signature: 2 heat signatures detected loitering in wild elephant grass 80m from zero line.',
    sopSteps: [
      { title: 'Deploy PTZ searchlight to cross-reference heat target', completed: true },
      { title: 'Alert night ambush patrol party Alpha-2', completed: true },
      { title: 'Monitor movement vector and record thermal signature', completed: false }
    ],
    metadata: {
      coordinates: [32.5529, 75.1208]
    }
  },
  {
    id: 'ALT-9079',
    timestamp: new Date(Date.now() - 1000 * 600).toLocaleTimeString(),
    cameraId: 'CAM-RB-01',
    cameraName: 'Agricultural Border Road',
    bopId: 'bop-ranbhir',
    bopName: 'BOP Ranbhir',
    type: 'FRS_SUSPECT',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    confidence: 88.6,
    details: 'FRS software match: Individual matched with border-pass watchlist profile #POI-7402 (Tariq M.).',
    sopSteps: [
      { title: 'Verify identity card with local BOP gate manifest', completed: true },
      { title: 'Log transit direction and escort through farmer gate', completed: true }
    ],
    metadata: {
      personId: 'POI-7402',
      personName: 'Tariq M.',
      matchScore: 88.6
    }
  },
  {
    id: 'ALT-9078',
    timestamp: new Date(Date.now() - 1000 * 950).toLocaleTimeString(),
    cameraId: 'CAM-VJ-01',
    cameraName: 'Riverine Gorge Thermal Cam',
    bopId: 'bop-vajra',
    bopName: 'BOP Vajra',
    type: 'SUSPICIOUS_LOITERING',
    severity: 'WARNING',
    status: 'RESOLVED',
    confidence: 86.4,
    details: 'Object stationary near culvert water intake for 180 seconds. Checked: wild boar movement.',
    sopSteps: [
      { title: 'Visual verification by outpost sentry', completed: true },
      { title: 'Categorized as false alarm: wildlife', completed: true }
    ],
    metadata: {
      loiterDurationSec: 180
    }
  }
];

export const FRS_WATCHLIST: FRSPerson[] = [
  {
    id: 'POI-7402',
    name: 'Tariq Mahmood',
    alias: 'Abu Hamza',
    category: 'SUSPECT',
    watchlistStatus: true,
    nationalId: 'WL-MHA-8921-X',
    riskLevel: 'HIGH',
    confidence: 93.4,
    lastSeenLocation: 'BOP Ranbhir Perimeter',
    lastSeenTime: '10 mins ago',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    notes: 'Suspected contraband courier. Reported active in cross-border smuggling networks.'
  },
  {
    id: 'POI-8821',
    name: 'Suresh Kumar Sharma',
    alias: 'Suraj',
    category: 'BORDER_RESIDENT',
    watchlistStatus: false,
    nationalId: 'JK-ID-9920194',
    riskLevel: 'LOW',
    confidence: 98.1,
    lastSeenLocation: 'BOP Cheetah Checkpost',
    lastSeenTime: '45 mins ago',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    notes: 'Registered border farmer, Gate Pass #GP-2026-904. Authorized field cultivation.'
  },
  {
    id: 'POI-9104',
    name: 'Sub-Inspector Rajesh Verma',
    alias: 'Callsign Hawk',
    category: 'SECURITY_FORCE',
    watchlistStatus: false,
    nationalId: 'BSF-OFF-44910',
    riskLevel: 'LOW',
    confidence: 99.4,
    lastSeenLocation: 'BOP Trishul HQ',
    lastSeenTime: '3 mins ago',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    notes: 'BSF 142 Bn Patrol Commander. Authorized armed personnel.'
  },
  {
    id: 'POI-6510',
    name: 'Unknown Infiltrator #3',
    alias: 'Subject X-Ray',
    category: 'SUSPECT',
    watchlistStatus: true,
    nationalId: 'UNKNOWN-BIO-091',
    riskLevel: 'HIGH',
    confidence: 86.7,
    lastSeenLocation: 'CAM-TR-01 Fence Breach',
    lastSeenTime: 'Just now',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    notes: 'Captured by AI FRS during night fence breach. No identity match in civilian database.'
  }
];

export const ANPR_DATABASE: ANPRRecord[] = [
  {
    id: 'ANPR-101',
    plateNumber: 'JK-02-AZ-8841',
    ownerName: 'Unregistered / Stolen',
    vehicleType: 'Mahindra Bolero Pickup',
    color: 'White',
    registrationStatus: 'WANTED',
    state: 'Jammu & Kashmir',
    lastSeenCamera: 'CAM-CH-01',
    bopName: 'BOP Cheetah',
    timestamp: '3 mins ago',
    speedKmh: 48,
    confidence: 96.8
  },
  {
    id: 'ANPR-102',
    plateNumber: 'DL-1C-9042',
    ownerName: 'Border Security Force 142 Bn',
    vehicleType: 'Armored Tactical Gypsy',
    color: 'Olive Green',
    registrationStatus: 'AUTHORIZED',
    state: 'Govt / Defense',
    lastSeenCamera: 'CAM-CH-01',
    bopName: 'BOP Cheetah',
    timestamp: '12 mins ago',
    speedKmh: 35,
    confidence: 99.2
  },
  {
    id: 'ANPR-103',
    plateNumber: 'PB-06-K-4102',
    ownerName: 'Harjit Singh',
    vehicleType: 'Agricultural Tractor Swaraj 855',
    color: 'Blue',
    registrationStatus: 'CIVILIAN_PASS',
    state: 'Punjab',
    lastSeenCamera: 'CAM-RB-01',
    bopName: 'BOP Ranbhir',
    timestamp: '25 mins ago',
    speedKmh: 18,
    confidence: 94.7
  },
  {
    id: 'ANPR-104',
    plateNumber: 'HR-26-DT-1994',
    ownerName: 'Suspicious / Fake Registration',
    vehicleType: 'Hyundai Creta (Tinted)',
    color: 'Dark Grey',
    registrationStatus: 'SUSPICIOUS',
    state: 'Haryana',
    lastSeenCamera: 'CAM-CH-01',
    bopName: 'BOP Cheetah',
    timestamp: '1 hour ago',
    speedKmh: 62,
    confidence: 92.3
  }
];

export const QRT_UNITS: QRTUnit[] = [
  {
    id: 'QRT-1',
    callsign: 'Bravo-4 Striker',
    bopId: 'bop-trishul',
    status: 'STANDBY',
    strength: 6,
    commander: 'Sub-Inspector D. Negi',
    vehicleType: 'Mahindra Marksman Light Armored Vehicle',
    coordinates: [32.5535, 75.1218]
  },
  {
    id: 'QRT-2',
    callsign: 'Cheetah-Rapid',
    bopId: 'bop-cheetah',
    status: 'STANDBY',
    strength: 8,
    commander: 'Inspector Gurmit Singh',
    vehicleType: 'Tata Safari Quick Reaction Interceptor',
    coordinates: [32.6108, 74.7292]
  },
  {
    id: 'QRT-3',
    callsign: 'Vajra-Riverine Patrol',
    bopId: 'bop-vajra',
    status: 'STANDBY',
    strength: 4,
    commander: 'Naik Subedar S. Patil',
    vehicleType: 'Rigid Inflatable Fast Attack Boat (RHIB)',
    coordinates: [32.8978, 74.7415]
  }
];

export const INITIAL_METRICS: SystemMetrics = {
  edgeCpuPercent: 42,
  edgeGpuPercent: 78,
  edgeMemoryPercent: 54,
  activeCameras: 6,
  totalCameras: 6,
  fpsThroughput: 168,
  bandwidthUsageKbps: 420, // Ultra-efficient edge compression
  edgeSyncStatus: 'REALTIME_SYNC',
  threatLevel: 'DEFCON_2'
};

export const RADAR_STATIONS: RadarStation[] = [
  {
    id: 'RADAR-TR-01',
    name: 'BFSR-SR Mk II Ground Radar (Trishul Alpha)',
    model: 'Battlefield Surveillance Radar - Short Range Mk II',
    bopId: 'bop-trishul',
    bopName: 'BOP Trishul',
    coordinates: [32.5532, 75.1215],
    maxRangeKm: 10,
    currentRangeKm: 5,
    scanAngleDeg: 45,
    rpm: 24,
    status: 'TRACK_WHILE_SCAN',
    frequencyBand: 'J-Band (10 - 18 GHz Pulse Doppler)',
    transmitterPower: '5 Watts Solid-State Peak'
  },
  {
    id: 'RADAR-CH-01',
    name: '3D Perimeter Doppler Radar (Cheetah Sentry)',
    model: 'Tactical Perimeter C-UAS / Ground Radar',
    bopId: 'bop-cheetah',
    bopName: 'BOP Cheetah',
    coordinates: [32.6105, 74.7290],
    maxRangeKm: 10,
    currentRangeKm: 5,
    scanAngleDeg: 120,
    rpm: 30,
    status: 'ACTIVE_SEARCH',
    frequencyBand: 'X-Band (9.2 - 9.8 GHz)',
    transmitterPower: '12 Watts Pulse Doppler'
  }
];

export const INITIAL_RADAR_TARGETS: RadarTarget[] = [
  {
    id: 'TGT-R901',
    callsign: 'TRACK-091 (CRAWLER)',
    rangeMeters: 1420,
    azimuthDeg: 312,
    elevationDeg: 2.1,
    radialVelocityKmh: 3.8,
    rcsM2: 0.8,
    classification: 'CRAWLER_HUMAN',
    threatLevel: 'CRITICAL',
    bopId: 'bop-trishul',
    nearestCameraId: 'CAM-TR-01',
    coordinates: [32.5542, 75.1221],
    lastUpdated: 'Just now',
    history: [
      { range: 1450, azimuth: 310 },
      { range: 1435, azimuth: 311 },
      { range: 1420, azimuth: 312 }
    ]
  },
  {
    id: 'TGT-R902',
    callsign: 'TRACK-104 (FAST VEHICLE)',
    rangeMeters: 3180,
    azimuthDeg: 45,
    elevationDeg: 0.5,
    radialVelocityKmh: 42.0,
    rcsM2: 12.5,
    classification: 'VEHICLE',
    threatLevel: 'HIGH',
    bopId: 'bop-cheetah',
    nearestCameraId: 'CAM-CH-01',
    coordinates: [32.6115, 74.7302],
    lastUpdated: '12s ago',
    history: [
      { range: 3350, azimuth: 43 },
      { range: 3260, azimuth: 44 },
      { range: 3180, azimuth: 45 }
    ]
  },
  {
    id: 'TGT-R903',
    callsign: 'DRONE-03 (LOW-RCS UAV)',
    rangeMeters: 2650,
    azimuthDeg: 220,
    elevationDeg: 14.8,
    radialVelocityKmh: 58.0,
    rcsM2: 0.15,
    classification: 'DRONE_UAV',
    threatLevel: 'CRITICAL',
    bopId: 'bop-vajra',
    nearestCameraId: 'CAM-VJ-01',
    coordinates: [32.8965, 74.7390],
    lastUpdated: '3s ago',
    history: [
      { range: 2800, azimuth: 218 },
      { range: 2720, azimuth: 219 },
      { range: 2650, azimuth: 220 }
    ]
  },
  {
    id: 'TGT-R904',
    callsign: 'TRACK-215 (PEDESTRIAN GROUP)',
    rangeMeters: 890,
    azimuthDeg: 165,
    elevationDeg: 0.2,
    radialVelocityKmh: 4.5,
    rcsM2: 1.6,
    classification: 'PEDESTRIAN',
    threatLevel: 'MEDIUM',
    bopId: 'bop-ranbhir',
    nearestCameraId: 'CAM-RB-01',
    coordinates: [32.5175, 74.8035],
    lastUpdated: '18s ago',
    history: [
      { range: 920, azimuth: 163 },
      { range: 905, azimuth: 164 },
      { range: 890, azimuth: 165 }
    ]
  }
];
