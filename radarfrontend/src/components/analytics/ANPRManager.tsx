import React, { useState } from 'react';
import { useSurveillance } from '../../context/SurveillanceContext';
import { ANPRRecord } from '../../types';
import { Car, Search, Plus, ShieldAlert, CheckCircle, AlertOctagon, Gauge } from 'lucide-react';

export const ANPRManager: React.FC = () => {
  const { anprList, addANPRRecord } = useSurveillance();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New record form state
  const [newPlate, setNewPlate] = useState<string>('');
  const [newOwner, setNewOwner] = useState<string>('');
  const [newVehicleType, setNewVehicleType] = useState<string>('Mahindra Bolero Pickup');
  const [newStatus, setNewStatus] = useState<ANPRRecord['registrationStatus']>('WANTED');
  const [newState, setNewState] = useState<string>('Jammu & Kashmir');

  const filtered = anprList.filter((rec) => {
    const matchesSearch =
      rec.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.vehicleType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || rec.registrationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    addANPRRecord({
      plateNumber: newPlate.toUpperCase().trim(),
      ownerName: newOwner.trim() || 'Unknown Subject',
      vehicleType: newVehicleType,
      color: 'Standard',
      registrationStatus: newStatus,
      state: newState,
      lastSeenCamera: 'CAM-CH-01',
      bopName: 'BOP Cheetah Checkpost',
      speedKmh: 42,
      confidence: 96.5
    });
    setNewPlate('');
    setNewOwner('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-tactical-900 overflow-hidden font-mono text-xs">
      {/* Top Header & Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold font-tactical text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-tactical-accent" />
            <span>AUTOMATIC NUMBER PLATE RECOGNITION (ANPR) INTELLIGENCE</span>
          </h2>
          <p className="text-slate-400 text-xs">
            Software-defined high-speed OCR pipeline operating on standard COTS checkpost IP cameras.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-tactical-accent hover:bg-cyan-400 text-tactical-900 font-bold font-hud rounded flex items-center gap-1.5 shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plate to Watchlist</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-tactical-850 border border-tactical-border p-3 rounded-lg mb-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search license plate (e.g. JK-02-AZ-8841), vehicle or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none focus:border-tactical-accent"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">STATUS:</span>
          {['ALL', 'WANTED', 'SUSPICIOUS', 'AUTHORIZED', 'CIVILIAN_PASS'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                statusFilter === st
                  ? 'bg-tactical-accent text-tactical-900 font-bold'
                  : 'bg-tactical-800 text-slate-300 hover:text-white border border-tactical-border'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ANPR Records Table */}
      <div className="flex-1 bg-tactical-850 border border-tactical-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-2.5 bg-tactical-900 border-b border-tactical-border grid grid-cols-12 text-slate-400 font-semibold text-[11px]">
          <div className="col-span-3">LICENSE PLATE / OCR</div>
          <div className="col-span-3">VEHICLE CLASSIFICATION</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-2">LOCATION / CAMERA</div>
          <div className="col-span-1">SPEED</div>
          <div className="col-span-1 text-right">CONFIDENCE</div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-tactical-border/60">
          {filtered.map((rec) => {
            const isWanted = rec.registrationStatus === 'WANTED';
            const isSuspicious = rec.registrationStatus === 'SUSPICIOUS';
            const isAuthorized = rec.registrationStatus === 'AUTHORIZED';

            return (
              <div
                key={rec.id}
                className={`p-3 grid grid-cols-12 items-center text-xs transition ${
                  isWanted
                    ? 'bg-tactical-alert/10 hover:bg-tactical-alert/15'
                    : isSuspicious
                    ? 'bg-tactical-warning/10 hover:bg-tactical-warning/15'
                    : 'hover:bg-tactical-800/50'
                }`}
              >
                {/* Plate Badge */}
                <div className="col-span-3 flex items-center gap-2.5">
                  <div className={`px-2.5 py-1 rounded border font-mono font-bold text-xs tracking-wider ${
                    isWanted
                      ? 'bg-tactical-alert text-white border-red-400'
                      : isSuspicious
                      ? 'bg-tactical-warning text-tactical-900 border-amber-300'
                      : isAuthorized
                      ? 'bg-tactical-success/20 text-tactical-success border-tactical-success/50'
                      : 'bg-tactical-900 text-white border-slate-600'
                  }`}>
                    {rec.plateNumber}
                  </div>
                  <span className="text-slate-400 text-[10px]">{rec.timestamp}</span>
                </div>

                {/* Vehicle */}
                <div className="col-span-3 text-slate-300">
                  <div className="font-semibold text-white">{rec.vehicleType}</div>
                  <div className="text-[10px] text-slate-400">Reg: {rec.ownerName} ({rec.state})</div>
                </div>

                {/* Status Badge */}
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                    isWanted
                      ? 'bg-tactical-alert/20 text-tactical-alert border border-tactical-alert/40'
                      : isSuspicious
                      ? 'bg-tactical-warning/20 text-tactical-warning border border-tactical-warning/40'
                      : isAuthorized
                      ? 'bg-tactical-success/20 text-tactical-success border border-tactical-success/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isWanted && <AlertOctagon className="w-3 h-3" />}
                    {isAuthorized && <CheckCircle className="w-3 h-3" />}
                    <span>{rec.registrationStatus.replace('_', ' ')}</span>
                  </span>
                </div>

                {/* Location */}
                <div className="col-span-2 text-slate-300">
                  <div>{rec.bopName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{rec.lastSeenCamera}</div>
                </div>

                {/* Speed */}
                <div className="col-span-1 text-slate-300 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-slate-500" />
                  <span>{rec.speedKmh} km/h</span>
                </div>

                {/* Confidence */}
                <div className="col-span-1 text-right font-bold text-tactical-success">
                  {rec.confidence.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Plate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-tactical-850 border border-tactical-border rounded-lg max-w-md w-full p-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-tactical mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-tactical-accent" />
              <span>Add Vehicle Plate to Watchlist</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JK-02-AZ-8841"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white uppercase outline-none focus:border-tactical-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Owner / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Stolen Vehicle Bulletin #801"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none focus:border-tactical-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Vehicle Classification</label>
                <select
                  value={newVehicleType}
                  onChange={(e) => setNewVehicleType(e.target.value)}
                  className="w-full bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none"
                >
                  <option value="Mahindra Bolero Pickup">Mahindra Bolero Pickup</option>
                  <option value="Armored Tactical Gypsy">Armored Tactical Gypsy</option>
                  <option value="Tractor / Agricultural">Tractor / Agricultural</option>
                  <option value="Commercial Truck 16-Tyre">Commercial Truck 16-Tyre</option>
                  <option value="Civilian SUV">Civilian SUV</option>
                  <option value="Motorcycle / 2-Wheeler">Motorcycle / 2-Wheeler</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Watchlist Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-tactical-900 border border-tactical-border rounded px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="WANTED">WANTED (INTERCEPT)</option>
                    <option value="SUSPICIOUS">SUSPICIOUS</option>
                    <option value="AUTHORIZED">AUTHORIZED CONVOY</option>
                    <option value="CIVILIAN_PASS">CIVILIAN PASS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">State / Jurisdiction</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full bg-tactical-900 border border-tactical-border rounded px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-tactical-border mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-tactical-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-tactical-accent hover:bg-cyan-400 text-tactical-900 font-bold font-hud"
                >
                  Save Plate Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
