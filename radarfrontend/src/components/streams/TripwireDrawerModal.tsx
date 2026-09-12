import React, { useState } from 'react';
import { Camera } from '../../types';
import { useSurveillance } from '../../context/SurveillanceContext';
import { CanvasStreamPlayer } from './CanvasStreamPlayer';
import { ShieldAlert, Check, X, Info } from 'lucide-react';

interface TripwireDrawerModalProps {
  camera: Camera;
  onClose: () => void;
}

export const TripwireDrawerModal: React.FC<TripwireDrawerModalProps> = ({ camera, onClose }) => {
  const { addTripwire } = useSurveillance();
  const [wireName, setWireName] = useState<string>('Perimeter Virtual Fence 01');
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);

  const handleCanvasClick = (relX: number, relY: number) => {
    if (points.length < 2) {
      setPoints([...points, { x: relX, y: relY }]);
    } else {
      // Reset with first new point
      setPoints([{ x: relX, y: relY }]);
    }
  };

  const handleSave = () => {
    if (points.length === 2 && wireName.trim()) {
      addTripwire(camera.id, wireName.trim(), points);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-tactical-850 border border-tactical-border rounded-lg max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 bg-tactical-900 border-b border-tactical-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-tactical-accent" />
            <h3 className="font-tactical font-bold text-white text-sm">
              Virtual Fence & Tripwire Studio: <span className="text-tactical-accent">{camera.name}</span>
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 rounded bg-tactical-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="bg-tactical-800/80 px-4 py-2 border-b border-tactical-border/60 flex items-center gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-tactical-accent shrink-0" />
          <span>
            {points.length === 0 && 'Click anywhere on the stream to set Point A (Start of virtual tripwire).'}
            {points.length === 1 && 'Click on the stream to set Point B (End of virtual tripwire).'}
            {points.length === 2 && 'Tripwire defined! Review or click anywhere to re-draw.'}
          </span>
        </div>

        {/* Video Canvas for Drawing */}
        <div className="relative aspect-video w-full bg-tactical-900">
          <CanvasStreamPlayer 
            camera={camera} 
            showOverlays={true} 
            interactive={true} 
            onCanvasClick={handleCanvasClick} 
          />
          {/* Points indicator overlay */}
          {points.map((pt, idx) => (
            <div
              key={idx}
              className="absolute w-4 h-4 rounded-full bg-tactical-accent border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-[9px] font-bold text-black"
              style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }}
            >
              {idx === 0 ? 'A' : 'B'}
            </div>
          ))}
        </div>

        {/* Form controls */}
        <div className="p-4 bg-tactical-900 border-t border-tactical-border flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              TRIPWIRE ZONE IDENTIFIER
            </label>
            <input
              type="text"
              value={wireName}
              onChange={(e) => setWireName(e.target.value)}
              className="w-full bg-tactical-800 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none focus:border-tactical-accent"
              placeholder="e.g. Zero-Line Primary Fence"
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <button
              onClick={() => setPoints([])}
              className="px-3 py-1.5 rounded bg-tactical-800 text-slate-300 hover:text-white text-xs font-mono"
            >
              Clear Points
            </button>
            <button
              onClick={handleSave}
              disabled={points.length < 2 || !wireName.trim()}
              className="px-4 py-1.5 rounded bg-tactical-accent hover:bg-cyan-400 text-tactical-900 font-bold text-xs font-hud flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Apply Virtual Tripwire</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
