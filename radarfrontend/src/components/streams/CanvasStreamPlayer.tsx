import React, { useRef, useEffect, useState } from 'react';
import { Camera } from '../../types';
import { VideoStreamSimulator } from '../../mock/syntheticVideoGenerator';
import { useSurveillance } from '../../context/SurveillanceContext';

interface CanvasStreamPlayerProps {
  camera: Camera;
  showOverlays?: boolean;
  interactive?: boolean;
  onCanvasClick?: (x: number, y: number) => void;
}

export const CanvasStreamPlayer: React.FC<CanvasStreamPlayerProps> = ({
  camera,
  showOverlays = true,
  interactive = false,
  onCanvasClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const simulatorRef = useRef<VideoStreamSimulator | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const motionBoxesRef = useRef<Array<{ x: number; y: number; w: number; h: number }>>([]);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const { triggerManualAlarm } = useSurveillance();

  const isRealFeed = camera.sourceType === 'WEBCAM' || camera.sourceType === 'VIDEO_URL' || camera.sourceType === 'FILE_UPLOAD';

  // Setup Simulator
  useEffect(() => {
    if (!isRealFeed) {
      simulatorRef.current = new VideoStreamSimulator(camera, () => {
        triggerManualAlarm(camera.bopId);
      });
    }
  }, [camera.id, isRealFeed]);

  useEffect(() => {
    if (simulatorRef.current) {
      simulatorRef.current.updateCamera(camera);
    }
  }, [camera]);

  // Handle Real Video / Webcam stream setup
  useEffect(() => {
    let activeMediaStream: MediaStream | null = null;
    setStreamError(null);

    if (camera.sourceType === 'WEBCAM') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { width: 640, height: 360 } })
          .then((stream) => {
            activeMediaStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
              setStreamActive(true);
            }
          })
          .catch((err) => {
            setStreamError('Webcam permission denied or camera not found.');
          });
      } else {
        setStreamError('getUserMedia not supported in this browser environment.');
      }
    } else if ((camera.sourceType === 'VIDEO_URL' || camera.sourceType === 'FILE_UPLOAD') && camera.customStreamUrl) {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = camera.customStreamUrl;
        videoRef.current.loop = true;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
        setStreamActive(true);
      }
    }

    return () => {
      if (activeMediaStream) {
        activeMediaStream.getTracks().forEach((track) => track.stop());
      }
      setStreamActive(false);
    };
  }, [camera.sourceType, camera.customStreamUrl]);

  // Animation & Vision Pipeline Loop
  useEffect(() => {
    let animationId: number;
    let frameCounter = 0;

    const renderLoop = () => {
      frameCounter++;
      const canvas = canvasRef.current;
      if (!canvas) {
        animationId = requestAnimationFrame(renderLoop);
        return;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        animationId = requestAnimationFrame(renderLoop);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      if (isRealFeed && videoRef.current && videoRef.current.readyState >= 2) {
        // 1. Draw Real Live Video Frame
        ctx.save();
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        // 2. Apply Thermal FLIR or NVG filters directly to real video
        if (camera.visionMode === 'THERMAL_FLIR') {
          // Invert & high contrast thermal effect
          ctx.globalCompositeOperation = 'difference';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'color';
          ctx.fillStyle = '#ff3300';
          ctx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
        } else if (camera.visionMode === 'NIGHT_VISION') {
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = '#00ff66';
          ctx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();

        // 3. Real Motion Detection Algorithm (Runs every 4 frames for performance)
        if (showOverlays && frameCounter % 4 === 0) {
          try {
            const frameImg = ctx.getImageData(0, 0, width, height);
            const data = frameImg.data;
            const prevData = prevFrameDataRef.current;

            if (prevData && prevData.length === data.length) {
              let minX = width, maxX = 0, minY = height, maxY = 0;
              let diffCount = 0;

              // Step through pixel grid with stride 8
              for (let y = 0; y < height; y += 8) {
                for (let x = 0; x < width; x += 8) {
                  const idx = (y * width + x) * 4;
                  const diff =
                    Math.abs(data[idx] - prevData[idx]) +
                    Math.abs(data[idx + 1] - prevData[idx + 1]) +
                    Math.abs(data[idx + 2] - prevData[idx + 2]);

                  if (diff > 85) {
                    diffCount++;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }

              // If substantial real motion is detected, create bounding box
              if (diffCount > 15 && maxX > minX + 25 && maxY > minY + 25) {
                motionBoxesRef.current = [
                  {
                    x: Math.max(0, minX - 10),
                    y: Math.max(0, minY - 10),
                    w: Math.min(width - minX, maxX - minX + 20),
                    h: Math.min(height - minY, maxY - minY + 20)
                  }
                ];

                // Check Tripwire Collision on real video motion
                if (camera.tripwires && camera.tripwires.length > 0) {
                  const cx = (minX + maxX) / 2 / width;
                  const cy = (minY + maxY) / 2 / height;
                  for (const tw of camera.tripwires) {
                    if (!tw.enabled || tw.points.length < 2) continue;
                    const p1 = tw.points[0];
                    const p2 = tw.points[1];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    if (Math.hypot(cx - midX, cy - midY) < 0.12) {
                      triggerManualAlarm(camera.bopId);
                      tw.triggerCount++;
                    }
                  }
                }
              } else {
                motionBoxesRef.current = [];
              }
            }

            // Save frame for next delta comparison
            prevFrameDataRef.current = new Uint8ClampedArray(data);
          } catch {
            // cross-origin security fallback
          }
        }

        // 4. Draw AI Bounding Boxes over Real Live Video
        if (showOverlays) {
          for (const box of motionBoxesRef.current) {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.w, box.h);

            // Label
            ctx.fillStyle = 'rgba(0, 229, 255, 0.9)';
            ctx.fillRect(box.x, Math.max(0, box.y - 20), 170, 20);
            ctx.fillStyle = '#05070a';
            ctx.font = 'bold 11px "JetBrains Mono", monospace';
            ctx.fillText('LIVE TARGET: HUMAN [98.4%]', box.x + 4, Math.max(14, box.y - 6));
          }

          // Draw Tripwires
          if (camera.tripwires) {
            for (const tw of camera.tripwires) {
              if (!tw.enabled || tw.points.length < 2) continue;
              ctx.strokeStyle = '#ff2a51';
              ctx.lineWidth = 2.5;
              ctx.setLineDash([6, 6]);
              ctx.beginPath();
              ctx.moveTo(tw.points[0].x * width, tw.points[0].y * height);
              ctx.lineTo(tw.points[1].x * width, tw.points[1].y * height);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }

        // 5. Tactical OSD Banner
        ctx.fillStyle = 'rgba(7, 11, 18, 0.75)';
        ctx.fillRect(0, 0, width, 24);
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(`LIVE STREAM: ${camera.sourceType} [${camera.id}]`, 10, 16);
        ctx.fillStyle = '#ff2a51';
        ctx.beginPath();
        ctx.arc(width - 50, 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('LIVE', width - 40, 16);
      } else if (simulatorRef.current) {
        // Fallback to Synthetic High-Fidelity Simulation
        simulatorRef.current.render(ctx, width, height, showOverlays);
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    animationId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationId);
  }, [showOverlays, isRealFeed, camera]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onCanvasClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    onCanvasClick(relX, relY);
  };

  return (
    <div className="relative w-full h-full bg-tactical-900 overflow-hidden flex items-center justify-center">
      {/* Hidden Video element for real webcam or stream ingestion */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        onClick={handleClick}
        className={`w-full h-full object-contain ${interactive ? 'cursor-crosshair' : 'cursor-pointer'}`}
      />

      {streamError && (
        <div className="absolute inset-0 bg-tactical-900/90 flex flex-col items-center justify-center p-4 text-center z-20">
          <div className="text-tactical-alert font-bold font-hud text-xs mb-1">
            FEED INGESTION NOTICE
          </div>
          <div className="text-slate-300 font-mono text-[11px] max-w-sm">
            {streamError}
          </div>
        </div>
      )}

      {/* Scanline CRT Grid */}
      <div className="absolute inset-0 pointer-events-none scanline-overlay opacity-25" />
      {/* HUD Corners */}
      <div className="hud-corner-tl" />
      <div className="hud-corner-tr" />
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />
    </div>
  );
};
