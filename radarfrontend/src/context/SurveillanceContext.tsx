import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Camera, BOP, Alert, FRSPerson, ANPRRecord, QRTUnit, SystemMetrics, AlertSeverity, RadarStation, RadarTarget } from '../types';
import { INITIAL_BOPS, INITIAL_CAMERAS, INITIAL_ALERTS, FRS_WATCHLIST, ANPR_DATABASE, QRT_UNITS, INITIAL_METRICS, RADAR_STATIONS, INITIAL_RADAR_TARGETS } from '../mock/mockData';
import { audioAlerts } from '../services/audioAlertService';

export type ActiveTab = 'MATRIX' | 'MAP' | 'ALERTS' | 'ANPR' | 'FRS' | 'FORENSICS' | 'TOPOLOGY' | 'RADAR';

interface SurveillanceContextType {
  bops: BOP[];
  cameras: Camera[];
  alerts: Alert[];
  frsList: FRSPerson[];
  anprList: ANPRRecord[];
  qrtUnits: QRTUnit[];
  metrics: SystemMetrics;
  radarStations: RadarStation[];
  radarTargets: RadarTarget[];
  selectedRadarTargetId: string | null;
  selectedBopId: string;
  selectedCameraId: string | null;
  gridMode: '1x1' | '2x2' | '3x3';
  activeTab: ActiveTab;
  activeAlertModal: Alert | null;
  isMuted: boolean;
  threatLevel: string;
  // Actions
  setSelectedBopId: (id: string) => void;
  setSelectedCameraId: (id: string | null) => void;
  setGridMode: (mode: '1x1' | '2x2' | '3x3') => void;
  setActiveTab: (tab: ActiveTab) => void;
  setActiveAlertModal: (alert: Alert | null) => void;
  setSelectedRadarTargetId: (id: string | null) => void;
  slewCameraToRadarTarget: (targetId: string) => void;
  toggleMute: () => void;
  toggleCameraAIFeature: (cameraId: string, feature: keyof Camera['aiFeatures']) => void;
  setCameraVisionMode: (cameraId: string, mode: Camera['visionMode']) => void;
  updateCameraPTZ: (cameraId: string, pan: number, tilt: number, zoom: number) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  completeSopStep: (alertId: string, stepIndex: number) => void;
  dispatchQRT: (alertId: string, qrtId: string) => void;
  triggerManualAlarm: (bopId: string) => void;
  addTripwire: (cameraId: string, name: string, points: Array<{ x: number; y: number }>) => void;
  deleteTripwire: (cameraId: string, tripwireId: string) => void;
  addANPRRecord: (record: Omit<ANPRRecord, 'id' | 'timestamp'>) => void;
  addFRSPerson: (person: Omit<FRSPerson, 'id' | 'lastSeenTime'>) => void;
  setCameraSource: (cameraId: string, sourceType: Camera['sourceType'], customStreamUrl?: string) => void;
}

const SurveillanceContext = createContext<SurveillanceContextType | undefined>(undefined);

export const SurveillanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bops] = useState<BOP[]>(INITIAL_BOPS);
  const [cameras, setCameras] = useState<Camera[]>(INITIAL_CAMERAS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [frsList, setFrsList] = useState<FRSPerson[]>(FRS_WATCHLIST);
  const [anprList, setAnprList] = useState<ANPRRecord[]>(ANPR_DATABASE);
  const [qrtUnits, setQrtUnits] = useState<QRTUnit[]>(QRT_UNITS);
  const [metrics, setMetrics] = useState<SystemMetrics>(INITIAL_METRICS);
  const [radarStations, setRadarStations] = useState<RadarStation[]>(RADAR_STATIONS);
  const [radarTargets, setRadarTargets] = useState<RadarTarget[]>(INITIAL_RADAR_TARGETS);
  const [selectedRadarTargetId, _setSelectedRadarTargetId] = useState<string | null>('TGT-R901');

  const [selectedBopId, setSelectedBopId] = useState<string>('ALL');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>('CAM-TR-01');
  const [gridMode, setGridMode] = useState<'1x1' | '2x2' | '3x3'>('2x2');
  const [activeTab, setActiveTab] = useState<ActiveTab>('MATRIX');
  const [activeAlertModal, setActiveAlertModal] = useState<Alert | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [threatLevel, setThreatLevel] = useState<string>('DEFCON 2 - HIGH SURVEILLANCE');

  // Periodic simulated metrics fluctuation for realistic telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        edgeCpuPercent: Math.min(95, Math.max(30, prev.edgeCpuPercent + (Math.random() * 6 - 3))),
        edgeGpuPercent: Math.min(98, Math.max(60, prev.edgeGpuPercent + (Math.random() * 8 - 4))),
        fpsThroughput: Math.floor(165 + Math.random() * 12),
        bandwidthUsageKbps: Math.floor(390 + Math.random() * 50)
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Live radar sweep simulation: jitters range/azimuth/velocity per target and
  // rotates each station's antenna, mimicking a real Doppler ground-surveillance feed
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarTargets((prev) =>
        prev.map((tgt) => {
          const rangeDelta = (Math.random() * 40 - 20) * (tgt.classification === 'DRONE_UAV' ? 3 : 1);
          const azimuthDelta = Math.random() * 1.6 - 0.8;
          const nextRange = Math.max(80, tgt.rangeMeters + rangeDelta);
          const nextAzimuth = (tgt.azimuthDeg + azimuthDelta + 360) % 360;
          const history = [...tgt.history, { range: nextRange, azimuth: nextAzimuth }].slice(-12);
          return {
            ...tgt,
            rangeMeters: Math.round(nextRange),
            azimuthDeg: Number(nextAzimuth.toFixed(1)),
            radialVelocityKmh: Math.max(0, Number((tgt.radialVelocityKmh + (Math.random() * 4 - 2)).toFixed(1))),
            lastUpdated: 'Just now',
            history
          };
        })
      );
      setRadarStations((prev) =>
        prev.map((st) => ({
          ...st,
          scanAngleDeg: Number(((st.scanAngleDeg + st.rpm * 0.4) % 360).toFixed(1))
        }))
      );
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Escalate any CRITICAL radar contact into the unified alert feed exactly once
  useEffect(() => {
    const criticalTargets = radarTargets.filter((t) => t.threatLevel === 'CRITICAL');
    criticalTargets.forEach((tgt) => {
      setAlerts((prev) => {
        if (prev.some((a) => a.metadata?.personId === tgt.id && a.type === 'RADAR_INTRUSION')) {
          return prev;
        }
        const bop = bops.find((b) => b.id === tgt.bopId);
        const newAlert: Alert = {
          id: `ALERT-RDR-${tgt.id}`,
          timestamp: 'Just now',
          cameraId: tgt.nearestCameraId,
          cameraName: tgt.nearestCameraId,
          bopId: tgt.bopId,
          bopName: bop?.name ?? tgt.bopId,
          type: 'RADAR_INTRUSION',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          confidence: 92,
          details: `Ground radar classified a ${tgt.classification.replace('_', ' ')} contact (${tgt.callsign}) at ${tgt.rangeMeters}m, bearing ${Math.round(tgt.azimuthDeg)}°. Closing velocity ${tgt.radialVelocityKmh} km/h.`,
          sopSteps: [
            { title: 'Cross-cue nearest EO/IR camera to radar bearing', completed: false },
            { title: 'Visually confirm target classification', completed: false },
            { title: 'Dispatch Quick Reaction Team if confirmed', completed: false },
            { title: 'Log contact in forensics ledger', completed: false }
          ],
          metadata: {
            personId: tgt.id,
            coordinates: tgt.coordinates
          }
        };
        audioAlerts.playRadarPing();
        return [newAlert, ...prev];
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radarTargets.map((t) => `${t.id}:${t.threatLevel}`).join(',')]);

  const setSelectedRadarTargetId = (id: string | null) => {
    _setSelectedRadarTargetId(id);
    if (id) audioAlerts.playRadarPing();
  };

  const slewCameraToRadarTarget = (targetId: string) => {
    const target = radarTargets.find((t) => t.id === targetId);
    if (!target) return;
    _setSelectedRadarTargetId(targetId);
    setSelectedCameraId(target.nearestCameraId);
    // Point the nearest PTZ camera toward the radar bearing/range for cross-cueing
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id === target.nearestCameraId
          ? {
              ...cam,
              ptz: {
                pan: Math.max(-180, Math.min(180, ((target.azimuthDeg + 180) % 360) - 180)),
                tilt: Math.max(-90, Math.min(90, -(target.elevationDeg ?? 0))),
                zoom: target.rangeMeters < 500 ? 12 : target.rangeMeters < 1500 ? 8 : 4
              }
            }
          : cam
      )
    );
    setActiveTab('MATRIX');
    audioAlerts.playDispatchConfirm();
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioAlerts.setMuted(next);
  };

  const toggleCameraAIFeature = (cameraId: string, feature: keyof Camera['aiFeatures']) => {
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id === cameraId) {
          return {
            ...cam,
            aiFeatures: {
              ...cam.aiFeatures,
              [feature]: !cam.aiFeatures[feature]
            }
          };
        }
        return cam;
      })
    );
  };

  const setCameraVisionMode = (cameraId: string, mode: Camera['visionMode']) => {
    setCameras((prev) =>
      prev.map((cam) => (cam.id === cameraId ? { ...cam, visionMode: mode } : cam))
    );
  };

  const updateCameraPTZ = (cameraId: string, pan: number, tilt: number, zoom: number) => {
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id === cameraId
          ? {
              ...cam,
              ptz: {
                pan: Math.max(-180, Math.min(180, pan)),
                tilt: Math.max(-90, Math.min(90, tilt)),
                zoom: Math.max(1, Math.min(20, zoom))
              }
            }
          : cam
      )
    );
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === alertId ? { ...alt, status: 'ACKNOWLEDGED' } : alt))
    );
    audioAlerts.playDispatchConfirm();
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === alertId ? { ...alt, status: 'RESOLVED' } : alt))
    );
    if (activeAlertModal?.id === alertId) {
      setActiveAlertModal(null);
    }
  };

  const completeSopStep = (alertId: string, stepIndex: number) => {
    setAlerts((prev) =>
      prev.map((alt) => {
        if (alt.id === alertId) {
          const updatedSteps = [...alt.sopSteps];
          if (updatedSteps[stepIndex]) {
            updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], completed: true };
          }
          return { ...alt, sopSteps: updatedSteps };
        }
        return alt;
      })
    );
  };

  const dispatchQRT = (alertId: string, qrtId: string) => {
    setQrtUnits((prev) =>
      prev.map((unit) => (unit.id === qrtId ? { ...unit, status: 'DISPATCHED' } : unit))
    );
    audioAlerts.playDispatchConfirm();
    completeSopStep(alertId, 2);
  };

  const triggerManualAlarm = (bopId: string) => {
    audioAlerts.playIntrusionSiren();
  };

  const addTripwire = (cameraId: string, name: string, points: Array<{ x: number; y: number }>) => {
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id === cameraId) {
          const newTw = {
            id: `tw-${Date.now()}`,
            name,
            cameraId,
            points,
            direction: 'INWARD' as const,
            enabled: true,
            triggerCount: 0
          };
          return { ...cam, tripwires: [...cam.tripwires, newTw] };
        }
        return cam;
      })
    );
  };

  const deleteTripwire = (cameraId: string, tripwireId: string) => {
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id === cameraId) {
          return { ...cam, tripwires: cam.tripwires.filter((tw) => tw.id !== tripwireId) };
        }
        return cam;
      })
    );
  };

  const addANPRRecord = (record: Omit<ANPRRecord, 'id' | 'timestamp'>) => {
    const newRecord: ANPRRecord = {
      ...record,
      id: `ANPR-${Date.now()}`,
      timestamp: 'Just now'
    };
    setAnprList((prev) => [newRecord, ...prev]);
  };

  const addFRSPerson = (person: Omit<FRSPerson, 'id' | 'lastSeenTime'>) => {
    const newPerson: FRSPerson = {
      ...person,
      id: `POI-${Date.now().toString().slice(-4)}`,
      lastSeenTime: 'Just now'
    };
    setFrsList((prev) => [newPerson, ...prev]);
  };

  const setCameraSource = (cameraId: string, sourceType: Camera['sourceType'], customStreamUrl?: string) => {
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id === cameraId
          ? {
              ...cam,
              sourceType,
              customStreamUrl: customStreamUrl ?? cam.customStreamUrl
            }
          : cam
      )
    );
  };

  return (
    <SurveillanceContext.Provider
      value={{
        bops,
        cameras,
        alerts,
        frsList,
        anprList,
        qrtUnits,
        metrics,
        radarStations,
        radarTargets,
        selectedRadarTargetId,
        selectedBopId,
        selectedCameraId,
        gridMode,
        activeTab,
        activeAlertModal,
        isMuted,
        threatLevel,
        setSelectedBopId,
        setSelectedCameraId,
        setGridMode,
        setActiveTab,
        setActiveAlertModal,
        setSelectedRadarTargetId,
        slewCameraToRadarTarget,
        toggleMute,
        toggleCameraAIFeature,
        setCameraVisionMode,
        updateCameraPTZ,
        acknowledgeAlert,
        resolveAlert,
        completeSopStep,
        dispatchQRT,
        triggerManualAlarm,
        addTripwire,
        deleteTripwire,
        addANPRRecord,
        addFRSPerson,
        setCameraSource
      }}
    >
      {children}
    </SurveillanceContext.Provider>
  );
};

export const useSurveillance = () => {
  const ctx = useContext(SurveillanceContext);
  if (!ctx) throw new Error('useSurveillance must be used within SurveillanceProvider');
  return ctx;
};
