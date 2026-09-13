import React, { useState } from 'react';
import { useSurveillance } from '../../context/SurveillanceContext';
import { Alert } from '../../types';
import { IncidentReportModal } from './IncidentReportModal';
import { FileSearch, Download, Printer, Search, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export const ForensicsSearch: React.FC = () => {
  const { alerts } = useSurveillance();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBop, setSelectedBop] = useState<string>('ALL');
  const [reportModalAlert, setReportModalAlert] = useState<Alert | null>(null);

  const filtered = alerts.filter((alt) => {
    const matchesSearch =
      alt.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alt.cameraName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alt.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBop = selectedBop === 'ALL' || alt.bopId === selectedBop;
    return matchesSearch && matchesBop;
  });

  const exportCSV = () => {
    const headers = 'Incident ID,Timestamp,Type,Severity,BOP,Camera,Confidence,Status,Details\n';
    const rows = filtered
      .map(
        (a) =>
          `"${a.id}","${a.timestamp}","${a.type}","${a.severity}","${a.bopName}","${a.cameraName}","${a.confidence}%","${a.status}","${a.details.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IBVAP_Forensic_Export_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-tactical-900 overflow-hidden font-mono text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold font-tactical text-white flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-tactical-accent" />
            <span>INCIDENT FORENSICS, AUDIT LOGS & REPORT GENERATOR</span>
          </h2>
          <p className="text-slate-400 text-xs">
            Tamper-proof event logs, chain-of-custody verification, and court-admissible security dossiers.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-3.5 py-1.5 bg-tactical-800 hover:bg-tactical-700 text-slate-200 border border-tactical-border font-bold font-hud rounded flex items-center gap-1.5 shadow transition"
        >
          <Download className="w-4 h-4 text-tactical-accent" />
          <span>Export CSV Audit Log</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-tactical-850 border border-tactical-border p-3 rounded-lg mb-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search forensic incidents by keyword, suspect, license plate, camera ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none focus:border-tactical-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">OUTPOST:</span>
          <select
            value={selectedBop}
            onChange={(e) => setSelectedBop(e.target.value)}
            className="bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value="ALL">ALL BORDER OUT POSTS</option>
            <option value="bop-trishul">BOP Trishul</option>
            <option value="bop-cheetah">BOP Cheetah</option>
            <option value="bop-vajra">BOP Vajra</option>
            <option value="bop-ranbhir">BOP Ranbhir</option>
          </select>
        </div>
      </div>

      {/* Forensic Log Table */}
      <div className="flex-1 bg-tactical-850 border border-tactical-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-2.5 bg-tactical-900 border-b border-tactical-border grid grid-cols-12 text-slate-400 font-semibold text-[11px]">
          <div className="col-span-2">REF ID / TIME</div>
          <div className="col-span-2">EVENT TYPE</div>
          <div className="col-span-2">BOP / SENSOR</div>
          <div className="col-span-4">INCIDENT NARRATIVE</div>
          <div className="col-span-1">STATUS</div>
          <div className="col-span-1 text-right">DOSSIER</div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-tactical-border/60">
          {filtered.map((alt) => (
            <div
              key={alt.id}
              className="p-3 grid grid-cols-12 items-center text-xs hover:bg-tactical-800/40 transition"
            >
              <div className="col-span-2">
                <div className="font-bold text-white font-mono">{alt.id}</div>
                <div className="text-[10px] text-slate-500">{alt.timestamp} IST</div>
              </div>

              <div className="col-span-2">
                <div className="text-slate-200 font-semibold">{alt.type.replace(/_/g, ' ')}</div>
                <div className="text-[10px] text-tactical-accent">Confidence: {alt.confidence}%</div>
              </div>

              <div className="col-span-2">
                <div className="text-white">{alt.bopName}</div>
                <div className="text-[10px] text-slate-500">{alt.cameraName}</div>
              </div>

              <div className="col-span-4 text-slate-300 pr-2 truncate">
                {alt.details}
              </div>

              <div className="col-span-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  alt.status === 'ACTIVE'
                    ? 'bg-tactical-alert/20 text-tactical-alert'
                    : 'bg-tactical-success/20 text-tactical-success'
                }`}>
                  {alt.status}
                </span>
              </div>

              <div className="col-span-1 text-right">
                <button
                  onClick={() => setReportModalAlert(alt)}
                  className="px-2.5 py-1 bg-tactical-accent hover:bg-cyan-400 text-tactical-900 font-bold rounded text-[10px] font-hud flex items-center gap-1 ml-auto"
                >
                  <FileText className="w-3 h-3" />
                  <span>Dossier</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dossier Modal */}
      {reportModalAlert && (
        <IncidentReportModal
          alert={reportModalAlert}
          onClose={() => setReportModalAlert(null)}
        />
      )}
    </div>
  );
};
