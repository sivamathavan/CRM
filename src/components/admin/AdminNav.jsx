import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Users, Database, ClipboardList, PhoneCall } from 'lucide-react';

export default function AdminNav({ activeTab, setActiveTab }) {
  
  const navItems = [
    { id: 'db', label: 'Dashboard', icon: <LayoutDashboard size={14} />, section: 'Overview' },
    { id: 'sheets', label: 'Excel Upload', icon: <FileSpreadsheet size={14} />, section: 'Management' },
    { id: 'all', label: 'All Leads', icon: <Database size={14} />, section: 'Management' },
    { id: 'called', label: 'Called Leads', icon: <PhoneCall size={14} />, section: 'Management' },
    { id: 'workers', label: 'Workers Accounts', icon: <Users size={14} />, section: 'Management' },
    { id: 'logs', label: 'Audit Trail Logs', icon: <ClipboardList size={14} />, section: 'Overview' },
  ];

  // Group by sections for desktop view structure
  const sections = ['Overview', 'Management'];

  return (
    <nav className="w-full md:w-[220px] bg-s1 border-r md:border-r border-b1 md:border-b-0 border-b flex flex-row md:flex-col shrink-0 select-none overflow-x-auto md:overflow-x-hidden md:overflow-y-auto">
      {/* ── DESKTOP NAVIGATION LAYOUT ── */}
      <div className="hidden md:flex flex-col gap-5 p-4 w-full">
        {sections.map(sec => (
          <div key={sec} className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-mu2 ml-2 mb-1">
              {sec}
            </span>
            {navItems
              .filter(item => item.section === sec)
              .map(item => {
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-rs cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-accent/12 border-accent/20 text-a2'
                        : 'bg-transparent border-transparent text-mu hover:text-tx hover:bg-s2/50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      {/* ── MOBILE SWIPEABLE TAB NAVIGATION LAYOUT (<= 768px) ── */}
      <div className="md:hidden flex items-center gap-2 p-2.5 w-full overflow-x-auto whitespace-nowrap scrollbar-none scrollbar-width-none">
        {navItems.map(item => {
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-accent border-accent text-white shadow-[0_2px_8px_rgba(108,92,231,0.25)]'
                  : 'bg-s2 border-b2 text-mu hover:text-tx'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
