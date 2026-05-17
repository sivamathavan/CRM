import React, { useState } from 'react';
import AdminNav from './AdminNav';
import Dashboard from './Dashboard';
import SheetsMgmt from './SheetsMgmt';
import AllLeadsList from './AllLeadsList';
import CalledList from './CalledList';
import WorkersMgmt from './WorkersMgmt';
import ActivityLog from './ActivityLog';

export default function AdminPanel({
  leads,
  workers,
  sheets,
  callLogs,
  activities,
  curUser,
  onDataRefresh,
  showToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('db');

  const renderActiveTab = () => {
    switch (activeSubTab) {
      case 'db':
        return <Dashboard leads={leads} workers={workers} callLogs={callLogs} />;
      case 'sheets':
        return (
          <SheetsMgmt
            leads={leads}
            workers={workers}
            sheets={sheets}
            curUser={curUser}
            onSheetUploaded={onDataRefresh}
            showToast={showToast}
          />
        );
      case 'all':
        return (
          <AllLeadsList
            leads={leads}
            workers={workers}
            sheets={sheets}
            onLeadsUpdated={onDataRefresh}
            showToast={showToast}
          />
        );
      case 'called':
        return <CalledList leads={leads} callLogs={callLogs} workers={workers} />;
      case 'workers':
        return (
          <WorkersMgmt
            workers={workers}
            onWorkersUpdated={onDataRefresh}
            showToast={showToast}
          />
        );
      case 'logs':
        return <ActivityLog activities={activities} workers={workers} />;
      default:
        return <Dashboard leads={leads} workers={workers} callLogs={callLogs} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      {/* Sidebar Nav */}
      <AdminNav activeTab={activeSubTab} setActiveTab={setActiveSubTab} />

      {/* Main Administrative content viewport */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-bg/40">
        {renderActiveTab()}
      </div>
    </div>
  );
}
