import React, { useState, useEffect } from 'react';
import { useSurveillance } from '../../context/SurveillanceContext';
import { 
  Shield, 
  Volume2, 
  VolumeX, 
  Radio, 
  AlertTriangle, 
  Cpu, 
  LayoutGrid, 
  Square, 
  Grid3X3,
  Clock,
  Server
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    bops, 
    selectedBopId, 
    setSelectedBopId, 
    gridMode, 
    setGridMode, 
    isMuted, 
    toggleMute, 
    threatLevel,
    triggerManualAlarm,
    metrics
  } = useSurveillance();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }));
      setUtcTime(now.toISOString().substring(11, 19) + 'Z');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-tactical-850 border-b border-tactical-border px-4 py-2.5 flex items-center justify-between shadow-md relative z-30">
      {/* Left: Organization & Project Brand */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded bg-tactical-800 border border-tactical-accent/40 shadow-inner">
          <Shield className="w-6 h-6 text-tactical-accent animate-pulse-slow" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-tactical-alert rounded-full animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              MINISTRY OF HOME AFFAIRS • BORDER SECURITY FORCES
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-hud bg-tactical-border text-tactical-accent rounded border border-tactical-accent/30">
              COTS AI C4ISR
            </span>
          </div>
          <h1 className="text-lg font-bold font-tactical tracking-wide text-white flex items-center gap-2">
            IBVAP <span className="text-sm font-normal text-slate-300">| Intelligent Border Video Analytics Platform</span>
          </h1>
        </div>
      </div>

      {/* Center: Sector Selector & Grid Controls */}
      <div className="flex items-center gap-4">
        {/* BOP Sector Filter */}
        <div className="flex items-center gap-2 bg-tactical-900 border border-tactical-border rounded px-2.5 py-1">
          <Radio className="w-3.5 h-3.5 text-tactical-accent" />
          <span className="text-xs text-slate-400 font-mono">SECTOR:</span>
          <select 
            value={selectedBopId} 
            onChange={(e) => setSelectedBopId(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer pr-1"
          >
            <option value="ALL" className="bg-tactical-850">ALL BORDER POSTS (SECTOR ALPHA-DELTA)</option>
            {bops.map(bop => (
              <option key={bop.id} value={bop.id} className="bg-tactical-850">
                {bop.name.toUpperCase()} [{bop.sector.split(' ')[0]}]
              </option>
            ))}
          </select>
        </div>

        {/* View Grid Selectors */}
        <div className="flex items-center bg-tactical-900 border border-tactical-border rounded p-0.5">
          <button
            onClick={() => setGridMode('1x1')}
            title="1x1 Single Focus"
            className={`p-1.5 rounded transition ${gridMode === '1x1' ? 'bg-tactical-accent text-tactical-900 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGridMode('2x2')}
            title="2x2 Tactical Grid"
            className={`p-1.5 rounded transition ${gridMode === '2x2' ? 'bg-tactical-accent text-tactical-900 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGridMode('3x3')}
            title="3x3 Multi-Perimeter"
            className={`p-1.5 rounded transition ${gridMode === '3x3' ? 'bg-tactical-accent text-tactical-900 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Telemetry, Audio, Threat Level & Clock */}
      <div className="flex items-center gap-3.5">
        {/* Edge Node Status */}
        <div className="hidden xl:flex items-center gap-2 bg-tactical-900/80 border border-tactical-border rounded px-2.5 py-1 text-xs font-mono">
          <Server className="w-3.5 h-3.5 text-tactical-success" />
          <span className="text-slate-400">EDGE AI:</span>
          <span className="text-tactical-success font-semibold">{metrics.fpsThroughput} FPS</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{metrics.bandwidthUsageKbps} Kbps</span>
        </div>

        {/* Threat Level */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-tactical-alert/15 border border-tactical-alert/40 rounded text-xs font-hud text-tactical-alert">
          <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
          <span className="font-bold tracking-wider">{threatLevel}</span>
        </div>

        {/* Audio Siren Toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute Perimeter Audio Siren' : 'Mute Perimeter Audio Siren'}
          className={`p-2 rounded border transition ${isMuted ? 'border-slate-700 text-slate-500 bg-tactical-900' : 'border-tactical-accent/50 text-tactical-accent bg-tactical-800 hover:bg-tactical-700'}`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Emergency Siren Broadcast Trigger */}
        <button
          onClick={() => triggerManualAlarm(selectedBopId)}
          title="Broadcast Perimeter Alarm Siren"
          className="px-2.5 py-1 bg-tactical-alert hover:bg-red-600 text-white text-xs font-bold font-hud rounded flex items-center gap-1.5 shadow-md shadow-red-950 transition active:scale-95"
        >
          <span>ALARM</span>
        </button>

        {/* Digital Clocks */}
        <div className="text-right border-l border-tactical-border pl-3 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-xs font-hud font-bold text-tactical-accent">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{currentTime} IST</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 tracking-wider">
            {utcTime} ZULU
          </div>
        </div>
      </div>
    </header>
  );
};
