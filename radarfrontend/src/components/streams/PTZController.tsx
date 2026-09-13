import React, { useState } from 'react';
import { Camera } from '../../types';
import { useSurveillance } from '../../context/SurveillanceContext';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Compass, 
  Play, 
  Pause 
} from 'lucide-react';

interface PTZControllerProps {
  camera: Camera;
  onClose: () => void;
}

export const PTZController: React.FC<PTZControllerProps> = ({ camera, onClose }) => {
  const { updateCameraPTZ } = useSurveillance();
  const [isPatrolling, setIsPatrolling] = useState<boolean>(false);

  const handlePan = (delta: number) => {
    updateCameraPTZ(camera.id, camera.ptz.pan + delta, camera.ptz.tilt, camera.ptz.zoom);
  };

  const handleTilt = (delta: number) => {
    updateCameraPTZ(camera.id, camera.ptz.pan, camera.ptz.tilt + delta, camera.ptz.zoom);
  };

  const handleZoom = (delta: number) => {
    updateCameraPTZ(camera.id, camera.ptz.pan, camera.ptz.tilt, camera.ptz.zoom + delta);
  };

  const resetPreset = () => {
    updateCameraPTZ(camera.id, 0, 0, 1);
  };

  return (
    <div className="bg-tactical-850 border border-tactical-border rounded-lg p-3 w-64 shadow-xl z-30">
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-tactical-accent font-hud">
          <Compass className="w-4 h-4" />
          <span>PTZ SENTRY CONTROLS</span>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-tactical-800"
        >
          ✕
        </button>
      </div>

      {/* D-Pad Direction Controller */}
      <div className="flex flex-col items-center justify-center my-2">
        <button
          onClick={() => handleTilt(5)}
          className="p-2 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-200 border border-tactical-border active:scale-95 transition"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4 my-1">
          <button
            onClick={() => handlePan(-10)}
            className="p-2 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-200 border border-tactical-border active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-full bg-tactical-900 border border-tactical-accent/40 flex items-center justify-center text-[10px] font-mono text-tactical-accent">
            PTZ
          </div>
          <button
            onClick={() => handlePan(10)}
            className="p-2 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-200 border border-tactical-border active:scale-95 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => handleTilt(-5)}
          className="p-2 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-200 border border-tactical-border active:scale-95 transition"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom and Presets */}
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
        <button
          onClick={() => handleZoom(1)}
          className="flex items-center justify-center gap-1 py-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-200 border border-tactical-border"
        >
          <ZoomIn className="w-3.5 h-3.5 text-tactical-accent" />
          <span>Zoom In</span>
        </button>
        <button
          onClick={() => handleZoom(-1)}
          className="flex items-center justify-center gap-1 py-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-200 border border-tactical-border"
        >
          <ZoomOut className="w-3.5 h-3.5 text-tactical-accent" />
          <span>Zoom Out</span>
        </button>
      </div>

      {/* Telemetry readouts */}
      <div className="mt-3 p-2 bg-tactical-900 rounded border border-tactical-border/60 text-[10px] font-mono text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Pan:</span>
          <span className="text-tactical-accent font-bold">{camera.ptz.pan}°</span>
        </div>
        <div className="flex justify-between">
          <span>Tilt:</span>
          <span className="text-tactical-accent font-bold">{camera.ptz.tilt}°</span>
        </div>
        <div className="flex justify-between">
          <span>Zoom Factor:</span>
          <span className="text-tactical-accent font-bold">{camera.ptz.zoom.toFixed(1)}x</span>
        </div>
      </div>

      {/* Auto Patrol & Reset */}
      <div className="flex items-center justify-between gap-2 mt-3">
        <button
          onClick={() => setIsPatrolling(!isPatrolling)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-hud rounded font-semibold transition ${
            isPatrolling
              ? 'bg-tactical-warning text-tactical-900'
              : 'bg-tactical-800 text-slate-300 hover:text-white border border-tactical-border'
          }`}
        >
          {isPatrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isPatrolling ? 'Patrolling' : 'Auto-Tour'}</span>
        </button>
        <button
          onClick={resetPreset}
          title="Reset to Zero Preset"
          className="p-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 border border-tactical-border"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
