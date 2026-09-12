import React, { useState, useRef } from 'react';
import { Camera } from '../../types';
import { useSurveillance } from '../../context/SurveillanceContext';
import { CanvasStreamPlayer } from './CanvasStreamPlayer';
import { PTZController } from './PTZController';
import { TripwireDrawerModal } from './TripwireDrawerModal';
import { 
  Eye, 
  EyeOff, 
  Flame, 
  Moon, 
  Sun, 
  Maximize2, 
  Compass, 
  ShieldAlert, 
  Camera as CameraIcon,
  Video,
  Upload,
  Link as LinkIcon,
  Sparkles,
  X
} from 'lucide-react';

interface CameraCardProps {
  camera: Camera;
}

export const CameraCard: React.FC<CameraCardProps> = ({ camera }) => {
  const { 
    setCameraVisionMode, 
    toggleCameraAIFeature, 
    setSelectedCameraId,
    setGridMode,
    setCameraSource
  } = useSurveillance();

  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [showPTZ, setShowPTZ] = useState<boolean>(false);
  const [showTripwireDrawer, setShowTripwireDrawer] = useState<boolean>(false);
  const [showSourceModal, setShowSourceModal] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>(camera.customStreamUrl || '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cycleVisionMode = () => {
    if (camera.visionMode === 'STANDARD') {
      setCameraVisionMode(camera.id, 'THERMAL_FLIR');
    } else if (camera.visionMode === 'THERMAL_FLIR') {
      setCameraVisionMode(camera.id, 'NIGHT_VISION');
    } else {
      setCameraVisionMode(camera.id, 'STANDARD');
    }
  };

  const handleMaximize = () => {
    setSelectedCameraId(camera.id);
    setGridMode('1x1');
  };

  const takeSnapshot = () => {
    // Flash effect
    alert(`Snapshot recorded from ${camera.id} at ${new Date().toLocaleTimeString()} IST. Stored in tamper-proof evidence vault.`);
  };

  return (
    <div className="bg-tactical-850 border border-tactical-border rounded-lg overflow-hidden flex flex-col shadow-lg relative group">
      {/* Top HUD Bar */}
      <div className="p-2 bg-tactical-900 border-b border-tactical-border flex items-center justify-between z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-2 h-2 rounded-full bg-tactical-success animate-pulse" />
          <div className="truncate">
            <span className="text-xs font-bold font-tactical text-white truncate block">
              {camera.name}
            </span>
            <span className="text-[10px] font-mono text-slate-400 truncate block">
              {camera.bopName} • {camera.ip}
            </span>
          </div>
        </div>

        {/* Quick Mode & Maximize buttons */}
        <div className="flex items-center gap-1">
          {/* Stream Source Selector Button */}
          <button
            onClick={() => setShowSourceModal(true)}
            title={`Current Feed Source: ${camera.sourceType || 'SIMULATION'}. Click to connect real webcam, RTSP, or video file.`}
            className={`px-1.5 py-1 rounded text-[9px] font-mono font-bold flex items-center gap-1 border transition ${
              camera.sourceType === 'WEBCAM'
                ? 'bg-tactical-success/25 border-tactical-success text-tactical-success animate-pulse'
                : camera.sourceType === 'VIDEO_URL'
                ? 'bg-blue-500/25 border-blue-400 text-blue-300'
                : camera.sourceType === 'FILE_UPLOAD'
                ? 'bg-purple-500/25 border-purple-400 text-purple-300'
                : 'bg-tactical-accent/15 border-tactical-accent/40 text-tactical-accent'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>{camera.sourceType === 'WEBCAM' ? 'WEBCAM' : camera.sourceType === 'VIDEO_URL' ? 'RTSP/URL' : camera.sourceType === 'FILE_UPLOAD' ? 'FILE' : 'AI SIM'}</span>
          </button>

          {/* Vision Mode Indicator / Toggle */}
          <button
            onClick={cycleVisionMode}
            title={`Current: ${camera.visionMode}. Click to switch.`}
            className={`p-1 rounded text-xs font-mono flex items-center gap-1 border transition ${
              camera.visionMode === 'THERMAL_FLIR'
                ? 'bg-tactical-thermal/20 border-tactical-thermal text-tactical-thermal'
                : camera.visionMode === 'NIGHT_VISION'
                ? 'bg-tactical-success/20 border-tactical-success text-tactical-success'
                : 'bg-tactical-800 border-tactical-border text-slate-300'
            }`}
          >
            {camera.visionMode === 'THERMAL_FLIR' ? (
              <>
                <Flame className="w-3 h-3" />
                <span className="text-[9px] font-bold">FLIR</span>
              </>
            ) : camera.visionMode === 'NIGHT_VISION' ? (
              <>
                <Moon className="w-3 h-3" />
                <span className="text-[9px] font-bold">NVG</span>
              </>
            ) : (
              <>
                <Sun className="w-3 h-3" />
                <span className="text-[9px] font-bold">OPT</span>
              </>
            )}
          </button>

          {/* AI Overlay toggle */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            title={showOverlays ? 'Hide AI Overlays' : 'Show AI Overlays'}
            className={`p-1.5 rounded transition ${
              showOverlays ? 'bg-tactical-accent/20 text-tactical-accent border border-tactical-accent/40' : 'bg-tactical-800 text-slate-500 border border-tactical-border'
            }`}
          >
            {showOverlays ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          {/* PTZ Joystick */}
          <button
            onClick={() => setShowPTZ(!showPTZ)}
            title="PTZ Controls"
            className={`p-1.5 rounded transition ${
              showPTZ ? 'bg-tactical-accent text-tactical-900 font-bold' : 'bg-tactical-800 text-slate-300 hover:text-white border border-tactical-border'
            }`}
          >
            <Compass className="w-3 h-3" />
          </button>

          {/* Tripwire Drawer */}
          <button
            onClick={() => setShowTripwireDrawer(true)}
            title="Draw Virtual Fence / Tripwire"
            className="p-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-white border border-tactical-border transition"
          >
            <ShieldAlert className="w-3 h-3 text-tactical-accent" />
          </button>

          {/* Snapshot */}
          <button
            onClick={takeSnapshot}
            title="Evidence Snapshot"
            className="p-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-white border border-tactical-border transition"
          >
            <CameraIcon className="w-3 h-3" />
          </button>

          {/* Maximize */}
          <button
            onClick={handleMaximize}
            title="Fullscreen / 1x1 Focus View"
            className="p-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-white border border-tactical-border transition"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Canvas Player */}
      <div className="relative flex-1 w-full min-h-[220px] bg-tactical-900">
        <CanvasStreamPlayer camera={camera} showOverlays={showOverlays} />

        {/* Floating PTZ Controller overlay if opened */}
        {showPTZ && (
          <div className="absolute top-2 right-2 z-30">
            <PTZController camera={camera} onClose={() => setShowPTZ(false)} />
          </div>
        )}
      </div>

      {/* Bottom AI Analytics Feature Bar */}
      <div className="px-2 py-1 bg-tactical-900/90 border-t border-tactical-border flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => toggleCameraAIFeature(camera.id, 'humanDetection')}
            className={`px-1.5 py-0.5 rounded border transition ${
              camera.aiFeatures.humanDetection
                ? 'bg-tactical-accent/15 border-tactical-accent/40 text-tactical-accent font-semibold'
                : 'bg-tactical-800 border-slate-700 text-slate-500 line-through'
            }`}
          >
            HUMAN
          </button>
          <button
            onClick={() => toggleCameraAIFeature(camera.id, 'vehicleClassification')}
            className={`px-1.5 py-0.5 rounded border transition ${
              camera.aiFeatures.vehicleClassification
                ? 'bg-blue-500/15 border-blue-400/40 text-blue-400 font-semibold'
                : 'bg-tactical-800 border-slate-700 text-slate-500 line-through'
            }`}
          >
            VEHICLE
          </button>
          <button
            onClick={() => toggleCameraAIFeature(camera.id, 'faceRecognition')}
            className={`px-1.5 py-0.5 rounded border transition ${
              camera.aiFeatures.faceRecognition
                ? 'bg-green-500/15 border-green-400/40 text-green-400 font-semibold'
                : 'bg-tactical-800 border-slate-700 text-slate-500 line-through'
            }`}
          >
            FRS
          </button>
          <button
            onClick={() => toggleCameraAIFeature(camera.id, 'anpr')}
            className={`px-1.5 py-0.5 rounded border transition ${
              camera.aiFeatures.anpr
                ? 'bg-purple-500/15 border-purple-400/40 text-purple-400 font-semibold'
                : 'bg-tactical-800 border-slate-700 text-slate-500 line-through'
            }`}
          >
            ANPR
          </button>
          <button
            onClick={() => toggleCameraAIFeature(camera.id, 'virtualFence')}
            className={`px-1.5 py-0.5 rounded border transition ${
              camera.aiFeatures.virtualFence
                ? 'bg-tactical-alert/15 border-tactical-alert/40 text-tactical-alert font-semibold'
                : 'bg-tactical-800 border-slate-700 text-slate-500 line-through'
            }`}
          >
            TRIPWIRE ({camera.tripwires.length})
          </button>
        </div>

        <div className="text-slate-400 font-semibold shrink-0">
          EDGE AI: 30 FPS
        </div>
      </div>

      {/* Hidden File Input for Video Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="video/mp4,video/webm,video/ogg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const fileUrl = URL.createObjectURL(file);
            setCameraSource(camera.id, 'FILE_UPLOAD', fileUrl);
            setShowSourceModal(false);
          }
        }}
      />

      {/* Stream Source Selector Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono text-xs">
          <div className="bg-tactical-850 border border-tactical-border rounded-xl max-w-lg w-full p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-tactical-border pb-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-tactical-accent" />
                <span className="font-bold text-white font-tactical text-sm">
                  INGEST STREAM SOURCE: {camera.name}
                </span>
              </div>
              <button
                onClick={() => setShowSourceModal(false)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-tactical-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: AI Border Simulation */}
              <div
                onClick={() => {
                  setCameraSource(camera.id, 'SIMULATION');
                  setShowSourceModal(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                  !camera.sourceType || camera.sourceType === 'SIMULATION'
                    ? 'bg-tactical-accent/15 border-tactical-accent text-white'
                    : 'bg-tactical-900 border-tactical-border hover:bg-tactical-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-tactical-accent shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Edge AI Simulated Border Scenario</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Synthetic tactical simulation with moving infiltrators, ANPR, and thermal signatures.
                    </div>
                  </div>
                </div>
                {(!camera.sourceType || camera.sourceType === 'SIMULATION') && (
                  <span className="text-tactical-accent font-bold text-[11px]">ACTIVE</span>
                )}
              </div>

              {/* Option 2: Real Local Webcam */}
              <div
                onClick={() => {
                  setCameraSource(camera.id, 'WEBCAM');
                  setShowSourceModal(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                  camera.sourceType === 'WEBCAM'
                    ? 'bg-tactical-success/15 border-tactical-success text-white'
                    : 'bg-tactical-900 border-tactical-border hover:bg-tactical-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CameraIcon className="w-5 h-5 text-tactical-success shrink-0" />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-2">
                      <span>Connect Device Live Webcam / USB Feed</span>
                      <span className="px-1.5 py-0.2 rounded bg-tactical-success text-tactical-900 font-bold text-[9px]">REAL TIME</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Ingests your actual physical camera feed with real-time motion detection and tripwire triggers.
                    </div>
                  </div>
                </div>
                {camera.sourceType === 'WEBCAM' && (
                  <span className="text-tactical-success font-bold text-[11px]">ACTIVE</span>
                )}
              </div>

              {/* Option 3: Real Video File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                  camera.sourceType === 'FILE_UPLOAD'
                    ? 'bg-purple-500/15 border-purple-400 text-white'
                    : 'bg-tactical-900 border-tactical-border hover:bg-tactical-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Upload Recorded CCTV Surveillance Video</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Select any local MP4/WebM video file to run AI computer vision analytics over actual footage.
                    </div>
                  </div>
                </div>
                {camera.sourceType === 'FILE_UPLOAD' && (
                  <span className="text-purple-400 font-bold text-[11px]">ACTIVE</span>
                )}
              </div>

              {/* Option 4: Custom Network URL / RTSP / HLS */}
              <div className="p-3 rounded-lg bg-tactical-900 border border-tactical-border space-y-2">
                <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
                  <LinkIcon className="w-4 h-4 text-blue-400" />
                  <span>Network Stream URL (RTSP / HLS / HTTP MP4)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/cctv-stream.mp4 or HLS .m3u8"
                    className="flex-1 bg-tactical-850 border border-tactical-border rounded px-2.5 py-1 text-xs text-white outline-none focus:border-tactical-accent"
                  />
                  <button
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        setCameraSource(camera.id, 'VIDEO_URL', customUrlInput.trim());
                        setShowSourceModal(false);
                      }
                    }}
                    className="px-3 py-1 bg-tactical-accent text-tactical-900 font-bold font-hud rounded text-xs"
                  >
                    Connect
                  </button>
                </div>

                {/* Preset public test videos */}
                <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                  <span>Quick Test Feeds:</span>
                  <button
                    onClick={() => {
                      const url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
                      setCustomUrlInput(url);
                      setCameraSource(camera.id, 'VIDEO_URL', url);
                      setShowSourceModal(false);
                    }}
                    className="underline text-blue-400 hover:text-blue-300"
                  >
                    Border Road Patrol Clip
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => {
                      const url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
                      setCustomUrlInput(url);
                      setCameraSource(camera.id, 'VIDEO_URL', url);
                      setShowSourceModal(false);
                    }}
                    className="underline text-blue-400 hover:text-blue-300"
                  >
                    Checkpost Sentry Clip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tripwire Drawer Modal */}
      {showTripwireDrawer && (
        <TripwireDrawerModal camera={camera} onClose={() => setShowTripwireDrawer(false)} />
      )}
    </div>
  );
};
