import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Users, Award, ShieldCheck, Check, AlertTriangle, AlertCircle, FileText, Plus, Trash2, Edit, ShieldAlert } from 'lucide-react';
import { sPost, sGet, sDel, sDelQ, sPatch, supabase } from '../../utils/supabase';
import { matchIndustry, INDUSTRIES } from '../../utils/templates';

export default function SheetsMgmt({
  leads,
  workers,
  sheets,
  curUser,
  onSheetUploaded,
  showToast
}) {
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState([]); // [{ business, contact, phone, ... }]
  const [duplicateRows, setDuplicateRows] = useState([]); // duplicate phone numbers
  const [selSheetName, setSelSheetName] = useState('');
  const [selWorkers, setSelWorkers] = useState([]); // list of worker names selected for split
  const [isInserting, setIsInserting] = useState(false);
  const [overwriteSector, setOverwriteSector] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [editSheet, setEditSheet] = useState(null); // { id, name, assigned_to }
  const [editSheetName, setEditSheetName] = useState('');
  const [editSheetWorkers, setEditSheetWorkers] = useState([]);
  const [isUpdatingSheet, setIsUpdatingSheet] = useState(false);

  const fileInputRef = useRef(null);
  const activeWorkers = workers.filter(w => w.role !== 'admin');

  // Handle Drag & Drop Events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Parse Excel sheets using SheetJS
  const processFile = (file) => {
    setSelSheetName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '—' });

      // Clean up headers (flexible key checks for Phone, Business, etc.)
      const cleaned = rawJson.map(row => {
        const keys = Object.keys(row);
        
        // Find phone
        const pKey = keys.find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile') || k.toLowerCase().includes('contact no'));
        // Find business
        const bKey = keys.find(k => k.toLowerCase().includes('business') || k.toLowerCase().includes('company') || k.toLowerCase().includes('name'));
        // Find contact
        const cKey = keys.find(k => k.toLowerCase().includes('contact') || k.toLowerCase().includes('person') || k.toLowerCase().includes('owner'));
        // Find industry
        const iKey = keys.find(k => k.toLowerCase().includes('industry') || k.toLowerCase().includes('category') || k.toLowerCase().includes('type'));
        // Find website
        const wKey = keys.find(k => k.toLowerCase().includes('website') || k.toLowerCase().includes('web') || k.toLowerCase().includes('site'));
        // Find city
        const cityKey = keys.find(k => k.toLowerCase().includes('city') || k.toLowerCase().includes('location') || k.toLowerCase().includes('town'));
        // Find service
        const sKey = keys.find(k => k.toLowerCase().includes('service') || k.toLowerCase().includes('interest'));

        const phoneVal = pKey ? String(row[pKey]).trim().replace(/\D/g, '') : '';
        const rawInd = iKey ? String(row[iKey]).trim() : '';

        return {
          business: bKey ? String(row[bKey]).trim() : '—',
          contact: cKey ? String(row[cKey]).trim() : '—',
          phone: phoneVal,
          email: row.Email || row.email || '—',
          industry: matchIndustry(rawInd) || rawInd || '—',
          address: row.Address || row.address || '—',
          city: cityKey ? String(row[cityKey]).trim() : 'Coimbatore',
          website: wKey ? String(row[wKey]).trim() : '—',
          service: sKey ? String(row[sKey]).trim() : 'All Digital Services'
        };
      });

      // Filter empty entries
      const validRows = cleaned.filter(r => r.phone && r.phone.length >= 8);

      // Perform duplicate checks locally
      const existingPhones = new Set(leads.map(l => l.phone));
      const duplicates = validRows.filter(r => existingPhones.has(r.phone));

      setParsedRows(validRows);
      setDuplicateRows(duplicates);
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleWorkerSelection = (name) => {
    setSelWorkers(prev => 
      prev.includes(name) 
        ? prev.filter(w => w !== name) 
        : [...prev, name]
    );
  };

  const handleSplitAndInsert = async () => {
    if (parsedRows.length === 0) {
      showToast('⚠️ No leads parsed! Upload a sheet first.', 'warning');
      return;
    }
    if (selWorkers.length === 0) {
      showToast('⚠️ Select at least one worker for division!', 'warning');
      return;
    }

    // 1. Duplicate Sheet Name Pre-upload Check
    const sheetExists = sheets.some(s => s.name.toLowerCase().trim() === selSheetName.toLowerCase().trim());
    if (sheetExists) {
      if (!window.confirm(`⚠️ A sheet named "${selSheetName}" has already been uploaded previously.\n\nAre you sure you want to upload this sheet again?`)) {
        return;
      }
    }

    // 2. Phone Numbers Duplicate Warn Check
    if (duplicateRows.length > 0) {
      if (!window.confirm(`⚠️ Notice: This sheet contains ${duplicateRows.length} phone numbers that already exist in the CRM database.\n\nDo you want to proceed and insert them anyway?`)) {
        return;
      }
    }

    setIsInserting(true);
    try {
      // Divider logic: Split leads equally among selected workers
      const totalToInsert = parsedRows.length;
      const dividedLeads = parsedRows.map((lead, idx) => {
        const workerName = selWorkers[idx % selWorkers.length];
        return {
          ...lead,
          assigned_to: workerName,
          called: false,
          overall_status: 'New',
          priority: 'Medium',
          no: idx + 1,
          industry: overwriteSector || lead.industry || '—'
        };
      });

      // Insert metadata into sheets register (using uploaded_by to match database structure)
      const sheetRecord = await sPost('sheets', [{
        name: selSheetName,
        total_leads: totalToInsert,
        assigned_to: selWorkers.join(', '),
        uploaded_by: curUser || 'Mathavan'
      }]);

      const sheetId = sheetRecord[0]?.id || 1;
      
      // Attach sheet ID to leads
      const finalLeads = dividedLeads.map(l => ({ ...l, sheet_id: sheetId }));

      // Batch insert leads into database (with schema safety fallback: strip optional columns if DB throws an error)
      try {
        await sPost('leads', finalLeads);
      } catch (err) {
        console.warn("Leads batch insert failed. Attempting safe fallback (stripping address, website, maps_url, social_media, rating)...", err);
        const safeLeads = finalLeads.map(({ address, website, maps_url, social_media, rating, ...rest }) => rest);
        await sPost('leads', safeLeads);
      }
      
      // Activity Log insert
      await sPost('activity_log', [{
        action: 'sheet_uploaded',
        lead_id: null,
        lead_business: selSheetName,
        detail: `Uploaded ${totalToInsert} leads, assigned to: ${selWorkers.join(', ')}`,
        worker_name: curUser || 'Admin',
        created_at: new Date().toISOString()
      }]);

      showToast(`✅ Upload successful! ${totalToInsert} leads successfully assigned.`, 'success');
      setParsedRows([]);
      setDuplicateRows([]);
      setSelSheetName('');
      onSheetUploaded(); // trigger reload in App.jsx
    } catch (e) {
      console.error(e);
      showToast('❌ Error uploading sheets. Verify database table credentials.', 'error');
    } finally {
      setIsInserting(false);
    }
  };

  const executeDeleteSheet = async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    setDeleteConfirm(null); // Close immediately
    setIsInserting(true);
    try {
      // 1. Delete all leads associated with this sheet id
      await sDelQ('leads', `sheet_id=eq.${id}`);
      // 2. Delete sheet record itself
      await sDel('sheets', id);
      // 3. Create activity log
      await sPost('activity_log', [{
        action: 'sheet_deleted',
        lead_id: null,
        lead_business: name,
        detail: `Deleted sheet and all its associated leads`,
        worker_name: curUser || 'Admin',
        created_at: new Date().toISOString()
      }]);
      showToast(`✅ Sheet "${name}" and its leads deleted successfully!`, 'success');
      onSheetUploaded(); // reload DB
    } catch (e) {
      console.error(e);
      showToast('❌ Error deleting sheet.', 'error');
    } finally {
      setIsInserting(false);
    }
  };

  const openEditModal = (sheet) => {
    setEditSheet(sheet);
    setEditSheetName(sheet.name);
    const assigned = sheet.assigned_to
      ? sheet.assigned_to.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    setEditSheetWorkers(assigned);
  };

  const closeEditModal = () => {
    setEditSheet(null);
    setEditSheetName('');
    setEditSheetWorkers([]);
  };

  const toggleEditWorker = (name) => {
    setEditSheetWorkers(prev => 
      prev.includes(name) 
        ? prev.filter(w => w !== name) 
        : [...prev, name]
    );
  };

  const handleUpdateSheet = async () => {
    if (!editSheetName.trim()) {
      showToast('⚠️ Sheet name cannot be empty.', 'error');
      return;
    }
    if (editSheetWorkers.length === 0) {
      showToast('⚠️ Please select at least one worker for allocation.', 'error');
      return;
    }

    setIsUpdatingSheet(true);
    try {
      const sheetId = editSheet.id;

      // 1. Fetch all lead IDs belonging to this sheet_id
      const { data: sheetLeads, error: fetchErr } = await supabase
        .from('leads')
        .select('id')
        .eq('sheet_id', sheetId);

      if (fetchErr) throw fetchErr;

      // 2. Re-allocate leads equally among selected workers
      if (sheetLeads && sheetLeads.length > 0) {
        const promises = [];
        sheetLeads.forEach((lead, idx) => {
          const assignedWorker = editSheetWorkers[idx % editSheetWorkers.length];
          promises.push(
            sPatch('leads', lead.id, { assigned_to: assignedWorker })
          );
        });
        await Promise.all(promises);
      }

      // 3. Update the sheet registry itself (name and new assigned_to)
      await sPatch('sheets', sheetId, {
        name: editSheetName,
        assigned_to: editSheetWorkers.join(', ')
      });

      // Log this admin activity
      await sPost('activity_log', [{
        action: 'sheet_uploaded',
        lead_id: null,
        lead_business: editSheetName,
        detail: `Re-allocated sheet "${editSheetName}" (${sheetLeads?.length || 0} leads) to: ${editSheetWorkers.join(', ')}`,
        worker_name: curUser || 'Admin',
        created_at: new Date().toISOString()
      }]);

      showToast('✅ Sheet and leads updated & re-allocated successfully!', 'success');
      closeEditModal();
      onSheetUploaded();
    } catch (e) {
      console.error(e);
      showToast('❌ Error updating sheet & re-allocating leads.', 'error');
    } finally {
      setIsUpdatingSheet(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-5 fu-anim select-none">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Upload Container Area */}
        <div className="bg-s2 border border-b2 rounded-r p-4 shadow flex flex-col lg:col-span-2">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-b1 pb-3 mb-4 select-none">
            <Upload size={14} className="text-accent" />
            Excel Data Ingestion (Drag-and-Drop)
          </h3>

          {/* Drag area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-rs p-8 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-2.5 ${
              dragActive 
                ? 'border-accent bg-accent/4' 
                : 'border-b1 hover:border-b2 hover:bg-s3/40'
            }`}
            onClick={() => fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-s3 border border-b1 flex items-center justify-center text-mu shadow-sm">
              <Upload size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-tx">Drag & drop your Excel file here, or browse</p>
              <p className="text-[10px] text-mu2 mt-1">Supports standard .xlsx, .xls, and .csv formats</p>
            </div>
          </div>
          {/* Parsed spreadsheet rows check */}
          {parsedRows.length > 0 && (
            <div className="mt-5 fu-anim flex flex-col gap-4">
              <div className="bg-s3 border border-b2 rounded-rs p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText size={13} className="text-a2" />
                    Sheet: <strong>{selSheetName}</strong>
                  </div>
                  <div className="text-[10px] text-mu mt-0.5">
                    Found <strong>{parsedRows.length}</strong> valid rows.
                  </div>
                </div>

                {duplicateRows.length > 0 && (
                  <div className="bg-red/10 border border-red/20 text-red rounded-rs px-3 py-1.5 text-[10px] font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>Warning: {duplicateRows.length} duplicates detected!</span>
                  </div>
                )}
              </div>

              {/* Sector selection dropdown manual override */}
              <div className="bg-s3 border border-b2 rounded-rs p-3.5 flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-mu tracking-wider flex items-center gap-1.5">
                  🎯 Override / Assign Sector for this Sheet:
                </label>
                <select
                  value={overwriteSector}
                  onChange={(e) => setOverwriteSector(e.target.value)}
                  className="bg-bg border border-b2 rounded-rs px-3 py-2 text-xs text-tx outline-none cursor-pointer w-full hover:border-b3"
                >
                  <option value="">🔍 Auto-detect sector from Excel industry column</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind.label} value={ind.label}>
                      {ind.icon} {ind.label}
                    </option>
                  ))}
                </select>
                <p className="text-[9.5px] text-mu2">
                  If selected, all leads inside this spreadsheet will be forced to this sector. If left as auto-detect, the system matches each row's industry.
                </p>
              </div>

              {/* Workers Partition Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] text-mu uppercase font-bold tracking-wider flex items-center gap-1">
                    <Users size={11} className="text-accent" /> Division algorithm allocation:
                  </h4>
                  <div className="flex gap-2 text-[9px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSelWorkers(activeWorkers.map(w => w.name))}
                      className="text-accent hover:text-white cursor-pointer"
                    >
                      ☑️ Select All
                    </button>
                    <span className="text-mu2">|</span>
                    <button
                      type="button"
                      onClick={() => setSelWorkers([])}
                      className="text-mu hover:text-white cursor-pointer"
                    >
                      ⬜ Clear All
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {activeWorkers.map(w => {
                    const isChecked = selWorkers.includes(w.name);
                    return (
                      <button
                        key={w.id}
                        onClick={() => toggleWorkerSelection(w.name)}
                        className={`text-xs font-semibold px-3 py-2 rounded-rs border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-accent/12 border-accent/25 text-a2'
                            : 'bg-transparent border-b2 text-mu hover:text-tx'
                        }`}
                      >
                        {isChecked ? <Check size={12} className="text-green" /> : <Plus size={12} />}
                        <span>👤 {w.name}</span>
                      </button>
                    );
                  })}
                </div>

                {selWorkers.length > 0 && (
                  <p className="text-[10px] text-mu">
                    Allocation split: ~<strong>{Math.round(parsedRows.length / selWorkers.length)}</strong> leads assigned to each of the selected <strong>{selWorkers.length}</strong> agents.
                  </p>
                )}
              </div>

              {/* Duplicate List Preview */}
              {duplicateRows.length > 0 && (
                <div className="bg-red/4 border border-red/10 rounded-rs p-3 flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
                  <span className="text-[9px] uppercase font-bold text-red tracking-wider">Duplicate Phones Registry (Will skip or tag duplicate phone rows):</span>
                  <div className="flex flex-col gap-1 text-[10px] text-mu">
                    {duplicateRows.slice(0, 10).map((r, i) => (
                      <div key={i}>⚠️ {r.business} ({r.phone}) already exists in system database.</div>
                    ))}
                    {duplicateRows.length > 10 && <div>... and {duplicateRows.length - 10} more duplicate leads.</div>}
                  </div>
                </div>
              )}

              {/* Partition insert button */}
              <button
                onClick={handleSplitAndInsert}
                disabled={isInserting || selWorkers.length === 0}
                className="w-full btn primary py-2.5 rounded-rs bg-accent hover:bg-[#5d4fd6] text-white font-bold text-xs flex justify-center items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isInserting ? 'Inserting database rows...' : 'Insert partitioned leads equally'}
              </button>
            </div>
          )}
        </div>

        {/* Sheets registry sidebar */}
        <div className="bg-s2 border border-b2 rounded-r p-4 shadow flex flex-col max-h-[460px] overflow-y-auto">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-b1 pb-3 mb-4 select-none">
            <FileText size={14} className="text-a3" />
            Ingested Sheets Registry
          </h3>

          <div className="flex flex-col gap-3">
            {sheets.length === 0 ? (
              <div className="text-xs text-mu2 py-6 text-center border border-dashed border-b1 rounded-rs">
                No sheets uploaded yet.
              </div>
            ) : (
              sheets.map(sheet => {
                const dateStr = new Date(sheet.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short'
                });
                return (
                  <div 
                    key={sheet.id}
                    className="bg-s3 border border-b1 rounded-rs p-3 flex flex-col gap-1 fu-anim"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-tx truncate max-w-[60%]">📄 {sheet.name}</span>
                      <div className="flex items-center gap-1.5 select-none">
                        <span className="text-[10px] text-mu2 font-medium">{dateStr}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEditModal(sheet);
                          }}
                          type="button"
                          className="p-1 rounded bg-s2 hover:bg-accent/10 border border-b2 hover:border-accent/20 text-mu hover:text-accent transition-all cursor-pointer flex items-center justify-center shrink-0"
                          title="Edit sheet name & re-allocate leads"
                        >
                          <Edit size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirm({ id: sheet.id, name: sheet.name });
                          }}
                          type="button"
                          className="p-1 rounded bg-s2 hover:bg-red/10 border border-b2 hover:border-red/20 text-mu hover:text-red transition-all cursor-pointer flex items-center justify-center shrink-0"
                          title="Delete sheet & all associated leads"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    <div className="text-[10.5px] text-mu flex items-center justify-between mt-1">
                      <span>Assigned: <strong>{sheet.total_leads} leads</strong></span>
                      <span className="text-[9px] font-semibold text-mu2 shrink-0 truncate max-w-[100px] border border-b1 px-1.5 py-0.5 rounded">
                        👤 {sheet.assigned_to}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Glassmorphic Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/75 backdrop-blur-md p-4 fu-anim">
          <div className="bg-s2 border border-b2 rounded-r max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-red">
              <div className="w-9 h-9 rounded-full bg-red/10 border border-red/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-white">Delete Ingested Sheet?</h4>
                <p className="text-[9.5px] text-mu mt-0.5">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="bg-s3 border border-b1 rounded-rs p-3 text-[11px] text-mu leading-relaxed">
              You are about to delete sheet <strong className="text-white">📄 {deleteConfirm.name}</strong>. 
              This will permanently wipe out <strong className="text-white">all leads</strong> assigned to workers from this batch.
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
                onClick={executeDeleteSheet}
                className="px-3.5 py-2 rounded-rs bg-red hover:bg-[#d63031] text-white font-bold cursor-pointer transition-colors"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Edit & Re-allocate Sheet Modal */}
      {editSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/75 backdrop-blur-md p-4 fu-anim">
          <div className="bg-s2 border border-b2 rounded-r max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-accent border-b border-b1 pb-3">
              <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Edit size={16} />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-white">Edit Ingested Sheet</h4>
                <p className="text-[9.5px] text-mu mt-0.5">Rename sheets and re-allocate worker assignments dynamically.</p>
              </div>
            </div>

            {/* Sheet Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Sheet Registry Name</label>
              <input
                type="text"
                value={editSheetName}
                onChange={(e) => setEditSheetName(e.target.value)}
                placeholder="Enter sheet registry name..."
                className="bg-bg border border-b2 rounded-rs px-3 py-2 text-xs text-tx outline-none focus:border-accent"
              />
            </div>

            {/* Workers Reallocation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider mb-1">
                Re-allocate Leads to Agents:
              </label>
              <div className="flex flex-wrap gap-2">
                {activeWorkers.map(w => {
                  const isChecked = editSheetWorkers.includes(w.name);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleEditWorker(w.name)}
                      className={`text-[10.5px] font-semibold px-2.5 py-1.5 rounded-rs border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-accent/12 border-accent/25 text-a2'
                          : 'bg-transparent border-b2 text-mu hover:text-tx'
                      }`}
                    >
                      {isChecked ? <Check size={10} className="text-green" /> : <Plus size={10} />}
                      <span>👤 {w.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-mu2 mt-1 leading-normal">
                Redistributing will re-assign all {editSheet.total_leads} leads inside this sheet equally among the selected agents.
              </p>
            </div>

            <div className="flex justify-end gap-2 text-[10.5px] mt-2 pt-3 border-t border-b1">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isUpdatingSheet}
                className="px-3.5 py-2 rounded-rs bg-s3 border border-b2 text-tx font-semibold hover:bg-s3/80 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateSheet}
                disabled={isUpdatingSheet}
                className="px-4 py-2 rounded-rs bg-accent hover:bg-[#5d4fd6] text-white font-bold cursor-pointer transition-colors shadow-md disabled:opacity-50"
              >
                {isUpdatingSheet ? 'Re-allocating...' : 'Update & Re-allocate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
