import React, { useState, useEffect } from 'react';
import LeadList from './LeadList';
import LeadDetail from './LeadDetail';

export default function CRMPanel({
  leads,
  workers,
  sheets = [],
  callLogs,
  curUser,
  curRole,
  curLead,
  setCurLead,
  sortVal,
  gmailEmail,
  gmailToken,
  onConnectGmail,
  onSendEmail,
  onLogCall,
  onQuickOutcome,
  onMarkCalled,
  onMarkWA,
  showToast
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('all');
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'detail'

  // Auto-switch mobile view to detail when a lead is selected
  const handleSelectLead = (lead) => {
    setCurLead(lead);
    setMobileView('detail');
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  // 1. FILTER LOGIC
  const getFilteredLeads = () => {
    let list = [...leads];

    // Filter by Sheet Selection
    if (selectedSheet !== 'all') {
      list = list.filter(l => String(l.sheet_id) === String(selectedSheet));
    }

    // Search Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(l => 
        (l.business || '').toLowerCase().includes(q) ||
        (l.contact || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.city || '').toLowerCase().includes(q) ||
        (l.industry || '').toLowerCase().includes(q)
      );
    }

    // Active Category Filter
    if (activeFilter === 'uncalled') {
      list = list.filter(l => !l.called);
    } else if (activeFilter === 'followup') {
      const todayStr = new Date().toLocaleDateString('en-CA');
      list = list.filter(l => l.follow_up_date && l.follow_up_date.startsWith(todayStr));
    } else if (activeFilter === 'called') {
      list = list.filter(l => l.called);
    } else if (activeFilter !== 'all') {
      // Filter by status match (Interested, Call Back, Not Interested)
      list = list.filter(l => l.overall_status === activeFilter);
    }

    // 2. SORT LOGIC
    if (sortVal === 'name') {
      list.sort((a, b) => (a.business || '').localeCompare(b.business || ''));
    } else if (sortVal === 'no_website') {
      list.sort((a, b) => {
        const aNo = !a.website || a.website.trim() === '' || a.website.trim() === '—';
        const bNo = !b.website || b.website.trim() === '' || b.website.trim() === '—';
        if (aNo && !bNo) return -1;
        if (!aNo && bNo) return 1;
        return (a.business || '').localeCompare(b.business || '');
      });
    } else if (sortVal === 'uncalled') {
      list.sort((a, b) => (a.called ? 1 : 0) - (b.called ? 1 : 0));
    } else if (sortVal === 'followup') {
      list.sort((a, b) => {
        const aDate = a.follow_up_date ? new Date(a.follow_up_date).getTime() : Infinity;
        const bDate = b.follow_up_date ? new Date(b.follow_up_date).getTime() : Infinity;
        if (aDate !== bDate) return aDate - bDate;
        return (a.business || '').localeCompare(b.business || '');
      });
    }

    return list;
  };

  const filteredLeads = getFilteredLeads();

  // Next Uncalled Lead Jump Trigger
  const handleGoNext = () => {
    const uncalled = filteredLeads.filter(l => !l.called);
    if (!uncalled.length) {
      showToast('🎉 All listed leads have been called! Outstanding job!', 'success');
      return;
    }
    
    // Jump to next or start of uncalled
    const curIdx = curLead ? uncalled.findIndex(l => l.id === curLead.id) : -1;
    const nextLead = uncalled[curIdx + 1] || uncalled[0];
    if (nextLead) {
      handleSelectLead(nextLead);
    }
  };

  // Fetch histories & followups for active lead
  const activeLeadHistory = curLead 
    ? callLogs.filter(log => log.lead_id === curLead.id).sort((a, b) => new Date(b.called_at) - new Date(a.called_at))
    : [];

  const activeLeadFollowups = curLead
    ? leads.filter(l => l.follow_up_date && l.assigned_to === curUser).sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date))
    : [];

  const activeLeadNotInt = leads.filter(l => l.overall_status === 'Not Interested' && l.assigned_to === curUser);

  return (
    <div 
      className={`flex-1 flex overflow-hidden select-none ${
        mobileView === 'detail' ? 'show-detail' : 'show-list'
      }`}
    >
      {/* Sidebar Section */}
      <div id="leadListSidebar" className="shrink-0 h-full flex flex-col w-full md:w-[280px]">
        <LeadList
          leads={filteredLeads}
          curLead={curLead}
          onSelectLead={handleSelectLead}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onQuickOutcome={onQuickOutcome}
          sheets={sheets}
          selectedSheet={selectedSheet}
          setSelectedSheet={setSelectedSheet}
          showToast={showToast}
          rawLeads={leads}
        />
      </div>

      {/* Detail Workspace View Section */}
      <div className="flex-1 h-full overflow-hidden">
        <LeadDetail
          lead={curLead}
          history={activeLeadHistory}
          followups={activeLeadFollowups}
          notIntLeads={activeLeadNotInt}
          gmailEmail={gmailEmail}
          gmailToken={gmailToken}
          onConnectGmail={onConnectGmail}
          onSendEmail={onSendEmail}
          onLogCall={onLogCall}
          onBackToList={handleBackToList}
          onGoNext={handleGoNext}
          onMarkCalled={onMarkCalled}
          onMarkWA={onMarkWA}
          showToast={showToast}
        />
      </div>

      {/* Styled Responsive overrides using internal scoped CSS */}
      <style>{`
        @media (max-width: 768px) {
          .show-list #leadView {
            display: none !important;
          }
          .show-detail #leadListSidebar {
            display: none !important;
          }
          .show-detail #leadView {
            display: flex !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
