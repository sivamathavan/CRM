import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, KeyRound, ShieldCheck, ShieldAlert, 
  UserPlus, Lock, AlertTriangle, Edit, Upload, Briefcase, 
  CreditCard, Landmark, DollarSign, Calendar, MapPin, 
  Phone, Mail, Heart, RefreshCw, UserCheck, Star, Award, Search, Info
} from 'lucide-react';
import { supabase, sPost, sDel, sPatch, sGet } from '../../utils/supabase';

// Utility to parse zoom and vertical offset parameters stored in the photo URL hash fragment
const parsePhotoUrlParams = (url) => {
  if (!url) return { url: '', zoom: 1, offsetY: 50 };
  try {
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) return { url, zoom: 1, offsetY: 50 };
    const baseUrl = url.substring(0, hashIndex);
    const hash = url.substring(hashIndex + 1);
    const params = new URLSearchParams(hash);
    const zoom = parseFloat(params.get('zoom') || '1');
    const offsetY = parseFloat(params.get('y') || '50');
    return { url: baseUrl, zoom, offsetY };
  } catch (_) {
    return { url, zoom: 1, offsetY: 50 };
  }
};

const buildPhotoUrlWithParams = (baseUrl, zoom, offsetY) => {
  if (!baseUrl) return '';
  const cleanUrl = baseUrl.split('#')[0];
  return `${cleanUrl}#zoom=${zoom}&y=${offsetY}`;
};

// Auto-compress high-resolution or large images to JPEG under 2MB on client side
const compressImage = (file, maxDimension = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas compression failed'));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function WorkersMgmt({
  workers,
  onWorkersUpdated,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'add', 'attendance', 'settings'
  
  // Registration State
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPIN, setNewWorkerPIN] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('worker');
  const [isAdding, setIsAdding] = useState(false);

  // Edit worker profile state
  const [editWorker, setEditWorker] = useState(null); // worker object
  const [editWorkerName, setEditWorkerName] = useState('');
  const [editWorkerPIN, setEditWorkerPIN] = useState('');
  const [editWorkerPhoto, setEditWorkerPhoto] = useState('');
  const [editWorkerPhotoZoom, setEditWorkerPhotoZoom] = useState(1);
  const [editWorkerPhotoOffsetY, setEditWorkerPhotoOffsetY] = useState(50);
  const [editWorkerAddress, setEditWorkerAddress] = useState('');
  const [editWorkerMobile, setEditWorkerMobile] = useState('');
  const [editWorkerEmail, setEditWorkerEmail] = useState('');
  const [editWorkerDOB, setEditWorkerDOB] = useState('');
  const [editWorkerGender, setEditWorkerGender] = useState('Male');
  const [editWorkerEmergency, setEditWorkerEmergency] = useState('');
  const [editWorkerWorkType, setEditWorkerWorkType] = useState('Full-time');
  const [editWorkerBankName, setEditWorkerBankName] = useState('');
  const [editWorkerAccountNo, setEditWorkerAccountNo] = useState('');
  const [editWorkerIFSC, setEditWorkerIFSC] = useState('');
  const [editWorkerUPI, setEditWorkerUPI] = useState('');
  const [editWorkerSalary, setEditWorkerSalary] = useState('');
  
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [viewWorker, setViewWorker] = useState(null); // read-only profile details view

  // Attendance Log state
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // Admin settings state
  const [adminNewPIN, setAdminNewPIN] = useState('');
  const [isChangingAdminPIN, setIsChangingAdminPIN] = useState(false);

  const nonAdmin = workers.filter(w => w.role !== 'admin');
  const adminUser = workers.find(w => w.role === 'admin');

  // Trigger attendance fetching on tab switch
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab]);

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const logs = await sGet('attendance', 'select=*&order=date.desc,login_time.desc&limit=1000');
      setAttendanceLogs(logs || []);
    } catch (err) {
      console.error("Error fetching attendance logs:", err);
      showToast('❌ Error loading attendance logs.', 'error');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerName.trim() || !newWorkerPIN.trim()) {
      showToast('⚠️ Name and PIN cannot be blank!', 'warning');
      return;
    }
    if (newWorkerPIN.length < 4) {
      showToast('⚠️ Passkey PIN must be at least 4 characters long!', 'warning');
      return;
    }

    // Auto-generate employee ID RTX-001 based on current workers length
    const workerCount = workers.length;
    const nextNum = String(workerCount + 1).padStart(3, '0');
    const autoEmpID = `RTX-${nextNum}`;

    setIsAdding(true);
    try {
      // Insert new worker row with default HR values
      await sPost('workers', [{
        name: newWorkerName.trim(),
        passkey: newWorkerPIN.trim(),
        role: newWorkerRole,
        employee_id: autoEmpID,
        role_display: 'Telecalling',
        work_type: 'Full-time',
        created_at: new Date().toISOString()
      }]);

      // Audit Log activity
      await sPost('activity_log', [{
        action: 'worker_created',
        lead_id: null,
        lead_business: newWorkerName.trim(),
        detail: `Registered new telecaller agent: ${newWorkerName.trim()} with Employee ID ${autoEmpID}`,
        worker_name: 'Admin',
        created_at: new Date().toISOString()
      }]);

      showToast(`✅ Registered ${newWorkerName.trim()} successfully (ID: ${autoEmpID})!`, 'success');
      setNewWorkerName('');
      setNewWorkerPIN('');
      onWorkersUpdated();
      setActiveTab('directory'); // Switch to Team Directory
    } catch (err) {
      console.error(err);
      showToast('❌ Error creating worker account. Name might already exist.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const executeDeleteWorker = async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    setDeleteConfirm(null); // Close immediately
    try {
      await sDel('workers', id);
      
      await sPost('activity_log', [{
        action: 'worker_deleted',
        lead_id: null,
        lead_business: name,
        detail: 'Terminated agent access account and removed from directory.',
        worker_name: 'Admin',
        created_at: new Date().toISOString()
      }]);

      showToast('✅ Worker account terminated.', 'success');
      onWorkersUpdated();
    } catch (e) {
      console.error(e);
      showToast('❌ Error deleting account.', 'error');
    }
  };

  const handleOpenEditModal = (w) => {
    setEditWorker(w);
    setEditWorkerName(w.name || '');
    setEditWorkerPIN(w.passkey || '');
    const parsed = parsePhotoUrlParams(w.photo_url || '');
    setEditWorkerPhoto(parsed.url);
    setEditWorkerPhotoZoom(parsed.zoom);
    setEditWorkerPhotoOffsetY(parsed.offsetY);
    setEditWorkerAddress(w.address || '');
    setEditWorkerMobile(w.mobile || '');
    setEditWorkerEmail(w.email || '');
    setEditWorkerDOB(w.dob || '');
    setEditWorkerGender(w.gender || 'Male');
    setEditWorkerEmergency(w.emergency_contact || '');
    setEditWorkerWorkType(w.work_type || 'Full-time');
    setEditWorkerBankName(w.bank_name || '');
    setEditWorkerAccountNo(w.account_no || '');
    setEditWorkerIFSC(w.ifsc_code || '');
    setEditWorkerUPI(w.upi_id || '');
    setEditWorkerSalary(w.salary || '');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    let uploadFile = file;

    if (file.size > 2 * 1024 * 1024) {
      showToast('⚡ High-resolution photo detected. Auto-optimizing for upload...', 'info');
      try {
        uploadFile = await compressImage(file);
      } catch (compressErr) {
        console.error("Compression failed:", compressErr);
        showToast('⚠️ Image compression failed. Trying direct upload...', 'warning');
      }
    }

    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `profile_${editWorker.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Support multi-bucket fallback to accommodate user spelling variations (singular, plural, hyphen, space)
      const bucketOptions = ['workers-photos', 'workers photos', 'worker-photos', 'worker photos'];
      let uploadError = null;
      let successfulBucket = null;

      for (const bucketName of bucketOptions) {
        try {
          const { error } = await supabase
            .storage
            .from(bucketName)
            .upload(filePath, uploadFile, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (!error) {
            successfulBucket = bucketName;
            uploadError = null;
            break;
          } else {
            uploadError = error;
          }
        } catch (err) {
          uploadError = err;
        }
      }

      if (uploadError || !successfulBucket) {
        throw uploadError || new Error("No matching bucket found in Supabase");
      }

      // Get public accessible URL
      const { data } = supabase
        .storage
        .from(successfulBucket)
        .getPublicUrl(filePath);

      setEditWorkerPhoto(data.publicUrl);
      showToast('✅ Photo uploaded and ready!', 'success');
    } catch (err) {
      console.error("Storage upload failed:", err);
      const errMsg = err?.message || err?.error_description || "Ensure bucket exists & has public policies.";
      showToast(`❌ Storage upload failed: ${errMsg}`, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveWorkerEdit = async (e) => {
    e.preventDefault();
    if (!editWorker) return;
    if (!editWorkerName.trim() || !editWorkerPIN.trim()) {
      showToast('⚠️ Agent Name and secure PIN cannot be blank!', 'warning');
      return;
    }
    if (editWorkerPIN.length < 4) {
      showToast('⚠️ PIN must be at least 4 digits!', 'warning');
      return;
    }

    setIsSavingEdit(true);
    try {
      const finalPhotoUrl = buildPhotoUrlWithParams(editWorkerPhoto, editWorkerPhotoZoom, editWorkerPhotoOffsetY);

      // 1. Sync all inputs back to Supabase workers table
      await sPatch('workers', editWorker.id, {
        name: editWorkerName.trim(),
        passkey: editWorkerPIN.trim(),
        mobile: editWorkerMobile.trim() || null,
        email: editWorkerEmail.trim() || null,
        dob: editWorkerDOB || null,
        gender: editWorkerGender,
        address: editWorkerAddress.trim() || null,
        emergency_contact: editWorkerEmergency.trim() || null,
        photo_url: finalPhotoUrl.trim() || null,
        work_type: editWorkerWorkType,
        bank_name: editWorkerBankName.trim() || null,
        account_no: editWorkerAccountNo.trim() || null,
        ifsc_code: editWorkerIFSC.trim() || null,
        upi_id: editWorkerUPI.trim() || null,
        salary: editWorkerSalary ? parseFloat(editWorkerSalary) : null
      });

      // 2. Audit Trail logging
      await sPost('activity_log', [{
        action: 'worker_updated',
        lead_id: null,
        lead_business: editWorkerName.trim(),
        detail: `Updated comprehensive HR profile files & details for agent: ${editWorkerName.trim()}`,
        worker_name: 'Admin',
        created_at: new Date().toISOString()
      }]);

      showToast(`✅ Profile details updated for ${editWorkerName.trim()}!`, 'success');
      setEditWorker(null);
      onWorkersUpdated();
    } catch (err) {
      console.error(err);
      showToast('❌ Database update failed.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleChangeAdminPIN = async (e) => {
    e.preventDefault();
    if (!adminNewPIN.trim()) {
      showToast('⚠️ PIN cannot be blank!', 'warning');
      return;
    }
    if (adminNewPIN.length < 4) {
      showToast('⚠️ PIN must be at least 4 digits!', 'warning');
      return;
    }
    if (!adminUser) {
      showToast('❌ Admin user account could not be found!', 'error');
      return;
    }

    setIsChangingAdminPIN(true);
    try {
      await sPatch('workers', adminUser.id, { passkey: adminNewPIN.trim() });
      
      await sPost('activity_log', [{
        action: 'admin_pin_updated',
        lead_id: null,
        lead_business: 'Mathavan',
        detail: 'Updated secure passkey PIN credential for CRM administrator',
        worker_name: 'Admin',
        created_at: new Date().toISOString()
      }]);

      showToast('✅ Admin secure passkey PIN updated successfully!', 'success');
      setAdminNewPIN('');
      onWorkersUpdated();
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to update admin PIN.', 'error');
    } finally {
      setIsChangingAdminPIN(false);
    }
  };

  // Filter attendance logs by search query
  const filteredAttendance = attendanceLogs.filter(log => 
    log.worker_name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
    log.status.toLowerCase().includes(attendanceSearch.toLowerCase())
  );

  return (
    <div className="p-4 flex flex-col gap-4 fu-anim select-none w-full">
      
      {/* ── METRIC TILES HEADER ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 select-none">
        <div className="bg-s2 border border-b2 rounded-r p-3.5 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[10px] text-mu font-semibold uppercase tracking-wider">Telecalling Agents</div>
            <div className="text-xl font-bold text-white mt-0.5">{nonAdmin.length} Active</div>
          </div>
        </div>

        <div className="bg-s2 border border-b2 rounded-r p-3.5 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green/15 flex items-center justify-center text-green">
            <Briefcase size={20} />
          </div>
          <div>
            <div className="text-[10px] text-mu font-semibold uppercase tracking-wider">Full-time Staff</div>
            <div className="text-xl font-bold text-white mt-0.5">{nonAdmin.filter(w=>w.work_type==='Full-time').length} Members</div>
          </div>
        </div>

        <div className="bg-s2 border border-b2 rounded-r p-3.5 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-a2/15 flex items-center justify-center text-a2">
            <Award size={20} />
          </div>
          <div>
            <div className="text-[10px] text-mu font-semibold uppercase tracking-wider">Top Dialers</div>
            <div className="text-xl font-bold text-white mt-0.5">Highly Productive</div>
          </div>
        </div>

        <div className="bg-s2 border border-b2 rounded-r p-3.5 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber/15 flex items-center justify-center text-amber">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[10px] text-mu font-semibold uppercase tracking-wider">Payroll Status</div>
            <div className="text-xl font-bold text-white mt-0.5">Configured</div>
          </div>
        </div>
      </div>

      {/* ── MAIN TAB CONTROL ROW ── */}
      <div className="flex border-b border-b2 pb-1 gap-1 select-none overflow-x-auto whitespace-nowrap scrollbar-none scrollbar-width-none flex-nowrap">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'directory' 
              ? 'border-accent text-white bg-accent/8 rounded-t' 
              : 'border-transparent text-mu hover:text-tx hover:bg-s2/50 rounded-t'
          }`}
        >
          <Users size={13} />
          <span>👥 Team Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'add' 
              ? 'border-accent text-white bg-accent/8 rounded-t' 
              : 'border-transparent text-mu hover:text-tx hover:bg-s2/50 rounded-t'
          }`}
        >
          <UserPlus size={13} />
          <span>➕ Register Agent</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'attendance' 
              ? 'border-accent text-white bg-accent/8 rounded-t' 
              : 'border-transparent text-mu hover:text-tx hover:bg-s2/50 rounded-t'
          }`}
        >
          <Calendar size={13} />
          <span>📅 Attendance & Tracking</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'settings' 
              ? 'border-accent text-white bg-accent/8 rounded-t' 
              : 'border-transparent text-mu hover:text-tx hover:bg-s2/50 rounded-t'
          }`}
        >
          <Lock size={13} />
          <span>🔐 Admin Settings</span>
        </button>
      </div>

      {/* ── TAB CONTENT: 👥 TEAM DIRECTORY ── */}
      {activeTab === 'directory' && (
        <div className="bg-s2 border border-b2 rounded-r p-4 shadow-md flex flex-col fu-anim">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-b1 pb-3 mb-4 select-none">
            <Users size={14} className="text-a3" />
            Registered Staff & Agent Directory
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonAdmin.length === 0 ? (
              <div className="text-xs text-mu2 py-10 text-center col-span-full border border-dashed border-b1 rounded-rs">
                No active workers registered. Tap "Register Agent" above to add new members.
              </div>
            ) : (
              nonAdmin.map(w => {
                const photoUrl = w.photo_url || '';
                const address = w.address || '';
                const mobile = w.mobile || '';
                const email = w.email || '';
                const employeeId = w.employee_id || 'RTX-TBD';
                const workType = w.work_type || 'Full-time';

                return (
                  <div 
                    key={w.id}
                    onClick={() => setViewWorker(w)}
                    className="bg-s3 border border-b1 rounded-rs p-3 flex flex-col gap-3 relative hover:border-accent/40 transition-all shadow hover:shadow-lg group cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {photoUrl ? (
                        (() => {
                          const parsed = parsePhotoUrlParams(photoUrl);
                          return (
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-b2 shrink-0 shadow-md">
                              <img 
                                src={parsed.url} 
                                alt={w.name}
                                style={{
                                  transform: `scale(${parsed.zoom})`,
                                  transformOrigin: 'center',
                                  objectPosition: `center ${parsed.offsetY}%`
                                }}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.parentNode.style.display = 'none';
                                  e.target.parentNode.nextSibling.style.display = 'flex';
                                }}
                              />
                            </div>
                          );
                        })()
                      ) : null}
                      <div 
                        className="w-12 h-12 rounded-full bg-accent/12 flex items-center justify-center text-a2 font-display text-sm font-bold shrink-0 border border-b2"
                        style={{ display: photoUrl ? 'none' : 'flex' }}
                      >
                        {w.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white leading-normal truncate block">{w.name}</span>
                          <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                            workType === 'Full-time' ? 'bg-green/10 text-green border border-green/20' : 'bg-amber/10 text-amber border border-amber/20'
                          }`}>
                            {workType}
                          </span>
                        </div>
                        <div className="text-[9.5px] text-mu font-semibold mt-0.5">ID: {employeeId}</div>
                        <div className="text-[9.5px] text-accent/80 font-bold">Telecalling Agent</div>
                      </div>
                    </div>

                    {/* Detailed info snippet lines */}
                    <div className="flex flex-col gap-1.5 border-t border-b1/40 pt-2 text-[10.5px]">
                      <div className="flex items-center gap-2 truncate text-mu">
                        <Phone size={11} className="text-accent/80 shrink-0" />
                        <span className="text-tx/85 truncate">{mobile || 'Mobile: —'}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate text-mu">
                        <Mail size={11} className="text-accent/80 shrink-0" />
                        <span className="text-tx/85 truncate">{email || 'Email: —'}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate text-mu">
                        <MapPin size={11} className="text-accent/80 shrink-0" />
                        <span className="text-tx/85 truncate">{address || 'Address: —'}</span>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="flex border-t border-b1/50 pt-2 gap-2 select-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(w);
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 bg-s2 hover:bg-s1 text-tx rounded border border-b2 cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Edit size={10} />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteConfirm({ id: w.id, name: w.name });
                        }}
                        className="text-[10px] font-semibold px-2.5 py-1 bg-red/10 border border-red/20 text-red hover:bg-red/25 rounded cursor-pointer transition-all flex items-center gap-1 ml-auto"
                      >
                        <Trash2 size={10} />
                        <span>Terminate</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: ➕ REGISTER AGENT ── */}
      {activeTab === 'add' && (
        <div className="bg-s2 border border-b2 rounded-r p-5 shadow-md max-w-md w-full mx-auto fu-anim">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-b1 pb-3 mb-4 select-none">
            <UserPlus size={14} className="text-accent" />
            Register Telecaller Agent Account
          </h3>

          <form onSubmit={handleAddWorker} className="flex flex-col gap-4">
            <div className="bg-s3 border border-b1 rounded-rs p-3 flex items-start gap-2.5 select-none">
              <Info size={14} className="text-accent shrink-0 mt-0.5" />
              <div className="text-[10px] text-mu leading-normal">
                An Employee ID will be generated **automatically** (e.g. `RTX-${String(workers.length + 1).padStart(3, '0')}`) upon creation. Additional fields (salary, banking, address, etc.) can be configured via **Edit Profile** in the Team Directory.
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Preview Next ID</label>
              <input
                type="text"
                disabled
                value={`RTX-${String(workers.length + 1).padStart(3, '0')}`}
                className="bg-s3 border border-b1 rounded-rs px-3 py-2 text-xs text-mu outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Agent Full Name</label>
              <input
                type="text"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                placeholder="e.g. Sivasankar Paartha"
                required
                className="bg-bg border border-b2 rounded-rs px-3 py-2 text-xs text-tx outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Secure Passkey PIN</label>
              <input
                type="text"
                value={newWorkerPIN}
                onChange={(e) => setNewWorkerPIN(e.target.value)}
                placeholder="e.g. 1234 (Numeric Access PIN)"
                maxLength={10}
                required
                className="bg-bg border border-b2 rounded-rs px-3 py-2 text-xs text-tx outline-none focus:border-accent font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="btn primary py-2.5 rounded-rs bg-accent hover:bg-[#5d4fd6] text-white font-bold text-xs flex justify-center items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50 mt-1"
            >
              <Plus size={13} />
              <span>{isAdding ? 'Creating account...' : 'Create Account & Auto-generate ID'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── TAB CONTENT: 📅 ATTENDANCE & PERFORMANCE LOG ── */}
      {activeTab === 'attendance' && (
        <div className="bg-s2 border border-b2 rounded-r p-4 shadow-md flex flex-col fu-anim select-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-b1 pb-3 mb-4">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 select-none">
              <Calendar size={14} className="text-a3" />
              Agent Daily Attendance & Tracking Register
            </h3>

            {/* Attendance Search Bar */}
            <div className="relative w-full sm:w-60">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mu" />
              <input
                type="text"
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                placeholder="Search agent or status..."
                className="w-full bg-bg border border-b2 rounded px-3 py-1.5 pl-8 text-xs text-tx outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {loadingAttendance ? (
              <div className="text-xs text-mu py-16 text-center flex flex-col items-center gap-2">
                <RefreshCw size={24} className="animate-spin text-accent" />
                <span>Loading daily attendance sheets...</span>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="text-xs text-mu2 py-12 text-center border border-dashed border-b1 rounded-rs">
                No attendance entries matched today. Logs are created when agents log in.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-b1 text-mu2 font-bold uppercase text-[9px] tracking-wider select-none bg-s3/40">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Agent Name</th>
                    <th className="py-2.5 px-3">Login Time</th>
                    <th className="py-2.5 px-3">Logout Time</th>
                    <th className="py-2.5 px-3">Hours Worked</th>
                    <th className="py-2.5 px-3">Calls Done</th>
                    <th className="py-2.5 px-3 text-center">Performance Rating</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-b1/40">
                  {filteredAttendance.map(log => {
                    const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                    });
                    const loginTime = log.login_time ? new Date(log.login_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
                    const logoutTime = log.logout_time ? new Date(log.logout_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
                    
                    // Task calculation & ratings
                    const calls = log.task_completion || 0;
                    let ratingStars = 1;
                    if (calls > 15) ratingStars = 5;
                    else if (calls > 10) ratingStars = 4;
                    else if (calls > 5) ratingStars = 3;
                    else if (calls > 0) ratingStars = 2;

                    return (
                      <tr key={log.id} className="hover:bg-s3/20 transition-all font-medium text-tx">
                        <td className="py-2.5 px-3 text-mu font-bold font-mono">{formattedDate}</td>
                        <td className="py-2.5 px-3 text-white font-bold">👤 {log.worker_name}</td>
                        <td className="py-2.5 px-3 text-mu font-mono">{loginTime}</td>
                        <td className="py-2.5 px-3 text-mu font-mono">{logoutTime}</td>
                        <td className="py-2.5 px-3">
                          {log.work_hours ? (
                            <span className="font-mono text-green font-bold">{parseFloat(log.work_hours).toFixed(1)} hrs</span>
                          ) : log.login_time && !log.logout_time ? (
                            <span className="text-[10px] bg-green/10 text-green border border-green/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">Active Session</span>
                          ) : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-bold">{calls} calls</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-0.5 text-amber">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                size={10} 
                                fill={i < ratingStars ? "currentColor" : "none"} 
                                strokeWidth={2}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center select-none">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            log.status === 'Present' ? 'bg-green/15 text-green border border-green/30' :
                            log.status === 'Half-day' ? 'bg-amber/15 text-amber border border-amber/30' :
                            'bg-red/15 text-red border border-red/30'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: 🔐 ADMIN SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl w-full mx-auto fu-anim select-none">
          
          {/* Admin profile detail display */}
          <div className="bg-s2 border border-b2 rounded-r p-4 shadow flex flex-col h-fit">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-b1 pb-3 mb-4">
              <ShieldAlert size={14} className="text-a3" />
              Administrator Identity Card
            </h3>

            <div className="flex items-center gap-4 bg-s3 border border-b1 rounded-rs p-4 select-none">
              <div className="w-14 h-14 rounded-full bg-a3/15 border-2 border-a3 flex items-center justify-center text-a3 font-display font-extrabold text-lg">
                M
              </div>
              <div>
                <div className="font-display font-extrabold text-base text-white">Mathavan</div>
                <div className="text-[10px] text-mu uppercase tracking-wider font-semibold mt-0.5">Primary System Owner</div>
                <span className="badge-admin mt-2 inline-block">FULL ROOT ACCESS</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 text-xs text-mu">
              <div className="flex justify-between border-b border-b1/40 pb-2">
                <span className="font-semibold text-mu2">System Role:</span>
                <span className="font-bold text-white">Administrator</span>
              </div>
              <div className="flex justify-between border-b border-b1/40 pb-2">
                <span className="font-semibold text-mu2">Access Level:</span>
                <span className="font-mono text-green font-bold">ALL MODULES (Audit, Logs, HR, CRM)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-mu2">Passkey Credentials:</span>
                <span className="font-mono text-white tracking-[0.15em] font-bold">••••</span>
              </div>
            </div>
          </div>

          {/* Change passkey credentials form */}
          <div className="bg-s2 border border-b2 rounded-r p-4 shadow flex flex-col h-fit">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-b1 pb-3 mb-4">
              <KeyRound size={14} className="text-accent" />
              Change Mathavan Passkey PIN
            </h3>

            <form onSubmit={handleChangeAdminPIN} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">New Numeric Passkey PIN</label>
                <input
                  type="text"
                  value={adminNewPIN}
                  onChange={(e) => setAdminNewPIN(e.target.value)}
                  placeholder="e.g. 9988"
                  maxLength={10}
                  required
                  className="bg-bg border border-b2 rounded-rs px-3 py-2 text-sm text-tx tracking-[0.2em] font-mono text-center outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingAdminPIN || !adminNewPIN.trim()}
                className="btn primary py-2.5 rounded-rs bg-accent hover:bg-[#5d4fd6] text-white font-bold text-xs flex justify-center items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <KeyRound size={13} />
                <span>{isChangingAdminPIN ? 'Updating Credentials...' : 'Save New Passkey PIN'}</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ── EDIT PROFILE POPUP OVERLAY ── */}
      {editWorker && (
        <div className="fixed inset-0 z-[400] bg-bg/85 flex items-center justify-center p-4 backdrop-blur-sm select-none overflow-y-auto">
          <div className="bg-s2 border border-b2 rounded-r p-5 w-full max-w-2xl shadow-2xl fu-anim flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-b1 pb-3 select-none">
              <Edit size={14} className="text-accent" />
              Edit Complete Agent Profile: {editWorker.name}
            </h3>

            <form onSubmit={handleSaveWorkerEdit} className="flex flex-col gap-4">
              
              {/* Profile Photo Uploader Section */}
              <div className="bg-s3 border border-b1 rounded-rs p-4 flex flex-col gap-4 select-none">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                  <div className="relative shrink-0">
                    {editWorkerPhoto ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent/40 shadow shrink-0">
                        <img 
                          src={editWorkerPhoto} 
                          alt="Uploader preview" 
                          style={{
                            transform: `scale(${editWorkerPhotoZoom})`,
                            transformOrigin: 'center',
                            objectPosition: `center ${editWorkerPhotoOffsetY}%`
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-accent/12 border-2 border-dashed border-accent/35 flex flex-col items-center justify-center text-accent shrink-0 select-none gap-0.5">
                        <Users size={16} className="text-accent/80 shrink-0" />
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wide leading-none">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5 text-center sm:text-left">
                    <div className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Agent Profile Picture</div>
                    <div className="text-[9.5px] text-mu leading-normal">
                      Select a JPG or PNG picture (Max 2MB). The photo will upload directly into your Supabase Storage Bucket.
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1.5 justify-center sm:justify-start">
                      <label className="text-[10px] font-bold px-3 py-1.5 rounded-rs bg-accent hover:bg-[#5d4fd6] text-white flex items-center gap-1 cursor-pointer transition-all shadow select-none">
                        <Upload size={10} />
                        <span>{uploadingPhoto ? 'Uploading...' : 'Upload File'}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                          className="hidden" 
                        />
                      </label>
                      
                      {editWorkerPhoto && (
                        <button
                          type="button"
                          onClick={() => setEditWorkerPhoto('')}
                          className="text-[9.5px] font-bold px-2.5 py-1.5 rounded bg-s2 border border-b2 text-red hover:bg-s3 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Adjustment Sliders for Cropping and Fitting */}
                {editWorkerPhoto && (
                  <div className="flex flex-col gap-2 p-3 bg-s2/30 border border-b1/40 rounded-rs w-full mt-1">
                    <div className="text-[9.5px] font-bold text-accent uppercase tracking-wider mb-1 flex items-center gap-1">
                      🎨 Crop & Fit Adjustments (Live Preview)
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Zoom Slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] font-bold text-mu2">
                          <span>🔍 ZOOM SCALE</span>
                          <span className="text-tx/90 font-mono">{editWorkerPhotoZoom.toFixed(2)}x</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="3"
                          step="0.05"
                          value={editWorkerPhotoZoom}
                          onChange={(e) => setEditWorkerPhotoZoom(parseFloat(e.target.value))}
                          className="w-full accent-accent h-1 bg-bg border border-b2 rounded-lg appearance-none cursor-pointer outline-none"
                        />
                      </div>

                      {/* Y-Offset Slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] font-bold text-mu2">
                          <span>↕️ VERTICAL POSITION (PAN Y)</span>
                          <span className="text-tx/90 font-mono">{editWorkerPhotoOffsetY}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={editWorkerPhotoOffsetY}
                          onChange={(e) => setEditWorkerPhotoOffsetY(parseInt(e.target.value))}
                          className="w-full accent-accent h-1 bg-bg border border-b2 rounded-lg appearance-none cursor-pointer outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Group 1: Personal Details */}
              <div className="border border-b1/60 rounded-rs p-3 bg-s3/30">
                <h4 className="text-[10px] font-bold text-a2 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Users size={11} /> Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Full Name</label>
                    <input
                      type="text"
                      value={editWorkerName}
                      onChange={(e) => setEditWorkerName(e.target.value)}
                      required
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Mobile Number</label>
                    <input
                      type="tel"
                      value={editWorkerMobile}
                      onChange={(e) => setEditWorkerMobile(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Email Address</label>
                    <input
                      type="email"
                      value={editWorkerEmail}
                      onChange={(e) => setEditWorkerEmail(e.target.value)}
                      placeholder="e.g. worker@example.com"
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Date of Birth</label>
                    <input
                      type="date"
                      value={editWorkerDOB}
                      onChange={(e) => setEditWorkerDOB(e.target.value)}
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Gender</label>
                    <select
                      value={editWorkerGender}
                      onChange={(e) => setEditWorkerGender(e.target.value)}
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Emergency Contact No</label>
                    <input
                      type="tel"
                      value={editWorkerEmergency}
                      onChange={(e) => setEditWorkerEmergency(e.target.value)}
                      placeholder="Family contact number"
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-3">
                  <label className="text-[9px] uppercase font-bold text-mu2">Physical Address</label>
                  <input
                    type="text"
                    value={editWorkerAddress}
                    onChange={(e) => setEditWorkerAddress(e.target.value)}
                    placeholder="e.g. Town Hall Road, Coimbatore, Tamil Nadu"
                    className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Group 2: Employment & Security */}
              <div className="border border-b1/60 rounded-rs p-3 bg-s3/30">
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Briefcase size={11} /> Employment & Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Employee ID</label>
                    <input
                      type="text"
                      disabled
                      value={editWorker.employee_id || 'RTX-001'}
                      className="bg-s3 border border-b1 rounded-rs px-2.5 py-1.5 text-xs text-mu outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">CRM Work Role</label>
                    <input
                      type="text"
                      disabled
                      value="Telecalling Agent"
                      className="bg-s3 border border-b1 rounded-rs px-2.5 py-1.5 text-xs text-mu outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Work Type</label>
                    <select
                      value={editWorkerWorkType}
                      onChange={(e) => setEditWorkerWorkType(e.target.value)}
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none cursor-pointer"
                    >
                      <option value="Full-time">Full-time Staff</option>
                      <option value="Part-time">Part-time Staff</option>
                      <option value="Intern">Internship</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Secure Passkey PIN</label>
                    <input
                      type="text"
                      value={editWorkerPIN}
                      onChange={(e) => setEditWorkerPIN(e.target.value)}
                      placeholder="Access Code"
                      maxLength={10}
                      required
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent font-mono text-center tracking-widest"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Banking & Salary Details */}
              <div className="border border-b1/60 rounded-rs p-3 bg-s3/30">
                <h4 className="text-[10px] font-bold text-green uppercase tracking-wider mb-3 flex items-center gap-1">
                  <CreditCard size={11} /> Banking & Salary Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="flex flex-col gap-1 sm:col-span-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Salary Amount</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mu text-[10px] font-bold">₹</span>
                      <input
                        type="number"
                        value={editWorkerSalary}
                        onChange={(e) => setEditWorkerSalary(e.target.value)}
                        placeholder="22000"
                        className="w-full bg-bg border border-b2 rounded-rs px-2.5 py-1.5 pl-6 text-xs text-tx outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Bank Name</label>
                    <input
                      type="text"
                      value={editWorkerBankName}
                      onChange={(e) => setEditWorkerBankName(e.target.value)}
                      placeholder="SBI, HDFC..."
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Account Number</label>
                    <input
                      type="text"
                      value={editWorkerAccountNo}
                      onChange={(e) => setEditWorkerAccountNo(e.target.value)}
                      placeholder="1234567890"
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={editWorkerIFSC}
                      onChange={(e) => setEditWorkerIFSC(e.target.value)}
                      placeholder="SBIN0001234"
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent font-mono uppercase"
                    />
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-1">
                    <label className="text-[9px] uppercase font-bold text-mu2">UPI ID</label>
                    <input
                      type="text"
                      value={editWorkerUPI}
                      onChange={(e) => setEditWorkerUPI(e.target.value)}
                      placeholder="e.g. name@okhdfc"
                      className="bg-bg border border-b2 rounded-rs px-2.5 py-1.5 text-xs text-tx outline-none focus:border-accent font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex gap-2.5 justify-end mt-2 select-none">
                <button
                  type="button"
                  onClick={() => setEditWorker(null)}
                  className="btn border border-b2 bg-s3 text-tx hover:bg-s3/80 text-xs px-4 py-2 rounded-rs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || uploadingPhoto}
                  className="btn primary bg-accent hover:bg-[#5d4fd6] text-white text-xs px-5 py-2 rounded-rs cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1"
                >
                  <span>{isSavingEdit ? 'Saving Details...' : 'Save Agent Profile'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Glassmorphic Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/75 backdrop-blur-md p-4 fu-anim">
          <div className="bg-s2 border border-b2 rounded-r max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-red">
              <div className="w-9 h-9 rounded-full bg-red/10 border border-red/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-white">Terminate Agent Access?</h4>
                <p className="text-[9.5px] text-mu mt-0.5">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="bg-s3 border border-b1 rounded-rs p-3 text-[11px] text-mu leading-relaxed">
              You are about to delete worker account <strong className="text-white">👤 {deleteConfirm.name}</strong>. 
              This will permanently revoke all access credentials immediately.
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
                onClick={executeDeleteWorker}
                className="px-3.5 py-2 rounded-rs bg-red hover:bg-[#d63031] text-white font-bold cursor-pointer transition-colors"
              >
                Terminate Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW PROFILE POPUP OVERLAY (VIEW ONLY) ── */}
      {viewWorker && (
        <div className="fixed inset-0 z-[400] bg-bg/85 flex items-center justify-center p-4 backdrop-blur-sm select-none overflow-y-auto">
          <div className="bg-s2 border border-b2 rounded-r p-6 w-full max-w-2xl shadow-2xl fu-anim flex flex-col gap-5 max-h-[90vh] overflow-y-auto relative">
            
            {/* Absolute close button */}
            <button 
              onClick={() => setViewWorker(null)}
              className="absolute top-4 right-4 text-mu hover:text-white cursor-pointer transition-colors text-lg"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-b1 pb-4">
              <div className="relative shrink-0">
                {viewWorker.photo_url ? (
                  (() => {
                    const parsed = parsePhotoUrlParams(viewWorker.photo_url);
                    return (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent/40 shadow-md">
                        <img 
                          src={parsed.url} 
                          alt={viewWorker.name} 
                          style={{
                            transform: `scale(${parsed.zoom})`,
                            transformOrigin: 'center',
                            objectPosition: `center ${parsed.offsetY}%`
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-16 h-16 rounded-full bg-accent/12 border-2 border-b2 flex items-center justify-center text-a2 font-display text-lg font-bold">
                    {viewWorker.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-white leading-normal truncate m-0">{viewWorker.name}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider w-fit mx-auto sm:mx-0 ${
                    (viewWorker.work_type || 'Full-time') === 'Full-time' 
                      ? 'bg-green/10 text-green border border-green/20' 
                      : 'bg-amber/10 text-amber border border-amber/20'
                  }`}>
                    {viewWorker.work_type || 'Full-time'}
                  </span>
                </div>
                <p className="text-xs text-mu mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <Briefcase size={12} className="text-accent" />
                  <span>Telecalling Agent · ID: <strong className="font-mono text-white">{viewWorker.employee_id || 'RTX-TBD'}</strong></span>
                </p>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div className="flex flex-col gap-4">
              
              {/* Section 1: Personal Profile */}
              <div className="border border-b1/60 rounded-rs p-4 bg-s3/30">
                <h4 className="text-[10px] font-bold text-a2 uppercase tracking-wider mb-3.5 flex items-center gap-1.5 border-b border-b1 pb-1.5">
                  <Users size={12} /> Personal Profile Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-mu2">Mobile Number</span>
                    <span className="text-xs text-tx font-medium flex items-center gap-1.5">
                      <Phone size={11} className="text-mu shrink-0" />
                      {viewWorker.mobile || '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-mu2">Email Address</span>
                    <span className="text-xs text-tx font-medium flex items-center gap-1.5 truncate">
                      <Mail size={11} className="text-mu shrink-0" />
                      <span className="truncate">{viewWorker.email || '—'}</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-mu2">Date of Birth</span>
                    <span className="text-xs text-tx font-medium flex items-center gap-1.5">
                      <Calendar size={11} className="text-mu shrink-0" />
                      {viewWorker.dob ? new Date(viewWorker.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-mu2">Gender</span>
                    <span className="text-xs text-tx font-medium">
                      👤 {viewWorker.gender || 'Male'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <span className="text-[9px] uppercase font-bold text-mu2">Emergency Contact</span>
                    <span className="text-xs text-tx font-medium flex items-center gap-1.5">
                      <Heart size={11} className="text-red shrink-0" />
                      {viewWorker.emergency_contact || '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-[9px] uppercase font-bold text-mu2">Physical Address</span>
                    <span className="text-xs text-tx font-medium flex items-center gap-1.5">
                      <MapPin size={11} className="text-mu shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{viewWorker.address || '—'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Banking & Payroll Information */}
              <div className="border border-b1/60 rounded-rs p-4 bg-s3/30">
                <h4 className="text-[10px] font-bold text-green uppercase tracking-wider mb-3.5 flex items-center gap-1.5 border-b border-b1 pb-1.5">
                  <CreditCard size={12} /> Banking & Payroll Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-mu2">Salary Amount</span>
                    <span className="text-xs text-green font-bold flex items-center gap-1">
                      <DollarSign size={11} className="shrink-0" />
                      ₹{viewWorker.salary ? parseFloat(viewWorker.salary).toLocaleString('en-IN') : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-mu2">Bank Name</span>
                    <span className="text-xs text-tx font-medium flex items-center gap-1.5">
                      <Landmark size={11} className="text-mu shrink-0" />
                      {viewWorker.bank_name || '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-mu2">Account Number</span>
                    <span className="text-xs text-tx font-medium font-mono">
                      {viewWorker.account_no || '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-mu2">IFSC Code</span>
                    <span className="text-xs text-tx font-bold font-mono uppercase">
                      {viewWorker.ifsc_code || '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <span className="text-[9px] uppercase font-bold text-mu2">UPI ID</span>
                    <span className="text-xs text-tx font-medium font-mono text-accent">
                      {viewWorker.upi_id || '—'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end select-none border-t border-b1/40 pt-3.5">
              <button
                type="button"
                onClick={() => setViewWorker(null)}
                className="btn primary bg-accent hover:bg-[#5d4fd6] text-white text-xs px-5 py-2 rounded-rs cursor-pointer shadow-md"
              >
                Done / Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
