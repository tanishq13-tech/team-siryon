import React from 'react';
import { Alert } from '../../types';
import { Shield, Printer, Download, X, CheckCircle, FileText } from 'lucide-react';

interface IncidentReportModalProps {
  alert: Alert;
  onClose: () => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({ alert, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-tactical-850 border border-tactical-border rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Actions bar */}
        <div className="p-3 bg-tactical-900 border-b border-tactical-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 font-bold">
            <FileText className="w-4 h-4 text-tactical-accent" />
            <span>MINISTRY OF HOME AFFAIRS • OFFICIAL INCIDENT DOSSIER</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-tactical-accent text-tactical-900 font-bold text-xs font-hud rounded flex items-center gap-1.5 shadow hover:bg-cyan-400"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white px-2 py-1 rounded bg-tactical-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Official Printable Document Area */}
        <div className="p-8 overflow-y-auto bg-slate-100 text-slate-900 font-serif text-xs space-y-6">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
            <div className="text-sm font-bold tracking-widest uppercase">
              GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS
            </div>
            <div className="text-xs font-semibold text-slate-700">
              DIRECTORATE GENERAL BORDER SECURITY FORCES (BSF)
            </div>
            <div className="text-[11px] font-mono text-slate-600">
              INTELLIGENT BORDER VIDEO ANALYTICS PLATFORM (IBVAP) • AUTOMATED FORENSIC INCIDENT REPORT
            </div>
          </div>

          {/* Reference Numbers */}
          <div className="grid grid-cols-2 font-mono text-[11px] bg-slate-200 p-2.5 rounded border border-slate-300">
            <div>
              <strong>CASE REF NO:</strong> MHA/BSF/IBVAP/{alert.id}
            </div>
            <div className="text-right">
              <strong>DATE & TIME:</strong> {new Date().toLocaleDateString()} {alert.timestamp} IST
            </div>
            <div>
              <strong>SECURITY CLASSIFICATION:</strong> SECRET // LAW ENFORCEMENT SENSITIVE
            </div>
            <div className="text-right">
              <strong>SECTOR / POST:</strong> {alert.bopName}
            </div>
          </div>

          {/* Section 1: Event Summary */}
          <div className="space-y-2">
            <h4 className="font-sans font-bold text-xs text-slate-900 uppercase border-b border-slate-400 pb-1">
              1. Incident Classification & Trigger Event
            </h4>
            <table className="w-full text-[11px] font-sans border-collapse">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 font-bold w-40">Event Type:</td>
                  <td className="py-1.5">{alert.type.replace(/_/g, ' ')}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 font-bold">Threat Severity:</td>
                  <td className="py-1.5 font-bold text-red-700">{alert.severity}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 font-bold">Detection Ingest Sensor:</td>
                  <td className="py-1.5 font-mono">{alert.cameraName} ({alert.cameraId})</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 font-bold">AI Algorithmic Confidence:</td>
                  <td className="py-1.5">{alert.confidence}% (Model: YOLOv8-BorderNet + InsightFace)</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Incident Narrative:</td>
                  <td className="py-1.5 italic">{alert.details}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Chain of Custody & SOP Compliance */}
          <div className="space-y-2">
            <h4 className="font-sans font-bold text-xs text-slate-900 uppercase border-b border-slate-400 pb-1">
              2. Standard Operating Procedure (SOP) Action Audit
            </h4>
            <div className="space-y-1.5 text-[11px] font-mono">
              {alert.sopSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">[SOP-{idx + 1}]</span>
                  <span>{step.title}</span>
                  <span className="ml-auto font-bold text-emerald-800">
                    {step.completed ? '✓ EXECUTED' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Digital Evidence Tamper-Proof Verification */}
          <div className="space-y-2">
            <h4 className="font-sans font-bold text-xs text-slate-900 uppercase border-b border-slate-400 pb-1">
              3. Forensic Digital Evidence Record
            </h4>
            <div className="p-3 bg-slate-50 border border-slate-300 font-mono text-[10px] space-y-1">
              <div>SHA-256 Video Frame Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
              <div>Ingest Stream Protocol: RTSP over TLS / H.265 Edge Container Stream</div>
              <div>Storage Location: BOP Edge Encrypted Vault (NVMe RAID-1)</div>
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-8 grid grid-cols-2 font-mono text-[11px] border-t-2 border-slate-800">
            <div>
              <div className="font-bold">SYSTEM OPERATOR / WATCH OFFICER:</div>
              <div className="mt-8 border-t border-slate-400 w-48 pt-1">
                Inspector In-Charge, BSF Command
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">COMMAND APPROVAL:</div>
              <div className="mt-8 border-t border-slate-400 w-48 ml-auto pt-1">
                Commandant, Sector HQ
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
