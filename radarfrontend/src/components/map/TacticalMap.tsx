import React, { useEffect, useRef, useState } from 'react';
import { useSurveillance } from '../../context/SurveillanceContext';
import L from 'leaflet';
import { Shield, Radio, Video, AlertTriangle, Truck, Layers, Navigation } from 'lucide-react';

export const TacticalMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { bops, cameras, alerts, qrtUnits, radarStations, radarTargets, setSelectedCameraId, setActiveTab, setSelectedRadarTargetId } = useSurveillance();
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Jammu-Samba-Kathua border region
    const map = L.map(mapContainerRef.current, {
      center: [32.62, 74.92],
      zoom: 11,
      zoomControl: false,
    });

    // Dark Tactical Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; Ministry of Home Affairs | IBVAP Tactical GIS',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Draw Simulated International Border Fencing Line
    const borderPoints: [number, number][] = [
      [32.95, 74.65],
      [32.90, 74.72],
      [32.85, 74.73],
      [32.70, 74.75],
      [32.61, 74.73],
      [32.55, 75.12],
      [32.48, 75.25],
    ];

    L.polyline(borderPoints, {
      color: '#ff2a51',
      weight: 3,
      dashArray: '10, 8',
      opacity: 0.85,
    }).addTo(map);

    // Buffer Zone
    L.polyline(borderPoints, {
      color: '#ffb020',
      weight: 1.5,
      dashArray: '4, 6',
      opacity: 0.5,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous dynamic layers if needed
    const markersLayer = L.layerGroup().addTo(map);

    // 1. Add BOP Markers
    bops.forEach((bop) => {
      const bopIcon = L.divIcon({
        className: 'bop-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-lg bg-tactical-800 border-2 border-tactical-accent flex items-center justify-center shadow-lg shadow-cyan-950/60 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-tactical-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-tactical-900 text-[10px] font-bold text-white px-1.5 py-0.5 rounded border border-tactical-border font-mono pointer-events-none">
              ${bop.name}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(bop.coordinates, { icon: bopIcon }).addTo(markersLayer);
      marker.on('click', () => {
        setSelectedEntity({ type: 'BOP', data: bop });
      });
    });

    // 2. Add CCTV Camera Markers with FOV Cones
    cameras.forEach((cam) => {
      const camIcon = L.divIcon({
        className: 'cam-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full bg-tactical-900 border border-tactical-success flex items-center justify-center shadow cursor-pointer">
              <div class="w-2 h-2 rounded-full bg-tactical-success animate-ping"></div>
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap text-[8px] font-mono text-slate-300 pointer-events-none bg-tactical-900/80 px-1 rounded">
              ${cam.id}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(cam.coordinates, { icon: camIcon }).addTo(markersLayer);
      marker.on('click', () => {
        setSelectedEntity({ type: 'CAMERA', data: cam });
      });
    });

    // 3. Add Active Intrusion Alert Pulsing Radars
    alerts.filter(a => a.status === 'ACTIVE' && a.metadata?.coordinates).forEach((alert) => {
      const coords = alert.metadata!.coordinates!;
      const alertIcon = L.divIcon({
        className: 'alert-radar-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-10 h-10 rounded-full bg-tactical-alert/30 border-2 border-tactical-alert animate-ping"></div>
            <div class="absolute w-4 h-4 rounded-full bg-tactical-alert flex items-center justify-center text-white text-[9px] font-bold">!</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker(coords, { icon: alertIcon }).addTo(markersLayer);
      marker.on('click', () => {
        setSelectedEntity({ type: 'ALERT', data: alert });
      });
    });

    // 4. Add QRT Mobile Unit Markers
    qrtUnits.forEach((unit) => {
      const qrtIcon = L.divIcon({
        className: 'qrt-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-7 h-7 rounded bg-amber-600/90 border border-white flex items-center justify-center shadow text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="7" cy="18" r="2"/><path d="M15 18H9"/><circle cx="17" cy="18" r="2"/><path d="M17 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 15.52 8H14"/></svg>
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap bg-tactical-900 text-[8px] font-mono text-amber-300 px-1 rounded">
              ${unit.callsign}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(unit.coordinates, { icon: qrtIcon }).addTo(markersLayer);
      marker.on('click', () => {
        setSelectedEntity({ type: 'QRT', data: unit });
      });
    });

    // 5. Add Ground Radar Station Markers (scan coverage rings)
    radarStations.forEach((st) => {
      const radarIcon = L.divIcon({
        className: 'radar-station-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-7 h-7 rounded-full bg-tactical-900 border-2 border-tactical-accent flex items-center justify-center shadow">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-tactical-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/></svg>
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap bg-tactical-900 text-[8px] font-mono text-tactical-accent px-1 rounded">
              ${st.id}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.circle(st.coordinates, {
        radius: st.currentRangeKm * 1000,
        color: '#00e5ff',
        weight: 1,
        opacity: 0.35,
        fillColor: '#00e5ff',
        fillOpacity: 0.03,
        dashArray: '4, 6',
      }).addTo(markersLayer);

      const marker = L.marker(st.coordinates, { icon: radarIcon }).addTo(markersLayer);
      marker.on('click', () => {
        setSelectedEntity({ type: 'RADAR_STATION', data: st });
      });
    });

    // 6. Add Live Radar Target Blips
    radarTargets.forEach((tgt) => {
      const critical = tgt.threatLevel === 'CRITICAL';
      const dotColor = critical ? '#ff2a51' : tgt.threatLevel === 'HIGH' ? '#ffb020' : '#00e5ff';
      const radarTargetIcon = L.divIcon({
        className: 'radar-target-marker',
        html: `
          <div class="relative flex items-center justify-center">
            ${critical ? `<div class="w-6 h-6 rounded-full border-2 animate-ping" style="border-color:${dotColor};"></div>` : ''}
            <div class="absolute w-2.5 h-2.5 rounded-full border border-tactical-900" style="background-color:${dotColor};"></div>
            <div class="absolute -bottom-4 whitespace-nowrap bg-tactical-900/90 text-[8px] font-mono px-1 rounded" style="color:${dotColor};">
              ${tgt.callsign.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(tgt.coordinates, { icon: radarTargetIcon }).addTo(markersLayer);
      marker.on('click', () => {
        setSelectedEntity({ type: 'RADAR_TARGET', data: tgt });
      });
    });

    return () => {
      map.removeLayer(markersLayer);
    };
  }, [bops, cameras, alerts, qrtUnits, radarStations, radarTargets]);

  return (
    <div className="flex-1 relative flex overflow-hidden bg-tactical-900">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Map HUD Controls & Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-tactical-850/90 backdrop-blur border border-tactical-border rounded-lg p-3 shadow-xl max-w-xs font-mono text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between border-b border-tactical-border pb-1.5">
            <div className="flex items-center gap-1.5 text-tactical-accent font-bold font-hud">
              <Navigation className="w-4 h-4" />
              <span>TACTICAL GIS RADAR</span>
            </div>
            <span className="text-[10px] text-tactical-success">LIVE GPS</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-tactical-alert border-dashed" />
              <span>International Border (IB / Fence Line)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-tactical-800 border border-tactical-accent" />
              <span>Border Out Posts (BOPs)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tactical-success" />
              <span>IP CCTV Sensors (AI Ingested)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tactical-alert animate-ping" />
              <span>Active Breach / Intrusion Ping</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-600" />
              <span>Quick Reaction Teams (QRT Patrol)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-tactical-accent" />
              <span>Ground Surveillance Radar (Scan Ring)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tactical-alert" />
              <span>Live Radar Contact / Track</span>
            </div>
          </div>
        </div>
      </div>

      {/* Entity Details Side Drawer */}
      {selectedEntity && (
        <div className="absolute top-3 right-3 z-10 w-80 bg-tactical-850/95 backdrop-blur border border-tactical-border rounded-lg p-4 shadow-2xl font-mono text-xs space-y-3 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-tactical-border pb-2">
            <span className="font-bold text-tactical-accent font-hud text-sm">
              {selectedEntity.type === 'BOP' && 'BORDER OUT POST PROFILE'}
              {selectedEntity.type === 'CAMERA' && 'IP SENSOR TELEMETRY'}
              {selectedEntity.type === 'ALERT' && 'TACTICAL INCIDENT PING'}
              {selectedEntity.type === 'QRT' && 'PATROL INTERCEPTOR UNIT'}
              {selectedEntity.type === 'RADAR_STATION' && 'GROUND SURVEILLANCE RADAR'}
              {selectedEntity.type === 'RADAR_TARGET' && 'LIVE RADAR CONTACT'}
            </span>
            <button 
              onClick={() => setSelectedEntity(null)}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-tactical-800"
            >
              ✕
            </button>
          </div>

          {selectedEntity.type === 'BOP' && (
            <div className="space-y-2 text-slate-300">
              <div className="text-sm font-bold text-white font-tactical">
                {selectedEntity.data.name}
              </div>
              <div><span className="text-slate-500">Sector:</span> {selectedEntity.data.sector}</div>
              <div><span className="text-slate-500">Commander:</span> {selectedEntity.data.officerInCharge}</div>
              <div><span className="text-slate-500">Personnel:</span> {selectedEntity.data.personnelStrength} Troops</div>
              <div><span className="text-slate-500">AI Cameras:</span> {selectedEntity.data.cameraCount} Streams</div>
              <div><span className="text-slate-500">Comms Link:</span> {selectedEntity.data.networkStatus}</div>
            </div>
          )}

          {selectedEntity.type === 'CAMERA' && (
            <div className="space-y-2 text-slate-300">
              <div className="text-sm font-bold text-white font-tactical">
                {selectedEntity.data.name}
              </div>
              <div><span className="text-slate-500">BOP:</span> {selectedEntity.data.bopName}</div>
              <div><span className="text-slate-500">IP / RTSP:</span> {selectedEntity.data.ip}</div>
              <div><span className="text-slate-500">Resolution:</span> {selectedEntity.data.resolution} @ {selectedEntity.data.fps}fps</div>
              <div><span className="text-slate-500">Heading:</span> {selectedEntity.data.fovDirection}° | FOV: {selectedEntity.data.fovAngle}°</div>
              <button
                onClick={() => {
                  setSelectedCameraId(selectedEntity.data.id);
                  setActiveTab('MATRIX');
                }}
                className="w-full mt-2 py-1.5 bg-tactical-accent text-tactical-900 font-bold rounded text-xs font-hud flex items-center justify-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Switch to Live Video Stream</span>
              </button>
            </div>
          )}

          {selectedEntity.type === 'ALERT' && (
            <div className="space-y-2 text-slate-300">
              <div className="text-sm font-bold text-tactical-alert font-tactical">
                {selectedEntity.data.type}
              </div>
              <p className="text-xs text-slate-200">{selectedEntity.data.details}</p>
              <div><span className="text-slate-500">Confidence:</span> {selectedEntity.data.confidence}%</div>
              <div><span className="text-slate-500">Camera:</span> {selectedEntity.data.cameraName}</div>
              <div><span className="text-slate-500">Timestamp:</span> {selectedEntity.data.timestamp}</div>
              <button
                onClick={() => setActiveTab('ALERTS')}
                className="w-full mt-2 py-1.5 bg-tactical-alert text-white font-bold rounded text-xs font-hud flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Open Incident Response Checklist</span>
              </button>
            </div>
          )}

          {selectedEntity.type === 'QRT' && (
            <div className="space-y-2 text-slate-300">
              <div className="text-sm font-bold text-amber-300 font-tactical">
                {selectedEntity.data.callsign}
              </div>
              <div><span className="text-slate-500">Commander:</span> {selectedEntity.data.commander}</div>
              <div><span className="text-slate-500">Vehicle:</span> {selectedEntity.data.vehicleType}</div>
              <div><span className="text-slate-500">Strength:</span> {selectedEntity.data.strength} Operators</div>
              <div><span className="text-slate-500">Status:</span> <span className="text-tactical-success font-bold">{selectedEntity.data.status}</span></div>
            </div>
          )}

          {selectedEntity.type === 'RADAR_STATION' && (
            <div className="space-y-2 text-slate-300">
              <div className="text-sm font-bold text-white font-tactical">
                {selectedEntity.data.name}
              </div>
              <div><span className="text-slate-500">Model:</span> {selectedEntity.data.model}</div>
              <div><span className="text-slate-500">Band:</span> {selectedEntity.data.frequencyBand}</div>
              <div><span className="text-slate-500">Power:</span> {selectedEntity.data.transmitterPower}</div>
              <div><span className="text-slate-500">Range:</span> {selectedEntity.data.currentRangeKm}/{selectedEntity.data.maxRangeKm} km</div>
              <div><span className="text-slate-500">Status:</span> <span className="text-tactical-accent font-bold">{selectedEntity.data.status.replace(/_/g, ' ')}</span></div>
              <button
                onClick={() => setActiveTab('RADAR')}
                className="w-full mt-2 py-1.5 bg-tactical-accent text-tactical-900 font-bold rounded text-xs font-hud flex items-center justify-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Open Radar Detection Console</span>
              </button>
            </div>
          )}

          {selectedEntity.type === 'RADAR_TARGET' && (
            <div className="space-y-2 text-slate-300">
              <div className="text-sm font-bold text-tactical-alert font-tactical">
                {selectedEntity.data.callsign}
              </div>
              <div><span className="text-slate-500">Classification:</span> {selectedEntity.data.classification.replace(/_/g, ' ')}</div>
              <div><span className="text-slate-500">Range:</span> {selectedEntity.data.rangeMeters.toLocaleString()} m</div>
              <div><span className="text-slate-500">Bearing:</span> {selectedEntity.data.azimuthDeg.toFixed(1)}°</div>
              <div><span className="text-slate-500">Velocity:</span> {selectedEntity.data.radialVelocityKmh.toFixed(1)} km/h</div>
              <div><span className="text-slate-500">Threat:</span> <span className="text-tactical-alert font-bold">{selectedEntity.data.threatLevel}</span></div>
              <button
                onClick={() => {
                  setSelectedRadarTargetId(selectedEntity.data.id);
                  setActiveTab('RADAR');
                }}
                className="w-full mt-2 py-1.5 bg-tactical-alert text-white font-bold rounded text-xs font-hud flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Track in Radar Console</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
