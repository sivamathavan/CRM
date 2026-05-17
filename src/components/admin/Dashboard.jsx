import React, { useState } from 'react';
import { PhoneCall, Flame, TrendingUp, Target, Award, ShieldAlert, Trophy } from 'lucide-react';

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

export default function Dashboard({ leads, workers, callLogs }) {
  const [targetTab, setTargetTab] = useState('today'); // 'today', 'week', 'month', 'all'

  // 1. ANALYTICS CALCULATIONS
  const totalLeads = leads.length;
  const calledLeads = leads.filter(l => l.called).length;
  const callBacks = leads.filter(l => l.overall_status === 'Call Back').length;
  const hotLeads = leads.filter(l => l.overall_status === 'Interested').length;
  
  // Total Deal value logged
  const totalDealVal = leads.reduce((sum, l) => sum + (l.deal_value || 0), 0);

  // Conversion rate (Won / Called %)
  const wonCount = leads.filter(l => l.overall_status === 'Won').length;
  const conversionRate = calledLeads > 0 ? Math.round((wonCount / calledLeads) * 100) : 0;

  // 2. DAILY TARGET TIMEFRAMES LOGIC
  const getCallCountsTable = () => {
    const now = new Date();
    const y = now.getFullYear(), mo = now.getMonth(), d = now.getDate();
    
    // 9am - 9pm today window
    const todayStart = new Date(y, mo, d, 9, 0, 0).getTime();
    const todayEnd = new Date(y, mo, d, 21, 0, 0).getTime();
    
    // Week Mon-Sun
    const dayOfWeek = now.getDay() || 7;
    const weekStart = new Date(y, mo, d - (dayOfWeek - 1), 0, 0, 0).getTime();
    
    // Month Start
    const monthStart = new Date(y, mo, 1, 0, 0, 0).getTime();

    const nonAdmin = workers.filter(w => w.role !== 'admin');

    const rows = nonAdmin.map(w => {
      const wLogs = callLogs.filter(log => log.called_by === w.name);
      
      const todayCount = wLogs.filter(log => {
        const time = new Date(log.called_at).getTime();
        return time >= todayStart && time <= todayEnd;
      }).length;
      
      const weekCount = wLogs.filter(log => new Date(log.called_at).getTime() >= weekStart).length;
      const monthCount = wLogs.filter(log => new Date(log.called_at).getTime() >= monthStart).length;
      const allCount = wLogs.length;

      let count = allCount;
      let target = null;
      if (targetTab === 'today') {
        count = todayCount;
        target = 30;
      } else if (targetTab === 'week') {
        count = weekCount;
        target = 150;
      } else if (targetTab === 'month') {
        count = monthCount;
        target = 600;
      }

      const pct = target ? Math.min(Math.round((count / target) * 100), 100) : null;
      let clr = '#a29bfe';
      if (pct !== null) {
        clr = pct >= 100 ? '#00b894' : pct >= 60 ? '#fdcb6e' : '#ff7675';
      }

      return {
        name: w.name,
        count,
        pct,
        clr,
        todayCount,
        weekCount,
        monthCount,
        allCount
      };
    });

    // Sort by selected count descending
    return rows.sort((a, b) => b.count - a.count);
  };

  const targetRows = getCallCountsTable();

  // 3. FUNNEL STATUS BREAKDOWN
  const statusOptions = ['New', 'Interested', 'Call Back', 'No Answer', 'Busy', 'Wrong Number', 'Not Interested', 'Won'];
  const statusBreakdown = statusOptions.map(status => {
    const count = leads.filter(l => l.overall_status === status || (!l.overall_status && status === 'New')).length;
    const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
    const color = STATUS_COLORS[status] || '#aa3bff';
    return { status, count, pct, color };
  });

  return (
    <div className="p-4 flex flex-col gap-5 fu-anim select-none">
      
      {/* ── LIVE KPI STATS CARDS GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        <div className="bg-s2 border border-b2 p-4 rounded-r shadow flex flex-col">
          <span className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Total Leads</span>
          <strong className="text-2xl font-display font-extrabold text-white mt-1">{totalLeads}</strong>
          <span className="text-[9px] text-mu mt-1">Database count</span>
        </div>

        <div className="bg-s2 border border-b2 p-4 rounded-r shadow flex flex-col">
          <span className="text-[10px] uppercase font-bold text-mu2 tracking-wider flex items-center gap-1">
            <PhoneCall size={10} className="text-green" /> Called Leads
          </span>
          <strong className="text-2xl font-display font-extrabold text-green mt-1">
            {calledLeads} <span className="text-xs text-mu font-semibold">({totalLeads > 0 ? Math.round((calledLeads/totalLeads)*100) : 0}%)</span>
          </strong>
          <span className="text-[9px] text-mu mt-1">Total telecalling outbound</span>
        </div>

        <div className="bg-s2 border border-b2 p-4 rounded-r shadow flex flex-col">
          <span className="text-[10px] uppercase font-bold text-mu2 tracking-wider flex items-center gap-1">
            <Flame size={10} className="text-a3 animate-pulse" /> Hot Leads
          </span>
          <strong className="text-2xl font-display font-extrabold text-a3 mt-1">{hotLeads}</strong>
          <span className="text-[9px] text-mu mt-1">High interest rating</span>
        </div>

        <div className="bg-s2 border border-[#00b894]/20 p-4 rounded-r shadow flex flex-col bg-green/4">
          <span className="text-[10px] uppercase font-bold text-mu2 tracking-wider flex items-center gap-1">
            <Award size={10} className="text-green" /> Conversion
          </span>
          <strong className="text-2xl font-display font-extrabold text-green mt-1">{conversionRate}%</strong>
          <span className="text-[9px] text-mu mt-1">Won / Total Called leads</span>
        </div>

        <div className="bg-s2 border border-b2 p-4 rounded-r shadow flex flex-col col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Deals Logged</span>
          <strong className="text-xl font-display font-extrabold text-white mt-1.5 truncate">
            ₹{totalDealVal.toLocaleString('en-IN')}
          </strong>
          <span className="text-[9px] text-mu mt-1">Won contract values</span>
        </div>
      </div>

      {/* ── BOTTOM SECTIONS GRID (Targets & Funnel) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Call Target Compliance Panel */}
        <div className="bg-s2 border border-b2 rounded-r p-4 lg:col-span-2 flex flex-col shadow">
          <div className="flex justify-between items-center border-b border-b1 pb-3 mb-4 select-none flex-wrap gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                <Target size={14} className="text-accent" />
                Team Target Checklist
              </h3>
              <p className="text-[10px] text-mu mt-0.5">Track outbound calls against set team quotas</p>
            </div>
            
            {/* Timeline Filter Tab Selector */}
            <div className="flex bg-s3 border border-b2 rounded-full p-0.5">
              {[
                { id: 'today', label: 'Today (9a–9p)' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: 'all', label: 'All Time' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTargetTab(t.id)}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                    targetTab === t.id
                      ? 'bg-accent text-white shadow'
                      : 'text-mu hover:text-tx'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Workers call compliance grid */}
          <div className="overflow-x-auto">
            {targetRows.length === 0 ? (
              <div className="text-xs text-mu2 py-8 text-center">
                No active telecallers registered in team.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-b1 text-mu2 uppercase font-bold text-[9px] tracking-wider select-none">
                    <th className="py-2.5 px-3">Agent</th>
                    <th className="py-2.5 px-3 text-center">Today</th>
                    <th className="py-2.5 px-3 text-center">This Week</th>
                    <th className="py-2.5 px-3 text-center">This Month</th>
                    <th className="py-2.5 px-3 text-center">All Time</th>
                    <th className="py-2.5 px-3">Target Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-b1/50">
                  {targetRows.map(row => (
                    <tr key={row.name} className="hover:bg-s3/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-tx">👤 {row.name}</td>
                      <td className="py-2.5 px-3 text-center text-amber font-bold">{row.todayCount}</td>
                      <td className="py-2.5 px-3 text-center text-[#a29bfe] font-semibold">{row.weekCount}</td>
                      <td className="py-2.5 px-3 text-center text-[#00b894] font-semibold">{row.monthCount}</td>
                      <td className="py-2.5 px-3 text-center text-[#fd79a8] font-bold">{row.allCount}</td>
                      <td className="py-2.5 px-3 w-[150px]">
                        {row.pct !== null ? (
                          <div className="flex items-center gap-2 select-none">
                            <div className="flex-1 h-2 bg-s3 rounded-full overflow-hidden border border-b1">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${row.pct}%`, backgroundColor: row.clr }}
                              />
                            </div>
                            <span className="text-[9.5px] font-bold min-w-[28px] text-right" style={{ color: row.clr }}>
                              {row.pct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-mu2 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Lead Funnel breakdown */}
        <div className="bg-s2 border border-b2 rounded-r p-4 flex flex-col shadow">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-b1 pb-3 mb-4 select-none">
            <Trophy size={14} className="text-amber" />
            Outcomes Funnel Breakdown
          </h3>

          <div className="flex flex-col gap-3">
            {statusBreakdown.map(item => (
              <div key={item.status} className="flex flex-col gap-1 select-none">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-mu flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    {item.status === 'New' ? 'Todo (New)' : item.status}
                  </span>
                  <strong className="text-tx font-bold">{item.count} <span className="text-[10px] text-mu2 font-normal">({item.pct}%)</span></strong>
                </div>

                {/* mini bar */}
                <div className="h-1.5 bg-s3 rounded-full overflow-hidden border border-b1">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
