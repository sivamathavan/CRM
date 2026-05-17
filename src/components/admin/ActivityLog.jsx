import React, { useState } from 'react';
import { ClipboardList, ShieldAlert, PhoneCall, Upload, Users, Filter, Trash2 } from 'lucide-react';

const ACTION_ICONS = {
  'call_logged': <PhoneCall size={12} className="text-green" />,
  'call_logged_whatsapp': <PhoneCall size={12} className="text-green" />,
  'sheet_uploaded': <Upload size={12} className="text-a2" />,
  'worker_created': <Users size={12} className="text-a3" />,
  'worker_deleted': <Users size={12} className="text-red" />,
  'worker_pin_updated': <ShieldAlert size={12} className="text-amber" />,
  'lead_deleted': <Trash2 size={12} className="text-red" />
};

export default function ActivityLog({ activities, workers = [] }) {
  const [filterType, setFilterType] = useState('all');
  const [selWorker, setSelWorker] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const activeWorkers = (workers || []).filter(w => w.role !== 'admin');

  const getFilteredLogs = () => {
    let list = activities || [];

    // Filter by type
    if (filterType !== 'all') {
      list = list.filter(a => {
        const act = a.action || a.action_type || '';
        return act === filterType;
      });
    }

    // Filter by worker
    if (selWorker !== 'all') {
      list = list.filter(a => a.worker_name === selWorker || a.uploaded_by === selWorker);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let cutOff = new Date(0);
      if (dateRange === 'daily') {
        cutOff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === 'weekly') {
        cutOff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'monthly') {
        cutOff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      list = list.filter(a => {
        const t = new Date(a.created_at).getTime();
        return t >= cutOff.getTime();
      });
    }

    return list;
  };

  const filteredLogs = getFilteredLogs();

  const actionTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'call_logged', label: '📞 Calls Logged' },
    { value: 'sheet_uploaded', label: '📄 Sheet Uploads' },
    { value: 'worker_created', label: '👤 Team Additions' },
  ];

  return (
    <div className="p-4 flex flex-col gap-4 fu-anim select-none max-h-[500px]">
      
      {/* Category Filter and Selectors */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex bg-s2 border border-b2 rounded-full p-0.5 select-none">
            {actionTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                className={`text-[9.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                  filterType === t.value
                    ? 'bg-accent text-white shadow'
                    : 'text-mu hover:text-tx'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Worker Selector */}
          <select
            value={selWorker}
            onChange={(e) => setSelWorker(e.target.value)}
            className="bg-s2 border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx font-medium outline-none cursor-pointer hover:border-b3 transition-all"
          >
            <option value="all">👤 All Workers</option>
            {activeWorkers.map(w => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>

          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-s2 border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx font-medium outline-none cursor-pointer hover:border-b3 transition-all"
          >
            <option value="all">📅 All Time</option>
            <option value="daily">📆 Today</option>
            <option value="weekly">🗓️ Weekly (7 Days)</option>
            <option value="monthly">📅 Monthly (30 Days)</option>
          </select>
        </div>

        <span className="text-[10px] text-mu uppercase font-bold tracking-wider">
          Total logs: <strong>{filteredLogs.length} events</strong>
        </span>
      </div>

      {/* Vertical Timeline Container */}
      <div className="bg-s2 border border-b2 rounded-r shadow overflow-y-auto min-h-0 flex-1 max-h-[420px]">
        {filteredLogs.length === 0 ? (
          <div className="text-xs text-mu2 py-10 text-center">
            No audit logs recorded in system.
          </div>
        ) : (
          <div className="flex flex-col p-4 gap-4">
            {filteredLogs.slice(0, 100).map(log => {
              const dateStr = new Date(log.created_at).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
              });
              
              const actType = log.action || log.action_type || 'event';
              const icon = ACTION_ICONS[actType] || <ClipboardList size={12} className="text-mu" />;

              return (
                <div key={log.id} className="flex gap-3 relative group fu-anim">
                  
                  {/* Timeline bullet icon */}
                  <div className="w-6 h-6 rounded-full bg-s3 border border-b2 flex items-center justify-center shrink-0 z-10">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0 bg-s3/40 border border-b1 rounded-rs p-3 flex flex-col gap-1 hover:border-b2 transition-colors">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        {actType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9.5px] text-mu2 font-medium">{dateStr}</span>
                    </div>

                    <div className="text-xs text-tx font-medium mt-0.5">
                      Target: <strong className="text-a2">{log.lead_business || log.target_name || '—'}</strong>
                      {(log.worker_name || log.uploaded_by) && (
                        <span className="text-mu2 ml-2 font-normal">
                          by 👤 {log.worker_name || log.uploaded_by}
                        </span>
                      )}
                    </div>

                    {(log.detail || log.details) && (
                      <p className="text-[11px] text-mu leading-normal mt-1 border-t border-b1/30 pt-1">
                        {log.detail || log.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
