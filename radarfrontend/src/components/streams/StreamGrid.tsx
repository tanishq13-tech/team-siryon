import React from 'react';
import { useSurveillance } from '../../context/SurveillanceContext';
import { CameraCard } from './CameraCard';

export const StreamGrid: React.FC = () => {
  const { 
    cameras, 
    selectedBopId, 
    gridMode, 
    selectedCameraId, 
    setSelectedCameraId 
  } = useSurveillance();

  const filteredCameras = cameras.filter((cam) => {
    if (selectedBopId === 'ALL') return true;
    return cam.bopId === selectedBopId;
  });

  if (gridMode === '1x1') {
    const focusedCamera = cameras.find((c) => c.id === selectedCameraId) || filteredCameras[0] || cameras[0];

    return (
      <div className="flex-1 flex flex-col p-3 overflow-hidden bg-tactical-900">
        {/* Quick Camera Selector Bar */}
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold shrink-0">
            Select Stream:
          </span>
          {cameras.map((cam) => (
            <button
              key={cam.id}
              onClick={() => setSelectedCameraId(cam.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono shrink-0 border transition ${
                cam.id === focusedCamera.id
                  ? 'bg-tactical-accent text-tactical-900 font-bold border-tactical-accent'
                  : 'bg-tactical-850 text-slate-300 border-tactical-border hover:bg-tactical-800'
              }`}
            >
              {cam.name} ({cam.id})
            </button>
          ))}
        </div>

        <div className="flex-1 flex">
          <CameraCard camera={focusedCamera} />
        </div>
      </div>
    );
  }

  const gridClasses = 
    gridMode === '2x2' 
      ? 'grid-cols-1 md:grid-cols-2 grid-rows-2' 
      : 'grid-cols-1 md:grid-cols-3 grid-rows-3';

  return (
    <div className="flex-1 overflow-y-auto p-3 bg-tactical-900">
      <div className={`grid ${gridClasses} gap-3 h-full min-h-[600px]`}>
        {filteredCameras.map((cam) => (
          <CameraCard key={cam.id} camera={cam} />
        ))}
      </div>
    </div>
  );
};
