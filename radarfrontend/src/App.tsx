import React from 'react';
import { SurveillanceProvider, useSurveillance } from './context/SurveillanceContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { StreamGrid } from './components/streams/StreamGrid';
import { TacticalMap } from './components/map/TacticalMap';
import { AlertsPanel } from './components/alerts/AlertsPanel';
import { ANPRManager } from './components/analytics/ANPRManager';
import { FRSManager } from './components/analytics/FRSManager';
import { ForensicsSearch } from './components/forensics/ForensicsSearch';
import { SystemTopology } from './components/analytics/SystemTopology';
import { RadarPanel } from './components/radar/RadarPanel';

const DashboardContent: React.FC = () => {
  const { activeTab } = useSurveillance();

  return (
    <div className="flex flex-col h-screen w-screen bg-tactical-900 text-slate-100 overflow-hidden">
      {/* Tactical MHA HUD Header */}
      <Header />

      {/* Main Command Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation & Telemetry Sidebar */}
        <Sidebar />

        {/* Dynamic Operational View */}
        <main className="flex-1 flex overflow-hidden relative">
          {activeTab === 'MATRIX' && <StreamGrid />}
          {activeTab === 'MAP' && <TacticalMap />}
          {activeTab === 'ALERTS' && <AlertsPanel />}
          {activeTab === 'ANPR' && <ANPRManager />}
          {activeTab === 'FRS' && <FRSManager />}
          {activeTab === 'FORENSICS' && <ForensicsSearch />}
          {activeTab === 'TOPOLOGY' && <SystemTopology />}
          {activeTab === 'RADAR' && <RadarPanel />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SurveillanceProvider>
      <DashboardContent />
    </SurveillanceProvider>
  );
};

export default App;
