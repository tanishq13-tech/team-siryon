import React, { useState } from 'react';
import { useSurveillance } from '../../context/SurveillanceContext';
import { FRSPerson } from '../../types';
import { UserCheck, Search, Plus, ShieldAlert, AlertTriangle, CheckCircle, Fingerprint } from 'lucide-react';

export const FRSManager: React.FC = () => {
  const { frsList, addFRSPerson } = useSurveillance();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New profile state
  const [name, setName] = useState<string>('');
  const [alias, setAlias] = useState<string>('');
  const [category, setCategory] = useState<FRSPerson['category']>('SUSPECT');
  const [riskLevel, setRiskLevel] = useState<FRSPerson['riskLevel']>('HIGH');
  const [notes, setNotes] = useState<string>('');

  const filtered = frsList.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.nationalId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || person.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addFRSPerson({
      name: name.trim(),
      alias: alias.trim() || 'Unknown',
      category,
      watchlistStatus: category === 'SUSPECT',
      nationalId: `ID-MHA-${Math.floor(1000 + Math.random() * 9000)}`,
      riskLevel,
      confidence: 94.5,
      lastSeenLocation: 'BOP Forward Sector',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      notes: notes.trim() || 'Profile logged from field surveillance feed.'
    });
    setName('');
    setAlias('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-tactical-900 overflow-hidden font-mono text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold font-tactical text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-tactical-accent" />
            <span>FACIAL RECOGNITION SYSTEM (FRS) BIOMETRIC WATCHLIST</span>
          </h2>
          <p className="text-slate-400 text-xs">
            1:N real-time software biometric matching running on edge servers without proprietary smart cameras.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-tactical-accent hover:bg-cyan-400 text-tactical-900 font-bold font-hud rounded flex items-center gap-1.5 shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll New Profile</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-tactical-850 border border-tactical-border p-3 rounded-lg mb-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search person by name, alias, or National ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none focus:border-tactical-accent"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">CATEGORY:</span>
          {['ALL', 'SUSPECT', 'BORDER_RESIDENT', 'SECURITY_FORCE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                categoryFilter === cat
                  ? 'bg-tactical-accent text-tactical-900 font-bold'
                  : 'bg-tactical-800 text-slate-300 hover:text-white border border-tactical-border'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Profiles */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
        {filtered.map((person) => {
          const isSuspect = person.category === 'SUSPECT';
          const isSecurity = person.category === 'SECURITY_FORCE';

          return (
            <div
              key={person.id}
              className={`p-3.5 rounded-lg border flex flex-col justify-between transition ${
                isSuspect
                  ? 'bg-tactical-alert/10 border-tactical-alert/40'
                  : 'bg-tactical-850 border-tactical-border'
              }`}
            >
              <div>
                <div className="flex items-start gap-3">
                  {/* Photo with HUD corners */}
                  <div className="relative w-16 h-16 rounded overflow-hidden border border-tactical-border shrink-0">
                    <img
                      src={person.photoUrl}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-tactical truncate">
                        {person.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        person.riskLevel === 'HIGH'
                          ? 'bg-tactical-alert text-white'
                          : person.riskLevel === 'MEDIUM'
                          ? 'bg-tactical-warning text-tactical-900'
                          : 'bg-tactical-success/20 text-tactical-success'
                      }`}>
                        {person.riskLevel} RISK
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Alias: <span className="text-slate-200">{person.alias}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ID: {person.nationalId}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 p-2 bg-tactical-900/80 rounded border border-tactical-border/60 text-[11px] text-slate-300">
                  {person.notes}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-tactical-border/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Last Seen: <strong className="text-slate-200">{person.lastSeenLocation}</strong></span>
                <span className="text-tactical-accent font-bold">Match: {person.confidence.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enroll Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-tactical-850 border border-tactical-border rounded-lg max-w-md w-full p-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-tactical mb-3 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-tactical-accent" />
              <span>Enroll Person into FRS Database</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mahmood"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none focus:border-tactical-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Known Alias / Callsign</label>
                <input
                  type="text"
                  placeholder="e.g. Abu Hamza"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none focus:border-tactical-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Profile Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-tactical-900 border border-tactical-border rounded px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="SUSPECT">SUSPECT / INFILTRATOR</option>
                    <option value="BORDER_RESIDENT">BORDER RESIDENT</option>
                    <option value="SECURITY_FORCE">SECURITY FORCES</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Threat Level</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as any)}
                    className="w-full bg-tactical-900 border border-tactical-border rounded px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="HIGH">HIGH THREAT</option>
                    <option value="MEDIUM">MEDIUM MONITOR</option>
                    <option value="LOW">LOW CLEARANCE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Intelligence Dossier Notes</label>
                <textarea
                  rows={2}
                  placeholder="Suspected crossing points, history, or intelligence remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-tactical-900 border border-tactical-border rounded px-3 py-1.5 text-xs text-white outline-none focus:border-tactical-accent"
                />
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
                  Enroll Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
