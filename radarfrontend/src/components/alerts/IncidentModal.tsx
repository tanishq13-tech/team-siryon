import React, { useState } from 'react';
import { Alert } from '../../types';
import { useSurveillance } from '../../context/SurveillanceContext';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Circle, 
  Send, 
  Volume2, 
  ShieldCheck, 
  Clock, 
  Camera as CameraIcon, 
  X 
} from 'lucide-react';

interface IncidentModalProps {
  alert: Alert;
  onClose: () => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({ alert, onClose }) => {
  const { 
    qrtUnits, 
    completeSopStep, 
    dispatchQRT, 
    triggerManualAlarm, 
    acknowledgeAlert, 
    resolveAlert 
  } = useSurveillance();

  const [selectedQrt, setSelectedQrt] = useState<string>(qrtUnits[0]?.id || '');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [isDispatched, setIsDispatched] = useState<boolean>(false);

  const handleStepToggle = (index: number) => {
    completeSopStep(alert.id, index);
  };

  const handleSoundSiren = () => {
    triggerManualAlarm(alert.bopId);
    completeSopStep(alert.id, 1);
  };

  const handleDispatch = () => {
    if (selectedQrt) {
      dispatchQRT(alert.id, selectedQrt);
      setIsDispatched(true);
    }
  };

  const handleResolve = () => {
    resolveAlert(alert.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-tactical-850 border border-tactical-border rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-tactical-900 border-b border-tactical-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-tactical-alert/20 border border-tactical-alert flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-tactical-alert animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-tactical-alert text-white font-bold">
                  {alert.severity}
                </span>
                <span className="text-xs font-mono text-slate-400">INCIDENT ID: {alert.id}</span>
              </div>
              <h2 className="text-base font-bold font-tactical text-white mt-0.5">
                {alert.type.replace(/_/g, ' ')} • {alert.bopName}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 rounded bg-tactical-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column: Evidence & Metadata */}
          <div className="space-y-4">
            <div className="aspect-video bg-tactical-900 rounded-lg border border-tactical-border relative overflow-hidden flex items-center justify-center">
              {/* Simulated snapshot */}
              <div className="text-center p-4">
                <CameraIcon className="w-8 h-8 text-tactical-accent mx-auto mb-2 opacity-80" />
                <div className="text-xs font-hud text-slate-300 font-semibold">
                  SURVEILLANCE EVIDENCE FRAME CAPTURED
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  Source: {alert.cameraName} ({alert.cameraId})
                </div>
                <div className="text-[10px] font-mono text-tactical-success mt-1">
                  AI Confidence: {alert.confidence}%
                </div>
              </div>
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[10px] font-mono text-tactical-alert border border-tactical-alert/40">
                LIVE CAPTURE: {alert.timestamp} IST
              </div>
            </div>

            {/* Metadata Card */}
            <div className="bg-tactical-900 p-3.5 rounded-lg border border-tactical-border text-xs font-mono space-y-2">
              <div className="text-slate-400 font-semibold border-b border-tactical-border/60 pb-1 text-[11px]">
                EVENT METRICS & TELEMETRY
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block">Border Out Post:</span>
                  <span className="font-semibold text-white">{alert.bopName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Detection Sensor:</span>
                  <span className="font-semibold text-white">{alert.cameraId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Timestamp:</span>
                  <span className="text-slate-200">{alert.timestamp} IST</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status:</span>
                  <span className={`font-bold ${alert.status === 'ACTIVE' ? 'text-tactical-alert' : 'text-tactical-success'}`}>
                    {alert.status}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-slate-300 bg-tactical-850 p-2 rounded border border-tactical-border/60">
                <span className="text-slate-500 block text-[10px]">ANALYSIS DESCRIPTION:</span>
                {alert.details}
              </div>
            </div>
          </div>

          {/* Right Column: Standard Operating Procedure (SOP) Action Checklist */}
          <div className="space-y-4">
            <div className="bg-tactical-900 p-4 rounded-lg border border-tactical-border space-y-3">
              <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-tactical-accent" />
                  <span className="text-xs font-bold font-hud text-tactical-accent">
                    MHA STANDARD OPERATING PROCEDURE (SOP)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">MANDATORY PROTOCOL</span>
              </div>

              {/* Step Checklist */}
              <div className="space-y-2.5">
                {alert.sopSteps.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleStepToggle(idx)}
                    className={`p-2.5 rounded border flex items-center justify-between cursor-pointer transition ${
                      step.completed
                        ? 'bg-tactical-success/10 border-tactical-success/40 text-slate-200'
                        : 'bg-tactical-850 border-tactical-border text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs font-mono">
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-tactical-success shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className={step.completed ? 'line-through text-slate-400' : 'text-slate-200'}>
                        {step.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Tactical Actions */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={handleSoundSiren}
                  className="py-2 px-3 bg-tactical-alert/20 hover:bg-tactical-alert/30 text-tactical-alert border border-tactical-alert/50 rounded text-xs font-mono font-bold flex items-center justify-center gap-2 transition"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Trigger Klaxon</span>
                </button>

                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  disabled={alert.status !== 'ACTIVE'}
                  className="py-2 px-3 bg-tactical-800 hover:bg-tactical-700 disabled:opacity-40 text-slate-200 border border-tactical-border rounded text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <span>Acknowledge</span>
                </button>
              </div>
            </div>

            {/* Quick Reaction Team Dispatch Selector */}
            <div className="bg-tactical-900 p-4 rounded-lg border border-tactical-border space-y-2.5">
              <div className="text-xs font-bold font-mono text-slate-300">
                DISPATCH QUICK REACTION TEAM (QRT)
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedQrt}
                  onChange={(e) => setSelectedQrt(e.target.value)}
                  className="flex-1 bg-tactical-850 border border-tactical-border rounded px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
                >
                  {qrtUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.callsign} ({u.vehicleType} • {u.strength} Troops)
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleDispatch}
                  disabled={isDispatched}
                  className="px-4 py-1.5 bg-tactical-accent hover:bg-cyan-400 text-tactical-900 font-bold text-xs font-hud rounded flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatched ? 'Dispatched' : 'Dispatch'}</span>
                </button>
              </div>
              {isDispatched && (
                <div className="text-[10px] font-mono text-tactical-success flex items-center gap-1">
                  ✓ QRT unit alerted via tactical RF radio. ETA to incident coordinates: 3.5 minutes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-tactical-900 border-t border-tactical-border flex items-center justify-between">
          <div className="text-xs font-mono text-slate-500">
            Authenticated Officer: Inspector In-Charge (BSF Command)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-tactical-800 text-slate-300 hover:text-white text-xs font-mono"
            >
              Close
            </button>
            <button
              onClick={handleResolve}
              className="px-5 py-2 rounded bg-tactical-success hover:bg-green-500 text-tactical-900 font-bold text-xs font-hud flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolve & Close Incident</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
