import React from 'react';
import { useSurveillance } from '../../context/SurveillanceContext';
import { Network, Server, Video, ShieldCheck, ArrowRight, Zap, CheckCircle, TrendingDown } from 'lucide-react';

export const SystemTopology: React.FC = () => {
  const { metrics, cameras, bops } = useSurveillance();

  return (
    <div className="flex-1 flex flex-col p-5 bg-tactical-900 overflow-y-auto font-mono text-xs text-slate-300 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold font-tactical text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-tactical-accent" />
          <span>EDGE-TO-COMMAND SYSTEM ARCHITECTURE & BANDWIDTH TOPOLOGY</span>
        </h2>
        <p className="text-slate-400 text-xs">
          Demonstrating software-defined intelligence over legacy COTS IP CCTV infrastructure without costly specialized hardware.
        </p>
      </div>

      {/* Cost-Benefit & Hardware Elimination Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-tactical-850 border border-tactical-accent/40 space-y-2">
          <div className="flex items-center gap-2 text-tactical-accent font-bold font-hud">
            <Zap className="w-4 h-4" />
            <span>Zero Proprietary Hardware</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Eliminates high-cost proprietary FRS/ANPR smart cameras. Ingests standard H.264/H.265 RTSP streams from any existing legacy CCTV camera.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-tactical-850 border border-tactical-success/40 space-y-2">
          <div className="flex items-center gap-2 text-tactical-success font-bold font-hud">
            <TrendingDown className="w-4 h-4" />
            <span>84.5% CapEx Cost Reduction</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Deployment cost dropped from ~₹1.8 Cr per sector (dedicated FRS hardware) to ₹28 Lakhs using software-defined edge AI micro-servers.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-tactical-850 border border-tactical-warning/40 space-y-2">
          <div className="flex items-center gap-2 text-tactical-warning font-bold font-hud">
            <ShieldCheck className="w-4 h-4" />
            <span>Remote Outpost Resiliency</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Full offline edge inference autonomy: if satellite/RF uplink drops, BOP continues full AI detection and local siren alert dispatch.
          </p>
        </div>
      </div>

      {/* Visual Pipeline Diagram */}
      <div className="bg-tactical-850 border border-tactical-border rounded-xl p-6 shadow-xl space-y-6">
        <div className="text-xs font-bold font-hud text-slate-400 uppercase tracking-wider">
          LIVE DATAFLOW: LEGACY CAMERA → EDGE AI INFERENCE → SECTOR COMMAND
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Layer 1: Ingest */}
          <div className="bg-tactical-900 border border-tactical-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-tactical text-tactical-accent">LAYER 1: COTS SENSORS</span>
              <Video className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-tactical-success" />
                <span>Existing Standard IP CCTVs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-tactical-success" />
                <span>Thermal FLIR & Low-Light</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-tactical-success" />
                <span>Checkpost Barrier Fixed Cams</span>
              </div>
            </div>
            <div className="p-2 bg-tactical-850 rounded text-[10px] text-slate-400 font-mono">
              Bandwidth: Raw RTSP Stream (Local BOP LAN Only)
            </div>
          </div>

          {/* Layer 2: Edge AI */}
          <div className="bg-tactical-900 border border-tactical-accent/60 rounded-lg p-4 space-y-3 relative shadow-lg shadow-cyan-950/40">
            <div className="absolute -top-2.5 right-3 bg-tactical-accent text-tactical-900 font-bold px-2 py-0.5 rounded text-[9px] font-hud">
              CORE INNOVATION
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-tactical text-tactical-accent">LAYER 2: BOP EDGE AI</span>
              <Server className="w-4 h-4 text-tactical-accent" />
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div>• YOLOv8 Perimeter Tracking</div>
              <div>• InsightFace Biometric FRS</div>
              <div>• Fast-ANPR Optical Engine</div>
              <div>• Virtual Tripwire Direction Logic</div>
            </div>
            <div className="p-2 bg-tactical-850 rounded text-[10px] text-tactical-success font-mono">
              Inference: {metrics.fpsThroughput} FPS | Latency: 42ms
            </div>
          </div>

          {/* Layer 3: Tactical Link */}
          <div className="bg-tactical-900 border border-tactical-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-tactical text-tactical-warning">LAYER 3: LOW-BW LINK</span>
              <Network className="w-4 h-4 text-tactical-warning" />
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div>• Tactical RF Mesh / VSAT Link</div>
              <div>• JSON Alert Telemetry Only</div>
              <div>• Cropped Target Evidence Frames</div>
              <div>• Zero Video Streaming Bottleneck</div>
            </div>
            <div className="p-2 bg-tactical-850 rounded text-[10px] text-amber-400 font-mono">
              Uplink Rate: {metrics.bandwidthUsageKbps} Kbps Total
            </div>
          </div>

          {/* Layer 4: Command HQ */}
          <div className="bg-tactical-900 border border-tactical-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-tactical text-tactical-accent">LAYER 4: IBVAP HQ HUD</span>
              <ShieldCheck className="w-4 h-4 text-tactical-accent" />
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div>• Central Command Dashboard</div>
              <div>• Multi-BOP Threat Aggregator</div>
              <div>• Quick Reaction Team Dispatch</div>
              <div>• National FRS/ANPR Database Sync</div>
            </div>
            <div className="p-2 bg-tactical-850 rounded text-[10px] text-slate-400 font-mono">
              Sector: Alpha-Delta Command
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Summary Table */}
      <div className="bg-tactical-850 border border-tactical-border rounded-xl p-4 shadow-lg space-y-3">
        <div className="text-xs font-bold font-hud text-slate-300">
          BORDER OUT POST DEPLOYMENT SUMMARY
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {bops.map((bop) => (
            <div key={bop.id} className="p-3 bg-tactical-900 rounded-lg border border-tactical-border/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold font-tactical">{bop.name}</span>
                <span className="text-[10px] text-tactical-success font-bold font-mono">{bop.networkStatus}</span>
              </div>
              <div className="text-slate-400 text-[11px]">{bop.sector}</div>
              <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
                <span>{bop.cameraCount} Ingest Streams</span>
                <span className="text-tactical-accent font-bold">{bop.personnelStrength} Troops</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
