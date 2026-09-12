import React, { useState } from 'react';
import { useSurveillance } from '../../context/SurveillanceContext';
import { Alert, AlertSeverity } from '../../types';
import { IncidentModal } from './IncidentModal';
import { 
  BellRing, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ArrowUpRight,
  SlidersHorizontal
} from 'lucide-react';

export const AlertsPanel: React.FC = () => {
  const { alerts, acknowledgeAlert } = useSurveillance();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [activeOnly, setActiveOnly] = useState<boolean>(false);
  const [activeIncident, setActiveIncident] = useState<Alert | null>(null);

  const filteredAlerts = alerts.filter((alt) => {
    if (activeOnly && alt.status !== 'ACTIVE') return false;
    if (filterSeverity !== 'ALL' && alt.severity !== filterSeverity) return false;
    return true;
  });

  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="flex-1 flex flex-col p-4 bg-tactical-900 overflow-hidden">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-tactical-850 border border-tactical-alert/40 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Critical Incursions</span>
            <div className="text-2xl font-bold font-hud text-tactical-alert">{criticalCount}</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-tactical-alert opacity-80" />
        </div>

        <div className="bg-tactical-850 border border-tactical-border p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Active Incidents</span>
            <div className="text-2xl font-bold font-hud text-tactical-warning">{activeCount}</div>
          </div>
          <BellRing className="w-8 h-8 text-tactical-warning opacity-80" />
        </div>

        <div className="bg-tactical-850 border border-tactical-border p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Mean AI Inference Lag</span>
            <div className="text-2xl font-bold font-hud text-tactical-accent">42 ms</div>
          </div>
          <Clock className="w-8 h-8 text-tactical-accent opacity-80" />
        </div>

        <div className="bg-tactical-850 border border-tactical-border p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">AI False Alarm Filter</span>
            <div className="text-2xl font-bold font-hud text-tactical-success">98.4%</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-tactical-success opacity-80" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-tactical-850 border border-tactical-border p-2.5 rounded-lg mb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-tactical-accent" />
          <span className="text-xs font-mono text-slate-400">FILTER SEVERITY:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'WARNING'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
                filterSeverity === sev
                  ? 'bg-tactical-accent text-tactical-900 font-bold'
                  : 'bg-tactical-800 text-slate-300 hover:text-white border border-tactical-border'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="accent-tactical-accent w-4 h-4 rounded"
            />
            <span>Active Incidents Only</span>
          </label>
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-mono text-sm">
            No incidents match the selected filter criteria. Perimeter is secure.
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            const isCritical = alt.severity === 'CRITICAL';
            const isHigh = alt.severity === 'HIGH';

            return (
              <div
                key={alt.id}
                className={`p-3.5 rounded-lg border transition flex items-center justify-between gap-4 ${
                  alt.status === 'ACTIVE'
                    ? isCritical
                      ? 'bg-tactical-alert/10 border-tactical-alert/60'
                      : isHigh
                      ? 'bg-tactical-warning/10 border-tactical-warning/60'
                      : 'bg-tactical-850 border-tactical-border'
                    : 'bg-tactical-900 border-tactical-border/50 opacity-70'
                }`}
              >
                {/* Left: Severity and Details */}
                <div className="flex items-start gap-3.5">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    isCritical 
                      ? 'bg-tactical-alert text-white animate-pulse' 
                      : isHigh 
                      ? 'bg-tactical-warning text-tactical-900 font-bold' 
                      : 'bg-tactical-800 text-slate-300 border border-tactical-border'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-hud text-white">
                        {alt.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {alt.id} • {alt.timestamp} IST
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                        alt.status === 'ACTIVE' ? 'bg-tactical-alert/20 text-tactical-alert border border-tactical-alert/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {alt.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 mt-1 max-w-2xl">
                      {alt.details}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-slate-400">
                      <span>Camera: <span className="text-slate-200 font-semibold">{alt.cameraName}</span></span>
                      <span>BOP: <span className="text-slate-200 font-semibold">{alt.bopName}</span></span>
                      <span>AI Confidence: <span className="text-tactical-success font-semibold">{alt.confidence}%</span></span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {alt.status === 'ACTIVE' && (
                    <button
                      onClick={() => acknowledgeAlert(alt.id)}
                      className="px-3 py-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-200 text-xs font-mono border border-tactical-border transition"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => setActiveIncident(alt)}
                    className="px-3.5 py-1.5 rounded bg-tactical-accent hover:bg-cyan-400 text-tactical-900 font-bold text-xs font-hud flex items-center gap-1 shadow transition"
                  >
                    <span>SOP Response</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Incident Action Modal */}
      {activeIncident && (
        <IncidentModal alert={activeIncident} onClose={() => setActiveIncident(null)} />
      )}
    </div>
  );
};
