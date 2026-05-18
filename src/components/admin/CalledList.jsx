import React, { useState } from 'react';
import { Search, Globe, Clock, Calendar, MessageSquare, Award } from 'lucide-react';

const STATUS_COLORS = {
  'Interested': '#00b894',
  'Call Back': '#fdcb6e',
  'Not Interested': '#ff7675',
  'No Answer': '#8887a0',
  'Busy': '#fdcb6e',
  'Wrong Number': '#636e72',
  'Won': '#4a6cf7',
  'New': 'rgba(108,92,231,0.5)'
};

export default function CalledList({ leads, callLogs, workers = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selWorker, setSelWorker] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const activeWorkers = (workers || []).filter(w => w.role !== 'admin');

  // 1. FILTERING DATA
  const getFilteredData = () => {
    // Filter called leads
    let list = leads.filter(l => l.called);

    // Filter by worker
    if (selWorker !== 'all') {
      list = list.filter(l => l.assigned_to === selWorker);
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

      list = list.filter(l => {
        const logs = callLogs.filter(log => log.lead_id === l.id);
        if (!logs.length) return false;
        const latestTime = Math.max(...logs.map(log => new Date(log.called_at || log.created_at).getTime()));
        return latestTime >= cutOff.getTime();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(l => 
        (l.business || '').toLowerCase().includes(q) ||
        (l.contact || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.assigned_to || '').toLowerCase().includes(q) ||
        (l.overall_status || '').toLowerCase().includes(q)
      );
    }

    return list;
  };

  const filtered = getFilteredData();

  return (
    <div className="p-4 flex flex-col gap-4 fu-anim select-none">
      
      {/* Search and Filters Bar */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap items-center flex-1 min-w-0">
          {/* Search called list */}
          <div className="relative flex items-center w-full sm:w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search called leads..."
              className="w-full bg-s2 border border-b2 rounded-rs pl-8 pr-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
            />
            <Search size={12} className="absolute left-2.5 text-mu2" />
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
          Total Dialed: <strong>{filtered.length} leads</strong>
        </span>
      </div>

      {/* Datatable Scroll Container */}
      <div className="bg-s2 border border-b2 rounded-r shadow overflow-y-auto max-h-[calc(100dvh-190px)]">
        <div className="table-responsive">
          {filtered.length === 0 ? (
            <div className="text-xs text-mu2 py-10 text-center">
              No dialed leads logged yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-b1 bg-s1 text-mu2 uppercase font-bold text-[9px] tracking-wider select-none">
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Dialed Agent</th>
                  <th className="py-3 px-4 text-center">Outcome</th>
                  <th className="py-3 px-4 text-center">Deal Value</th>
                  <th className="py-3 px-4 text-center">Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-b1/55">
                {filtered.slice(0, 100).map(lead => {
                  const sClr = STATUS_COLORS[lead.overall_status] || STATUS_COLORS['New'];
                  
                  return (
                    <tr key={lead.id} className="hover:bg-s3/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-tx">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white">{lead.business}</span>
                          <span className="text-[9.5px] text-mu2 font-mono">📱 {lead.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-mu">{lead.contact} · {lead.city}</td>
                      <td className="py-3 px-4 font-semibold text-a2">👤 {lead.assigned_to || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span 
                          className="text-[8px] font-bold px-2.5 py-0.5 rounded border uppercase"
                          style={{
                            backgroundColor: `${sClr}15`,
                            color: sClr,
                            borderColor: `${sClr}25`
                          }}
                        >
                          {lead.overall_status || 'New'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-green">
                        {lead.deal_value ? `₹${lead.deal_value.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {lead.follow_up_date ? (
                          <span className="text-[10px] text-a2 font-semibold flex items-center justify-center gap-1">
                            <Calendar size={10} />
                            {lead.follow_up_date}
                          </span>
                        ) : (
                          <span className="text-mu2 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
