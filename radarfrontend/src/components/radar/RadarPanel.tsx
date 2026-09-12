import React, { useMemo, useState } from 'react';
import { useSurveillance } from '../../context/SurveillanceContext';
import { RadarTarget, RadarTargetClass } from '../../types';
import {
  Radar as RadarIcon,
  Crosshair,
  TowerControl,
  Signal,
  Waves,
  Target,
  User,
  Users,
  Car,
  Plane,
  Video,
  Gauge,
  ShieldAlert
} from 'lucide-react';

// Scope render constants (SVG user-space units)
const SCOPE_SIZE = 420;
const SCOPE_CENTER = SCOPE_SIZE / 2;
const SCOPE_RADIUS = SCOPE_SIZE / 2 - 30;
const SCOPE_MAX_RANGE_M = 6000; // display ceiling for the PPI scope
const RANGE_RINGS = [1500, 3000, 4500, 6000];

const CLASS_META: Record<
  RadarTargetClass,
  { label: string; color: string; icon: React.ReactNode }
> = {
  CRAWLER_HUMAN: { label: 'Crawling Human', color: '#ff2a51', icon: <User className="w-3.5 h-3.5" /> },
  PEDESTRIAN: { label: 'Pedestrian Group', color: '#ffb020', icon: <Users className="w-3.5 h-3.5" /> },
  VEHICLE: { label: 'Vehicle', color: '#00e5ff', icon: <Car className="w-3.5 h-3.5" /> },
  DRONE_UAV: { label: 'UAV / Drone', color: '#c084fc', icon: <Plane className="w-3.5 h-3.5" /> },
  UNKNOWN: { label: 'Unclassified', color: '#94a3b8', icon: <Target className="w-3.5 h-3.5" /> }
};

const THREAT_COLOR: Record<RadarTarget['threatLevel'], string> = {
  CRITICAL: 'text-tactical-alert border-tactical-alert/50 bg-tactical-alert/10',
  HIGH: 'text-tactical-warning border-tactical-warning/50 bg-tactical-warning/10',
  MEDIUM: 'text-tactical-accent border-tactical-accent/40 bg-tactical-accent/10',
  LOW: 'text-slate-300 border-slate-600 bg-slate-800/40'
};

function polarToXY(rangeMeters: number, azimuthDeg: number) {
  const r = Math.min(1, rangeMeters / SCOPE_MAX_RANGE_M) * SCOPE_RADIUS;
  const rad = (azimuthDeg * Math.PI) / 180;
  const x = SCOPE_CENTER + r * Math.sin(rad);
  const y = SCOPE_CENTER - r * Math.cos(rad);
  return { x, y };
}

export const RadarPanel: React.FC = () => {
  const {
    radarStations,
    radarTargets,
    selectedRadarTargetId,
    setSelectedRadarTargetId,
    slewCameraToRadarTarget,
    cameras
  } = useSurveillance();

  const [activeStationId, setActiveStationId] = useState<string>(radarStations[0]?.id ?? '');

  const stationTargets = useMemo(
    () => radarTargets.filter((t) => t.bopId === radarStations.find((s) => s.id === activeStationId)?.bopId),
    [radarTargets, radarStations, activeStationId]
  );

  const selectedTarget = radarTargets.find((t) => t.id === selectedRadarTargetId) ?? null;
  const activeStation = radarStations.find((s) => s.id === activeStationId) ?? radarStations[0];

  const criticalCount = radarTargets.filter((t) => t.threatLevel === 'CRITICAL').length;
  const stationsOnline = radarStations.filter((s) => s.status !== 'STANDBY').length;

  const nearestCamera = selectedTarget ? cameras.find((c) => c.id === selectedTarget.nearestCameraId) : null;

  return (
    <div className="flex-1 flex flex-col p-4 bg-tactical-900 overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold font-tactical text-white flex items-center gap-2">
            <RadarIcon className="w-5 h-5 text-tactical-accent" />
            <span>GROUND SURVEILLANCE RADAR (GSR) — INTRUSION DETECTION</span>
          </h2>
          <p className="text-slate-400 text-xs">
            X/J-Band Doppler ground radars fused with EO/IR camera cross-cueing for all-weather, day/night perimeter detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-tactical-850 border border-tactical-border rounded px-3 py-1.5">
            <Signal className="w-3.5 h-3.5 text-tactical-success" />
            <span className="text-slate-400">Stations Online:</span>
            <span className="text-tactical-success font-bold">{stationsOnline}/{radarStations.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-tactical-850 border border-tactical-border rounded px-3 py-1.5">
            <Waves className="w-3.5 h-3.5 text-tactical-accent" />
            <span className="text-slate-400">Active Tracks:</span>
            <span className="text-white font-bold">{radarTargets.length}</span>
          </div>
          <div className={`flex items-center gap-2 rounded px-3 py-1.5 border ${criticalCount > 0 ? 'bg-tactical-alert/15 border-tactical-alert/50 text-tactical-alert' : 'bg-tactical-850 border-tactical-border text-slate-400'}`}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Critical Contacts:</span>
            <span className="font-bold">{criticalCount}</span>
          </div>
        </div>
      </div>

      {/* Station Tabs */}
      <div className="flex items-center gap-2 mb-3">
        {radarStations.map((st) => (
          <button
            key={st.id}
            onClick={() => setActiveStationId(st.id)}
            className={`px-3 py-1.5 rounded border text-[11px] font-hud flex items-center gap-1.5 transition ${
              activeStationId === st.id
                ? 'bg-tactical-800 border-tactical-accent/50 text-tactical-accent'
                : 'bg-tactical-850 border-tactical-border text-slate-400 hover:text-white'
            }`}
          >
            <TowerControl className="w-3.5 h-3.5" />
            {st.bopName} — {st.id}
          </button>
        ))}
      </div>

      {/* Main Body: Scope + Target List/Detail */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* PPI Scope */}
        <div className="w-[440px] shrink-0 bg-tactical-850 border border-tactical-border rounded-lg p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2 text-[11px] text-slate-400">
            <span className="font-hud text-tactical-accent">{activeStation?.name ?? 'NO STATION SELECTED'}</span>
            <span>{activeStation?.status.replace(/_/g, ' ')}</span>
          </div>

          <svg viewBox={`0 0 ${SCOPE_SIZE} ${SCOPE_SIZE}`} className="w-full h-auto">
            {/* Background */}
            <circle cx={SCOPE_CENTER} cy={SCOPE_CENTER} r={SCOPE_RADIUS} fill="#070b12" stroke="#1f334f" strokeWidth={1} />

            {/* Range rings */}
            {RANGE_RINGS.map((rng) => {
              const r = (rng / SCOPE_MAX_RANGE_M) * SCOPE_RADIUS;
              return (
                <g key={rng}>
                  <circle cx={SCOPE_CENTER} cy={SCOPE_CENTER} r={r} fill="none" stroke="#1f334f" strokeWidth={1} strokeDasharray="3,4" />
                  <text x={SCOPE_CENTER + 4} y={SCOPE_CENTER - r + 10} fill="#475569" fontSize="9" fontFamily="monospace">
                    {(rng / 1000).toFixed(1)}km
                  </text>
                </g>
              );
            })}

            {/* Crosshair axes */}
            <line x1={SCOPE_CENTER} y1={SCOPE_CENTER - SCOPE_RADIUS} x2={SCOPE_CENTER} y2={SCOPE_CENTER + SCOPE_RADIUS} stroke="#1f334f" strokeWidth={1} />
            <line x1={SCOPE_CENTER - SCOPE_RADIUS} y1={SCOPE_CENTER} x2={SCOPE_CENTER + SCOPE_RADIUS} y2={SCOPE_CENTER} stroke="#1f334f" strokeWidth={1} />

            {/* Cardinal labels */}
            <text x={SCOPE_CENTER - 4} y={SCOPE_CENTER - SCOPE_RADIUS - 8} fill="#64748b" fontSize="10" fontFamily="monospace">N</text>
            <text x={SCOPE_CENTER + SCOPE_RADIUS + 6} y={SCOPE_CENTER + 4} fill="#64748b" fontSize="10" fontFamily="monospace">E</text>
            <text x={SCOPE_CENTER - 4} y={SCOPE_CENTER + SCOPE_RADIUS + 16} fill="#64748b" fontSize="10" fontFamily="monospace">S</text>
            <text x={SCOPE_CENTER - SCOPE_RADIUS - 14} y={SCOPE_CENTER + 4} fill="#64748b" fontSize="10" fontFamily="monospace">W</text>

            {/* Rotating sweep beam */}
            <g style={{ transformOrigin: `${SCOPE_CENTER}px ${SCOPE_CENTER}px` }} className="animate-radar-sweep">
              <path
                d={`M ${SCOPE_CENTER} ${SCOPE_CENTER} L ${SCOPE_CENTER} ${SCOPE_CENTER - SCOPE_RADIUS} A ${SCOPE_RADIUS} ${SCOPE_RADIUS} 0 0 1 ${
                  SCOPE_CENTER + SCOPE_RADIUS * Math.sin((28 * Math.PI) / 180)
                } ${SCOPE_CENTER - SCOPE_RADIUS * Math.cos((28 * Math.PI) / 180)} Z`}
                fill="url(#sweepGradient)"
                opacity={0.35}
              />
              <line x1={SCOPE_CENTER} y1={SCOPE_CENTER} x2={SCOPE_CENTER} y2={SCOPE_CENTER - SCOPE_RADIUS} stroke="#00e5ff" strokeWidth={1.5} opacity={0.8} />
            </g>

            <defs>
              <linearGradient id="sweepGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Target blips */}
            {stationTargets.map((tgt) => {
              const { x, y } = polarToXY(tgt.rangeMeters, tgt.azimuthDeg);
              const meta = CLASS_META[tgt.classification];
              const isSelected = tgt.id === selectedRadarTargetId;
              return (
                <g
                  key={tgt.id}
                  onClick={() => setSelectedRadarTargetId(tgt.id)}
                  className="cursor-pointer"
                >
                  {tgt.threatLevel === 'CRITICAL' && (
                    <circle cx={x} cy={y} r={10} fill={meta.color} opacity={0.25} className="animate-ping" />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 7 : 5}
                    fill={meta.color}
                    stroke={isSelected ? '#ffffff' : '#070b12'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text x={x + 9} y={y + 3} fill={meta.color} fontSize="8.5" fontFamily="monospace">
                    {tgt.callsign.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
            {(Object.keys(CLASS_META) as RadarTargetClass[]).map((cls) => (
              <div key={cls} className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CLASS_META[cls].color }} />
                <span>{CLASS_META[cls].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Track table + detail */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Track table */}
          <div className="bg-tactical-850 border border-tactical-border rounded-lg flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-tactical-800 text-slate-400 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2">Track / Callsign</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Range</th>
                  <th className="px-3 py-2">Bearing</th>
                  <th className="px-3 py-2">Velocity</th>
                  <th className="px-3 py-2">RCS (m²)</th>
                  <th className="px-3 py-2">Threat</th>
                  <th className="px-3 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {radarTargets.map((tgt) => {
                  const meta = CLASS_META[tgt.classification];
                  const isSelected = tgt.id === selectedRadarTargetId;
                  return (
                    <tr
                      key={tgt.id}
                      onClick={() => setSelectedRadarTargetId(tgt.id)}
                      className={`cursor-pointer border-t border-tactical-border/60 transition ${
                        isSelected ? 'bg-tactical-accent/10' : 'hover:bg-tactical-800/60'
                      }`}
                    >
                      <td className="px-3 py-2 font-semibold text-white">{tgt.callsign}</td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5" style={{ color: meta.color }}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{tgt.rangeMeters.toLocaleString()} m</td>
                      <td className="px-3 py-2 text-slate-300">{tgt.azimuthDeg.toFixed(1)}°</td>
                      <td className="px-3 py-2 text-slate-300">{tgt.radialVelocityKmh.toFixed(1)} km/h</td>
                      <td className="px-3 py-2 text-slate-300">{tgt.rcsM2.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${THREAT_COLOR[tgt.threatLevel]}`}>
                          {tgt.threatLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{tgt.lastUpdated}</td>
                    </tr>
                  );
                })}
                {radarTargets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                      No radar contacts within scan envelope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Selected target detail + station cards row */}
          <div className="flex gap-4 h-44 shrink-0">
            {/* Detail panel */}
            <div className="flex-1 bg-tactical-850 border border-tactical-border rounded-lg p-3 overflow-auto">
              {selectedTarget ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-tactical-border pb-1.5">
                    <span className="font-bold font-hud text-tactical-accent flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5" />
                      {selectedTarget.callsign}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${THREAT_COLOR[selectedTarget.threatLevel]}`}>
                      {selectedTarget.threatLevel} THREAT
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-slate-300">
                    <div><span className="text-slate-500">Range:</span> {selectedTarget.rangeMeters.toLocaleString()} m</div>
                    <div><span className="text-slate-500">Bearing:</span> {selectedTarget.azimuthDeg.toFixed(1)}°</div>
                    <div><span className="text-slate-500">Elevation:</span> {selectedTarget.elevationDeg?.toFixed(1) ?? '—'}°</div>
                    <div><span className="text-slate-500">Velocity:</span> {selectedTarget.radialVelocityKmh.toFixed(1)} km/h</div>
                    <div><span className="text-slate-500">RCS:</span> {selectedTarget.rcsM2.toFixed(2)} m²</div>
                    <div><span className="text-slate-500">Classification:</span> {CLASS_META[selectedTarget.classification].label}</div>
                    <div><span className="text-slate-500">Nearest Camera:</span> {nearestCamera?.name ?? selectedTarget.nearestCameraId}</div>
                    <div><span className="text-slate-500">Last Update:</span> {selectedTarget.lastUpdated}</div>
                  </div>
                  <button
                    onClick={() => slewCameraToRadarTarget(selectedTarget.id)}
                    className="w-full mt-2 py-1.5 bg-tactical-accent text-tactical-900 font-bold rounded text-xs font-hud flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Cross-Cue Nearest Camera to Bearing</span>
                  </button>
                </div>
              ) : (
                <div className="text-slate-500 h-full flex items-center justify-center">Select a track to view detail</div>
              )}
            </div>

            {/* Station status cards */}
            <div className="w-72 shrink-0 flex flex-col gap-2 overflow-auto">
              {radarStations.map((st) => (
                <div key={st.id} className="bg-tactical-850 border border-tactical-border rounded-lg p-2.5 text-[10.5px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <TowerControl className="w-3 h-3 text-tactical-accent" />
                      {st.id}
                    </span>
                    <span className={`text-[9px] font-bold ${st.status === 'STANDBY' ? 'text-slate-500' : 'text-tactical-success'}`}>
                      {st.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-slate-400">{st.model}</div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {st.rpm} RPM</span>
                    <span>{st.currentRangeKm}/{st.maxRangeKm} km</span>
                  </div>
                  <div className="text-slate-500">{st.frequencyBand}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
