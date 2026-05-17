import React, { useState } from 'react';
import { Search, Phone, Star, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';

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

export default function LeadList({
  leads,
  curLead,
  onSelectLead,
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  onQuickOutcome,
  sheets = [],
  selectedSheet = 'all',
  setSelectedSheet,
  rawLeads = []
}) {
  const [outcomeLoading, setOutcomeLoading] = useState(null); // track lead id of running quick outcome

  const todayStr = new Date().toLocaleDateString('en-CA');
  const dueCount = rawLeads.filter(l => l.follow_up_date && l.follow_up_date.startsWith(todayStr)).length;

  // Filter handlers
  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'uncalled', label: '📞 Uncalled' },
    { id: 'followup', label: `⏰ Due (${dueCount})` },
    { id: 'called', label: '✅ Called' },
    { id: 'Interested', label: '🔥 Hot' },
    { id: 'Call Back', label: '🔄 CB' },
    { id: 'Not Interested', label: '❌ No' },
  ];

  // Listed Stats
  const listedCount = leads.length;
  const calledCount = leads.filter(l => l.called).length;
  const hotCount = leads.filter(l => l.overall_status === 'Interested').length;

  const handleQuickClick = async (e, leadId, outcome) => {
    e.stopPropagation(); // prevent selecting the lead when tapping outcome icon
    setOutcomeLoading(leadId);
    await onQuickOutcome(leadId, outcome);
    setOutcomeLoading(null);
  };

  return (
    <div className="w-full md:w-[280px] border-r border-b1 bg-s1 flex flex-col h-full overflow-hidden select-none">
      {/* Search Box */}
      <div className="p-2 shrink-0 relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search leads..."
          className="w-full bg-bg border border-b2 rounded-rs pl-8 pr-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
        />
        <Search size={12} className="absolute left-4.5 text-mu2" />
      </div>

      {/* Sheet Filter Dropdown */}
      <div className="px-2 pb-2 shrink-0 relative flex items-center border-b border-b1">
        <select
          value={selectedSheet}
          onChange={(e) => setSelectedSheet(e.target.value)}
          className="w-full bg-bg border border-b2 rounded-rs px-2 py-1.5 text-xs text-tx font-medium outline-none cursor-pointer hover:border-b3 transition-all"
        >
          <option value="all">📁 All Sheets Ingested</option>
          {(() => {
            const assignedSheetIds = new Set(leads.map(l => l.sheet_id).filter(Boolean));
            const workerSheets = sheets.filter(s => assignedSheetIds.has(s.id));
            return workerSheets.map(s => {
              const workerLeadsCount = leads.filter(l => l.sheet_id === s.id).length;
              return (
                <option key={s.id} value={s.id}>
                  📄 {s.name} ({workerLeadsCount} leads)
                </option>
              );
            });
          })()}
        </select>
      </div>

      {/* Filter Category Chips */}
      <div className="px-2 pb-2.5 border-b border-b1 flex gap-1 flex-wrap shrink-0">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-accent border-accent text-white'
                : 'bg-transparent border-b2 text-mu hover:text-tx hover:border-b3'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable list items */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-b1">
        {leads.length === 0 ? (
          <div className="p-6 text-center text-xs text-mu2">
            No leads match
          </div>
        ) : (
          leads.map(lead => {
            const isSelected = curLead && curLead.id === lead.id;
            const statusColor = STATUS_COLORS[lead.overall_status] || STATUS_COLORS['New'];
            const city = lead.city && lead.city !== '—' ? lead.city : (lead.address || '—').split(',')[0];
            const category = lead.industry && lead.industry !== '—' ? lead.industry : (lead.service && lead.service !== '—' ? lead.service : '');
            
            // Check if lead has website (useful tag)
            const hasWeb = lead.website && lead.website.trim() && lead.website !== '—' && lead.website.toLowerCase() !== 'null';

            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={`p-3 relative cursor-pointer transition-all hover:bg-s2 group flex flex-col gap-1.5 ${
                  isSelected ? 'bg-accent/8 border-l-2 border-accent' : ''
                } ${lead.called ? 'opacity-70' : ''}`}
              >
                {/* Header row: Name + priority indicator */}
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-xs font-semibold text-tx leading-snug group-hover:text-white transition-all max-w-[90%] truncate">
                    {lead.business}
                  </h3>
                </div>

                {/* Meta details: Contact and Location */}
                <p className="text-[10px] text-mu leading-none truncate">
                  {lead.contact || '—'} · {city} {lead.phone ? `· ${lead.phone}` : ''}
                </p>

                {/* Filter tags (Tags line) */}
                <div className="flex gap-1 flex-wrap select-none">
                  {category && (
                    <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-accent/12 border border-accent/20 text-a2">
                      {category}
                    </span>
                  )}
                  {lead.rating && (
                    <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-transparent border border-b2 text-amber flex items-center gap-0.5">
                      ★{lead.rating}
                    </span>
                  )}
                  {!hasWeb && (
                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-red/10 border border-red/20 text-red">
                      ❌ No Web
                    </span>
                  )}
                  {lead.called && (
                    <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-green/12 border border-green/20 text-green flex items-center">
                      📞 Called
                    </span>
                  )}
                </div>

                {/* Status outcome overlay badge (if logged) */}
                {lead.overall_status && lead.overall_status !== 'New' && (
                  <div 
                    className="absolute top-2 right-6 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border"
                    style={{
                      backgroundColor: `${statusColor}18`,
                      color: statusColor,
                      borderColor: `${statusColor}35`
                    }}
                  >
                    {lead.overall_status}
                  </div>
                )}

                {/* Quick Call Outcome Emoji toolbar (touch active) */}
                <div className="flex items-center gap-2.5 mt-1 border-t border-dashed border-b1 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                  <span className="text-[8px] text-mu2 font-semibold select-none mr-auto uppercase tracking-wide">
                    Quick Log:
                  </span>
                  
                  {outcomeLoading === lead.id ? (
                    <Loader size={12} className="text-mu animate-spin" />
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleQuickClick(e, lead.id, 'Interested')}
                        title="Log Interested"
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        ✅
                      </button>
                      <button
                        onClick={(e) => handleQuickClick(e, lead.id, 'No Answer')}
                        title="Log No Answer"
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        📵
                      </button>
                      <button
                        onClick={(e) => handleQuickClick(e, lead.id, 'Busy')}
                        title="Log Busy"
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        ⏳
                      </button>
                      <button
                        onClick={(e) => handleQuickClick(e, lead.id, 'Call Back')}
                        title="Log Call Back"
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        🔄
                      </button>
                      <button
                        onClick={(e) => handleQuickClick(e, lead.id, 'Not Interested')}
                        title="Log Not Interested"
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        ❌
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer statistics panel */}
      <div className="p-2 border-t border-b1 bg-s1 shrink-0 grid grid-cols-4 select-none">
        <div className="text-center">
          <div className="text-xs font-bold text-tx leading-tight">{listedCount}</div>
          <div className="text-[7.5px] uppercase font-semibold text-mu2 tracking-wider">Total</div>
        </div>
        <div className="text-center border-l border-b1">
          <div className="text-xs font-bold text-tx leading-tight">{leads.length}</div>
          <div className="text-[7.5px] uppercase font-semibold text-mu2 tracking-wider">Listed</div>
        </div>
        <div className="text-center border-l border-b1">
          <div className="text-xs font-bold text-green leading-tight">{calledCount}</div>
          <div className="text-[7.5px] uppercase font-semibold text-mu2 tracking-wider">Called</div>
        </div>
        <div className="text-center border-l border-b1">
          <div className="text-xs font-bold text-a3 leading-tight">{hotCount}</div>
          <div className="text-[7.5px] uppercase font-semibold text-mu2 tracking-wider">Hot🔥</div>
        </div>
      </div>
    </div>
  );
}

// Simple loader icon
function Loader({ size = 12, className = '' }) {
  return (
    <svg className={`animate-spin h-${size} w-${size} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
