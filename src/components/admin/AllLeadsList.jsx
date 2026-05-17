import React, { useState } from 'react';
import { Search, Download, Edit, Trash2, Globe, Sparkles, ChevronDown, Check, X, ShieldAlert } from 'lucide-react';
import { INDUSTRIES, getSvc, matchIndustry } from '../../utils/templates';
import { sDel, sPatch } from '../../utils/supabase';

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

export default function AllLeadsList({
  leads,
  workers,
  sheets = [],
  onLeadsUpdated,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInd, setSelectedInd] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState('all');
  const [selectedSheet, setSelectedSheet] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }

  // Edit Modal Overlay State
  const [editLead, setEditLead] = useState(null); // lead object under edit
  const [isUpdating, setIsUpdating] = useState(false);

  // CSV Export Mechanism
  const handleCSVExport = () => {
    if (!leads.length) {
      showToast('⚠️ No leads in database to export!', 'warning');
      return;
    }
    const headers = ['Business', 'Contact', 'Phone', 'Email', 'Industry', 'Address', 'Status', 'Priority', 'Rating', 'Worker', 'Website'];
    const csvContent = [
      headers.join(','),
      ...leads.map(l => [
        `"${(l.business || '').replace(/"/g, '""')}"`,
        `"${(l.contact || '').replace(/"/g, '""')}"`,
        `"${l.phone || ''}"`,
        `"${l.email || ''}"`,
        `"${(l.industry || '').replace(/"/g, '""')}"`,
        `"${(l.address || '').replace(/"/g, '""')}"`,
        `"${l.overall_status || 'New'}"`,
        `"${l.priority || 'Medium'}"`,
        `"${l.rating || ''}"`,
        `"${l.assigned_to || ''}"`,
        `"${l.website || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete Lead Trigger
  const executeDeleteLead = async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    setDeleteConfirm(null); // Close immediately
    try {
      await sDel('leads', id);
      showToast('✅ Lead deleted successfully!', 'success');
      onLeadsUpdated();
    } catch (e) {
      console.error(e);
      showToast('❌ Error deleting lead.', 'error');
    }
  };

  // Open Edit Modal
  const openEdit = (lead) => {
    setEditLead({ ...lead });
  };

  const closeEdit = () => {
    setEditLead(null);
  };

  // Save Edit Lead Fields
  const saveEdit = async () => {
    if (!editLead) return;
    setIsUpdating(true);
    try {
      const { id, ...updateData } = editLead;
      await sPatch('leads', id, {
        business: updateData.business,
        contact: updateData.contact,
        phone: updateData.phone,
        email: updateData.email,
        website: updateData.website,
        address: updateData.address,
        industry: updateData.industry,
        service: updateData.service,
        priority: updateData.priority,
        rating: updateData.rating ? parseInt(updateData.rating) : null,
        assigned_to: updateData.assigned_to
      });
      showToast('✅ Lead updated successfully!', 'success');
      closeEdit();
      onLeadsUpdated();
    } catch (e) {
      console.error(e);
      showToast('❌ Error updating lead details.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // 1. FILTERING DATA
  const getFilteredData = () => {
    let list = [...leads];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(l => 
        (l.business || '').toLowerCase().includes(q) ||
        (l.contact || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.city || '').toLowerCase().includes(q) ||
        (l.assigned_to || '').toLowerCase().includes(q)
      );
    }

    if (selectedInd !== 'all') {
      list = list.filter(l => {
        const normalized = matchIndustry(l.industry);
        return normalized === selectedInd || l.industry === selectedInd;
      });
    }

    if (selectedStatus !== 'all') {
      list = list.filter(l => l.overall_status === selectedStatus || (!l.overall_status && selectedStatus === 'New'));
    }

    if (selectedWorker !== 'all') {
      list = list.filter(l => l.assigned_to === selectedWorker);
    }

    if (selectedSheet !== 'all') {
      list = list.filter(l => String(l.sheet_id) === String(selectedSheet));
    }

    return list;
  };

  const filteredLeads = getFilteredData();
  const activeWorkers = workers.filter(w => w.role !== 'admin');

  return (
    <div className="p-4 flex flex-col gap-4 fu-anim">
      
      {/* Search and Action Bar */}
      <div className="flex justify-between items-center gap-3 flex-wrap select-none">
        
        {/* Search */}
        <div className="relative flex items-center w-full sm:w-[250px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search all leads..."
            className="w-full bg-s2 border border-b2 rounded-rs pl-8 pr-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
          />
          <Search size={12} className="absolute left-2.5 text-mu2" />
        </div>

        {/* Filters and CSV trigger */}
        <div className="flex gap-2 flex-wrap items-center">
          
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="bg-s2 border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none cursor-pointer hover:border-b3"
          >
            <option value="all">👤 All Workers</option>
            {activeWorkers.map(w => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>

          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
            className="bg-s2 border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none cursor-pointer hover:border-b3 max-w-[140px] truncate"
            title="Filter by Ingested Sheet"
          >
            <option value="all">📁 All Sheets</option>
            {sheets.map(s => (
              <option key={s.id} value={s.id}>📄 {s.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-s2 border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none cursor-pointer hover:border-b3"
          >
            <option value="all">📊 All Statuses</option>
            <option value="New">Todo (New)</option>
            <option value="Interested">Interested</option>
            <option value="Call Back">Call Back</option>
            <option value="No Answer">No Answer</option>
            <option value="Busy">Busy</option>
            <option value="Wrong Number">Wrong Number</option>
            <option value="Won">Won</option>
          </select>

          <button
            onClick={handleCSVExport}
            className="btn border border-b2 bg-s2 hover:bg-s3 text-tx text-xs px-3.5 py-1.5 rounded-rs cursor-pointer flex items-center gap-1 transition-all"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Horizontal Industry chips filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-b1 whitespace-nowrap scrollbar-none select-none">
        <button
          onClick={() => setSelectedInd('all')}
          className={`text-[10px] font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${
            selectedInd === 'all'
              ? 'bg-accent border-accent text-white'
              : 'bg-s2 border-b2 text-mu hover:text-tx'
          }`}
        >
          All Sectors
        </button>
        {INDUSTRIES.map(ind => (
          <button
            key={ind.label}
            onClick={() => setSelectedInd(ind.label)}
            className={`text-[10px] font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${
              selectedInd === ind.label
                ? 'bg-accent border-accent text-white'
                : 'bg-s2 border-b2 text-mu hover:text-tx'
            }`}
          >
            <span>{ind.icon} {ind.label}</span>
          </button>
        ))}
      </div>

      {/* Interactive Datatable Container */}
      <div className="bg-s2 border border-b2 rounded-r shadow overflow-hidden">
        <div className="table-responsive">
          {filteredLeads.length === 0 ? (
            <div className="text-xs text-mu2 py-10 text-center select-none">
              No leads found in database.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-b1 bg-s1 text-mu2 uppercase font-bold text-[9px] tracking-wider select-none">
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Deal Value</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-b1/55">
                {filteredLeads.slice(0, 100).map(lead => {
                  const sClr = STATUS_COLORS[lead.overall_status] || STATUS_COLORS['New'];
                  const websiteExists = lead.website && lead.website.trim() && lead.website !== '—' && lead.website.toLowerCase() !== 'null';

                  return (
                    <tr key={lead.id} className="hover:bg-s3/40 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-tx">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white">{lead.business}</span>
                          {websiteExists ? (
                            <a 
                              href={lead.website} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[9.5px] text-green hover:underline flex items-center gap-0.5"
                            >
                              <Globe size={8} /> {lead.website}
                            </a>
                          ) : (
                            <span className="text-[9.5px] text-red/80">❌ No Website</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-mu">{lead.contact}</td>
                      <td className="py-2.5 px-4 text-mu font-mono">{lead.phone}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-accent/8 border border-accent/15 text-a2">
                          {lead.industry || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-a2">👤 {lead.assigned_to || '—'}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span 
                          className="text-[8px] font-bold px-2 py-0.5 rounded border uppercase"
                          style={{
                            backgroundColor: `${sClr}15`,
                            color: sClr,
                            borderColor: `${sClr}25`
                          }}
                        >
                          {lead.overall_status || 'New'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-green">
                        {lead.deal_value ? `₹${lead.deal_value.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(lead)}
                            className="p-1.5 rounded-rs bg-s3 border border-b2 text-mu hover:text-tx hover:border-b3 cursor-pointer"
                            title="Edit Lead Details"
                          >
                            <Edit size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteConfirm({ id: lead.id, name: lead.business });
                            }}
                            type="button"
                            className="p-1.5 rounded-rs bg-s3 border border-red/15 text-red/60 hover:text-red hover:border-red/35 cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {leads.length > 100 && (
          <div className="p-3 bg-s1 text-center text-[10.5px] text-mu select-none border-t border-b1">
            Displaying first 100 leads of {leads.length}. Use filters and search to isolate contacts.
          </div>
        )}
      </div>

      {/* ── DETAIL EDIT MODAL OVERLAY ── */}
      {editLead && (
        <div className="fixed inset-0 z-[400] bg-bg/85 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="bg-s1 border border-b2 rounded-r p-5 w-full max-w-[500px] shadow-2xl fu-anim">
            <div className="flex justify-between items-center border-b border-b1 pb-3 mb-4 select-none">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                <Edit size={15} className="text-accent" />
                Edit Lead Metadata
              </h3>
              <button 
                onClick={closeEdit} 
                className="p-1 rounded-full border border-b2 bg-s2 text-mu hover:text-tx cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Edit Fields Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 max-h-[360px] overflow-y-auto pr-1">
              
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Business Name</label>
                <input
                  type="text"
                  value={editLead.business}
                  onChange={(e) => setEditLead(prev => ({ ...prev, business: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Contact Owner</label>
                <input
                  type="text"
                  value={editLead.contact}
                  onChange={(e) => setEditLead(prev => ({ ...prev, contact: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Phone</label>
                <input
                  type="text"
                  value={editLead.phone}
                  onChange={(e) => setEditLead(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={editLead.email}
                  onChange={(e) => setEditLead(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Website URL</label>
                <input
                  type="text"
                  value={editLead.website}
                  onChange={(e) => setEditLead(prev => ({ ...prev, website: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Location Address</label>
                <input
                  type="text"
                  value={editLead.address}
                  onChange={(e) => setEditLead(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Sector Industry</label>
                <select
                  value={editLead.industry}
                  onChange={(e) => setEditLead(prev => ({ ...prev, industry: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none cursor-pointer"
                >
                  <option value="—">Select Industry</option>
                  {INDUSTRIES.map(i => (
                    <option key={i.label} value={i.label}>{i.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Assigned Agent</label>
                <select
                  value={editLead.assigned_to}
                  onChange={(e) => setEditLead(prev => ({ ...prev, assigned_to: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none cursor-pointer"
                >
                  <option value="—">Unassigned</option>
                  {activeWorkers.map(w => (
                    <option key={w.name} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Required Service</label>
                <select
                  value={editLead.service}
                  onChange={(e) => setEditLead(prev => ({ ...prev, service: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none cursor-pointer"
                >
                  <option value="Web Dev">🌐 Web Application Development</option>
                  <option value="App Dev">📱 Mobile App Development</option>
                  <option value="AI Automation">🤖 AI Automation</option>
                  <option value="Digital Marketing">📣 Digital Marketing & SEO</option>
                  <option value="All Digital Services">✨ Complete Transformation</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] uppercase font-bold text-mu2 tracking-wider">Lead Priority</label>
                <select
                  value={editLead.priority}
                  onChange={(e) => setEditLead(prev => ({ ...prev, priority: e.target.value }))}
                  className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none cursor-pointer"
                >
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">⚪ Low</option>
                </select>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 mt-4 pt-3 border-t border-b1 justify-end">
              <button
                onClick={closeEdit}
                className="btn border border-b2 bg-s2 text-tx hover:bg-s3 text-xs px-4 py-2 rounded-rs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={isUpdating}
                className="btn primary bg-accent hover:bg-[#5d4fd6] text-white text-xs px-5 py-2 rounded-rs cursor-pointer shadow-md disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Lead Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/75 backdrop-blur-md p-4 fu-anim">
          <div className="bg-s2 border border-b2 rounded-r max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-red">
              <div className="w-9 h-9 rounded-full bg-red/10 border border-red/20 flex items-center justify-center shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-white">Permanently Delete Lead?</h4>
                <p className="text-[9.5px] text-mu mt-0.5">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="bg-s3 border border-b1 rounded-rs p-3 text-[11px] text-mu leading-relaxed">
              You are about to delete lead <strong className="text-white">👤 {deleteConfirm.name}</strong>. 
              This will permanently remove the lead record and its call history from the CRM.
            </div>

            <div className="flex justify-end gap-2 text-[10.5px]">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-3.5 py-2 rounded-rs bg-s3 border border-b2 text-tx font-semibold hover:bg-s3/80 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteLead}
                className="px-3.5 py-2 rounded-rs bg-red hover:bg-[#d63031] text-white font-bold cursor-pointer transition-colors"
              >
                Delete lead
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
