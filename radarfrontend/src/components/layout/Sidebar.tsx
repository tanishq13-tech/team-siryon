import React from 'react';
import { useSurveillance, ActiveTab } from '../../context/SurveillanceContext';
import { 
  Tv, 
  Map, 
  BellRing, 
  Car, 
  UserCheck, 
  FileSearch, 
  Network, 
  Cpu, 
  HardDrive,
  Activity,
  Radar
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts, metrics, radarTargets } = useSurveillance();

  const activeAlertCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalRadarCount = radarTargets.filter(t => t.threatLevel === 'CRITICAL').length;

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }> = [
    { id: 'MATRIX', label: 'Video Matrix', icon: <Tv className="w-4 h-4" /> },
    { id: 'MAP', label: 'Tactical GIS Map', icon: <Map className="w-4 h-4" /> },
    { 
      id: 'RADAR', 
      label: 'Radar Detection', 
      icon: <Radar className="w-4 h-4" />, 
      badge: criticalRadarCount, 
      badgeColor: 'bg-tactical-alert text-white' 
    },
    { 
      id: 'ALERTS', 
      label: 'Security Alerts', 
      icon: <BellRing className="w-4 h-4" />, 
      badge: activeAlertCount, 
      badgeColor: 'bg-tactical-alert text-white' 
    },
    { id: 'ANPR', label: 'ANPR Hub', icon: <Car className="w-4 h-4" /> },
    { id: 'FRS', label: 'FRS Biometrics', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'FORENSICS', label: 'Forensics & Audit', icon: <FileSearch className="w-4 h-4" /> },
    { id: 'TOPOLOGY', label: 'Edge Topology', icon: <Network className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 bg-tactical-850 border-r border-tactical-border flex flex-col justify-between select-none z-20 shrink-0">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-3 py-1 font-semibold">
          Operational Modules
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-tactical font-medium transition ${
                isActive
                  ? 'bg-tactical-800 text-tactical-accent border border-tactical-accent/40 shadow-sm'
                  : 'text-slate-300 hover:bg-tactical-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-tactical-accent' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* BOP Edge Server Hardware Telemetry */}
      <div className="p-3.5 bg-tactical-900/90 border-t border-tactical-border space-y-2.5 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold border-b border-tactical-border/60 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-tactical-accent" />
            <span>BOP EDGE TELEMETRY</span>
          </div>
          <span className="text-[10px] text-tactical-success">HEALTHY</span>
        </div>

        {/* CPU Meter */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-slate-500" /> Edge CPU</span>
            <span className="text-white font-bold">{Math.round(metrics.edgeCpuPercent)}%</span>
          </div>
          <div className="w-full bg-tactical-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-tactical-accent h-full transition-all duration-500"
              style={{ width: `${metrics.edgeCpuPercent}%` }}
            />
          </div>
        </div>

        {/* GPU Inference Load */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-slate-500" /> Edge AI GPU</span>
            <span className="text-tactical-warning font-bold">{Math.round(metrics.edgeGpuPercent)}%</span>
          </div>
          <div className="w-full bg-tactical-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-tactical-warning h-full transition-all duration-500"
              style={{ width: `${metrics.edgeGpuPercent}%` }}
            />
          </div>
        </div>

        {/* RAM Usage */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3 text-slate-500" /> RAM 16GB</span>
            <span className="text-slate-300">{Math.round(metrics.edgeMemoryPercent)}%</span>
          </div>
          <div className="w-full bg-tactical-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-slate-400 h-full transition-all duration-500"
              style={{ width: `${metrics.edgeMemoryPercent}%` }}
            />
          </div>
        </div>

        <div className="pt-1 text-[10px] text-slate-500 text-center">
          COTS Edge Server: Dell XR4000
        </div>
      </div>
    </aside>
  );
};
