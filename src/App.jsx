import React, { useState, useEffect } from 'react';
import Splash from './components/Splash';
import Topbar from './components/Topbar';
import CRMPanel from './components/crm/CRMPanel';
import AdminPanel from './components/admin/AdminPanel';
import { sGet, sPost, sPatch, sDel } from './utils/supabase';
import { buildHTML, getSubject } from './utils/templates';
import { ArrowRight } from 'lucide-react';

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

export default function App() {
  const [curUser, setCurUser] = useState(() => localStorage.getItem('curUser') || '');
  const [curRole, setCurRole] = useState(() => localStorage.getItem('curRole') || ''); // 'admin' or 'worker'
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Custom Toast state
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Database States
  const [workers, setWorkers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [activities, setActivities] = useState([]);

  // UI Navigation States
  const [activeView, setActiveView] = useState('crm'); // 'crm' or 'admin'
  const [curLead, setCurLead] = useState(null);
  const [sortVal, setSortVal] = useState('uncalled');
  const [appLoading, setAppLoading] = useState(true);

  // Gmail OAuth States
  const [gmailToken, setGmailToken] = useState(null);
  const [gmailEmail, setGmailEmail] = useState(null);

  // 1. SESSION RESTORATION Lifecycle
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('curUser');
      const savedRole = localStorage.getItem('curRole');
      
      // Pre-fetch workers list for Splash screen
      try {
        const fetchedWorkers = await sGet('workers', 'select=*&order=id.desc');
        setWorkers(fetchedWorkers || []);
      } catch (err) {
        console.error("Failed to load workers from Supabase: ", err);
      }

      if (savedUser && savedRole) {
        setActiveView(savedRole === 'admin' ? 'admin' : 'crm');
        await loadAllData(savedUser, savedRole);
      }
      setAppLoading(false);
    };

    restoreSession();
  }, []);

  // 1.5 Background Auto-Sync Polling (every 20 seconds for admin, every 40 seconds for workers)
  useEffect(() => {
    if (!curUser) return;

    const interval = setInterval(() => {
      loadAllData(curUser, curRole).catch(err => {
        console.error("Auto-sync background reload failed:", err);
      });
    }, curRole === 'admin' ? 20000 : 40000);

    return () => clearInterval(interval);
  }, [curUser, curRole]);

  // 2. SUPABASE REFRESH ENGINE
  const loadAllData = async (user = curUser, role = curRole) => {
    if (!user) return;
    try {
      // Re-fetch workers list
      const fetchedWorkers = await sGet('workers', 'select=*&order=id.desc');
      setWorkers(fetchedWorkers || []);

      if (role === 'admin') {
        const [fetchedLeads, fetchedSheets, fetchedLogs, fetchedActs] = await Promise.all([
          sGet('leads', 'select=*&limit=5000&order=id.desc'),
          sGet('sheets', 'select=*&order=id.desc'),
          sGet('call_logs', 'select=*&limit=5000&order=id.desc'),
          sGet('activity_log', 'select=*&limit=300&order=id.desc')
        ]);
        setLeads(fetchedLeads || []);
        setSheets(fetchedSheets || []);
        setCallLogs(fetchedLogs || []);
        setActivities(fetchedActs || []);
      } else {
        // Worker only loads their assigned leads
        const [fetchedLeads, fetchedSheets, fetchedLogs] = await Promise.all([
          sGet('leads', `select=*&assigned_to=eq.${encodeURIComponent(user)}&limit=2000&order=id.desc`),
          sGet('sheets', 'select=*&order=id.desc'),
          sGet('call_logs', `called_by=eq.${encodeURIComponent(user)}&limit=1500&order=id.desc`)
        ]);
        setLeads(fetchedLeads || []);
        setSheets(fetchedSheets || []);
        setCallLogs(fetchedLogs || []);
      }
    } catch (e) {
      console.error("Supabase load error: ", e);
    }
  };

  // Login handler
  const handleLoginSuccess = async (name, role) => {
    localStorage.setItem('curUser', name);
    localStorage.setItem('curRole', role);
    setCurUser(name);
    setCurRole(role);
    setActiveView(role === 'admin' ? 'admin' : 'crm');
    setCurLead(null);
    setShowWelcomeModal(true);
    await loadAllData(name, role);
  };

  // Logout handler
  const handleLogout = async () => {
    if (curRole === 'worker' && curUser) {
      try {
        const workerObj = workers.find(w => w.name === curUser);
        if (workerObj) {
          const today = new Date().toISOString().split('T')[0];
          const records = await sGet('attendance', `worker_id=eq.${workerObj.id}&date=eq.${today}`);
          if (records && records.length > 0) {
            const record = records[0];
            const loginTime = new Date(record.login_time);
            const logoutTime = new Date();
            const hours = parseFloat(Math.max(0, (logoutTime - loginTime) / (1000 * 60 * 60)).toFixed(2));
            
            await sPatch('attendance', record.id, {
              logout_time: logoutTime.toISOString(),
              work_hours: hours
            });
          }
        }
      } catch (err) {
        console.error("Attendance logout logging failed:", err);
      }
    }

    localStorage.removeItem('curUser');
    localStorage.removeItem('curRole');
    setCurUser('');
    setCurRole('');
    setLeads([]);
    setCallLogs([]);
    setCurLead(null);
    setGmailToken(null);
    setGmailEmail(null);
  };

  // 3. TELEPHONE OUTCOME LOGGER
  const handleLogCall = async ({
    leadId, outcome, notes, followupDate, followupTime, dealValue, duration
  }) => {
    const targetLead = leads.find(x => x.id === leadId);
    if (!targetLead) return;

    try {
      // a. Insert new row into call_logs
      await sPost('call_logs', [{
        lead_id: leadId,
        called_by: curUser,
        call_outcome: outcome,
        notes: notes || '',
        called_at: new Date().toISOString(),
        duration_mins: duration || null,
        deal_value: dealValue || null,
        follow_up_date: followupDate || null,
        follow_up_time: followupTime || null
      }]);

      // b. Update lead record in leads database
      const updateData = {
        called: true,
        overall_status: outcome,
        follow_up_date: followupDate || null,
        deal_value: dealValue || null
      };
      await sPatch('leads', leadId, updateData);

      // c. Insert activity audit log
      const formattedDetail = `Outcome: ${outcome}` + 
        (duration ? ` · ⏱️ Duration: ${duration} mins` : '') + 
        (dealValue ? ` · 💰 Deal Value: ₹${parseFloat(dealValue).toLocaleString('en-IN')}` : '') + 
        (followupDate ? ` · 📅 Follow-up: ${followupDate}${followupTime ? ` at ${followupTime}` : ''}` : '') + 
        (notes ? `\n📝 Notes: ${notes}` : '');

      await sPost('activity_log', [{
        action: 'call_logged',
        lead_id: leadId,
        lead_business: targetLead.business,
        detail: formattedDetail,
        worker_name: curUser || 'System',
        created_at: new Date().toISOString()
      }]);

      // d. React Local State Sync (Zero lag rendering)
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updateData } : l));
      setCallLogs(prev => [
        {
          lead_id: leadId,
          called_by: curUser,
          call_outcome: outcome,
          notes: notes || '',
          called_at: new Date().toISOString(),
          duration_mins: duration || null,
          deal_value: dealValue || null,
          follow_up_date: followupDate || null,
          follow_up_time: followupTime || null
        },
        ...prev
      ]);

      if (curLead && curLead.id === leadId) {
        setCurLead(prev => ({ ...prev, ...updateData }));
      }

      // Increment task_completion in attendance for workers
      if (curRole === 'worker') {
        try {
          const workerObj = workers.find(w => w.name === curUser);
          if (workerObj) {
            const today = new Date().toISOString().split('T')[0];
            const records = await sGet('attendance', `worker_id=eq.${workerObj.id}&date=eq.${today}`);
            if (records && records.length > 0) {
              const record = records[0];
              await sPatch('attendance', record.id, {
                task_completion: (record.task_completion || 0) + 1
              });
            }
          }
        } catch (err) {
          console.error("Failed to increment attendance call count: ", err);
        }
      }

      showToast(`✅ Call logged: "${outcome}" successfully recorded!`, 'success');
      await loadAllData(); // background reload
    } catch (e) {
      console.error(e);
      showToast('❌ Error saving call log to database.', 'error');
    }
  };

  // Quick Outcome Logger icon trigger
  const handleQuickOutcome = async (leadId, outcome) => {
    const targetLead = leads.find(x => x.id === leadId);
    if (!targetLead) return;

    try {
      await sPost('call_logs', [{
        lead_id: leadId,
        called_by: curUser,
        call_outcome: outcome,
        notes: 'Quick outcome tagged from list sidebar.',
        called_at: new Date().toISOString()
      }]);

      const updateData = { called: true, overall_status: outcome };
      await sPatch('leads', leadId, updateData);

      await sPost('activity_log', [{
        action: 'call_logged',
        lead_id: leadId,
        lead_business: targetLead.business,
        detail: `Outcome: ${outcome} (Sidebar Quick Log)`,
        worker_name: curUser || 'System',
        created_at: new Date().toISOString()
      }]);

      // Local Sync
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updateData } : l));
      if (curLead && curLead.id === leadId) {
        setCurLead(prev => ({ ...prev, ...updateData }));
      }

      // Increment task_completion in attendance for workers
      if (curRole === 'worker') {
        try {
          const workerObj = workers.find(w => w.name === curUser);
          if (workerObj) {
            const today = new Date().toISOString().split('T')[0];
            const records = await sGet('attendance', `worker_id=eq.${workerObj.id}&date=eq.${today}`);
            if (records && records.length > 0) {
              const record = records[0];
              await sPatch('attendance', record.id, {
                task_completion: (record.task_completion || 0) + 1
              });
            }
          }
        } catch (err) {
          console.error("Failed to increment attendance call count: ", err);
        }
      }

      showToast(`✅ Quick Outcome "${outcome}" logged!`, 'success');
      await loadAllData();
    } catch (e) {
      console.error(e);
      showToast('❌ Quick Log error.', 'error');
    }
  };

  const handleMarkCalled = async (leadId) => {
    try {
      await sPatch('leads', leadId, { called: true });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, called: true } : l));
      if (curLead && curLead.id === leadId) {
        setCurLead(prev => ({ ...prev, called: true }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkWA = async (leadId) => {
    try {
      await sPatch('leads', leadId, { called: true });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, called: true } : l));
      
      await sPost('activity_log', [{
        action: 'whatsapp_sent',
        lead_id: leadId,
        lead_business: leads.find(l=>l.id===leadId)?.business || 'Lead',
        detail: 'Tapped WhatsApp outreach templates toolbar',
        worker_name: curUser || 'System',
        created_at: new Date().toISOString()
      }]);

      if (curLead && curLead.id === leadId) {
        setCurLead(prev => ({ ...prev, called: true }));
      }
      await loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // 4. GMAIL DIRECT BROADCASTER OAUTH SETUP
  const handleConnectGmail = () => {
    if (!window.google) {
      showToast('⚠️ Google client script still loading. Refresh page in 3 seconds!', 'warning');
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: '296332383158-m35urrdbr70umce1kdamanud2vvk86n1.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
      callback: async (resp) => {
        if (resp.access_token) {
          setGmailToken(resp.access_token);
          // Fetch Connected User Email address
          try {
            const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: 'Bearer ' + resp.access_token }
            });
            const d = await r.json();
            setGmailEmail(d.email);
            showToast(`✅ Connected Gmail: "${d.email}" successfully authenticated.`, 'success');
          } catch (err) {
            console.error(err);
          }
        }
      }
    });
    client.requestAccessToken();
  };

  const handleSendEmail = async () => {
    if (!curLead || !gmailToken || !gmailEmail) return;

    const to = curLead.email;
    if (!to || to === '—') {
      showToast('⚠️ Lead does not possess an active email address!', 'warning');
      return;
    }

    const subject = getSubject(curLead);
    const htmlBody = buildHTML(curLead);

    // MIME encoding structure required for Gmail direct broadcasts
    const message = [
      `From: ${gmailEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      htmlBody
    ].join('\r\n');

    const base64SafeMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + gmailToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64SafeMessage })
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.error && errData.error.code === 401) {
          // Token expired, re-auth trigger
          showToast('🔑 Gmail token expired. Please re-authenticate!', 'warning');
          setGmailToken(null);
          setGmailEmail(null);
          handleConnectGmail();
          return;
        }
        throw new Error(errData.error?.message || 'Send failed');
      }

      await sPost('activity_log', [{
        action: 'email_sent',
        lead_id: curLead.id,
        lead_business: curLead.business,
        detail: `Direct HTML Email sent to: ${to} (Subject: "${subject}")`,
        worker_name: curUser || 'System',
        created_at: new Date().toISOString()
      }]);

      showToast(`📧 Styled HTML Email successfully broadcasted to ${to}!`, 'success');
      await loadAllData();
    } catch (e) {
      console.error(e);
      showToast('❌ Failed to broadcast direct email. Verify Google credentials.', 'error');
    }
  };

  // Render Loader spinner on app initialization
  if (appLoading) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-accent mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-mu select-none">Synchronizing CRM Database...</span>
      </div>
    );
  }

  // Render Login Splash Screen if session is empty
  if (!curUser) {
    return <Splash workers={workers} onLoginSuccess={handleLoginSuccess} />;
  }

  const activeCalledCount = leads.filter(l => l.called).length;
  const activeHotCount = leads.filter(l => l.overall_status === 'Interested').length;

  return (
    <div id="app" className="flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden bg-bg text-tx show">
      
      {/* Premium Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full select-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`p-3.5 rounded-rs shadow-xl border text-xs font-semibold flex items-center justify-between pointer-events-auto transition-all animate-slide-in backdrop-blur-md ${
              t.type === 'error' 
                ? 'bg-red/15 border-red/30 text-red'
                : t.type === 'warning'
                ? 'bg-amber/15 border-amber/30 text-amber'
                : 'bg-green/15 border-green/30 text-green'
            }`}
          >
            <span>{t.message}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="ml-4 text-[10px] uppercase tracking-wider hover:opacity-75 cursor-pointer shrink-0 font-bold opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Dynamic Topbar Header */}
      {(() => {
        const activeWorker = workers.find(w => 
          curRole === 'admin' 
            ? w.role === 'admin' 
            : w.name && w.name.trim().toLowerCase() === curUser.trim().toLowerCase()
        );
        const curUserPhoto = activeWorker ? activeWorker.photo_url : '';
        return (
          <Topbar
            curUser={curUser}
            curRole={curRole}
            activeView={activeView}
            setView={setActiveView}
            leadsCount={leads.length}
            calledCount={activeCalledCount}
            hotCount={activeHotCount}
            sortVal={sortVal}
            setSortVal={setSortVal}
            onLogout={handleLogout}
            curUserPhoto={curUserPhoto}
          />
        );
      })()}

      {/* Main Page Workspace View */}
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'crm' ? (
          <CRMPanel
            leads={leads}
            workers={workers}
            sheets={sheets}
            callLogs={callLogs}
            curUser={curUser}
            curRole={curRole}
            curLead={curLead}
            setCurLead={setCurLead}
            sortVal={sortVal}
            gmailEmail={gmailEmail}
            gmailToken={gmailToken}
            onConnectGmail={handleConnectGmail}
            onSendEmail={handleSendEmail}
            onLogCall={handleLogCall}
            onQuickOutcome={handleQuickOutcome}
            onMarkCalled={handleMarkCalled}
            onMarkWA={handleMarkWA}
            showToast={showToast}
          />
        ) : (
          <AdminPanel
            leads={leads}
            workers={workers}
            sheets={sheets}
            callLogs={callLogs}
            activities={activities}
            curUser={curUser}
            onDataRefresh={() => loadAllData()}
            showToast={showToast}
          />
        )}
      </main>

      {/* Motivational Welcome Note Modal Overlay */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-s1 border border-b2 rounded-r p-6 w-full max-w-[420px] shadow-2xl relative text-center text-tx animate-fade-in">
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/15 rounded-full blur-[40px] pointer-events-none" />

            {/* Circular Profile Photo with Zoom/Crop parameters */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-accent/40 shadow-lg mx-auto mb-4 relative bg-s2 flex items-center justify-center shrink-0">
              {(() => {
                const activeWorker = workers.find(w => 
                  curRole === 'admin' 
                    ? w.role === 'admin' 
                    : w.name && w.name.trim().toLowerCase() === curUser.trim().toLowerCase()
                );
                const parsedPhoto = parsePhotoUrlParams(activeWorker?.photo_url || '');
                return parsedPhoto.url ? (
                  <img 
                    src={parsedPhoto.url} 
                    alt={curUser}
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${parsedPhoto.zoom})`,
                      transformOrigin: 'center',
                      objectPosition: `center ${parsedPhoto.offsetY}%`
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-accent/8 text-accent font-display text-2xl font-bold">
                    {curUser ? curUser.charAt(0).toUpperCase() : 'U'}
                  </div>
                );
              })()}
            </div>

            {/* Welcome Greeting */}
            {curRole === 'admin' ? (
              <>
                <h2 className="font-display font-bold text-xl text-white mb-1">
                  Welcome back, Boss!
                </h2>
                <p className="text-a3 text-[11px] font-bold uppercase tracking-wider mb-5">
                  Administrator Dashboard Active
                </p>
                
                <div className="bg-s2/50 border border-b1 rounded-rs p-4 text-left mb-6">
                  <p className="text-xs text-tx/85 leading-relaxed text-center">
                    Track caller progress, manage lead division algorithms, and review operational achievements in real-time.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display font-bold text-xl text-white mb-1">
                  Welcome back, {curUser}!
                </h2>
                <p className="text-accent text-[11px] font-bold uppercase tracking-wider mb-5">
                  Telecalling Agent Session
                </p>

                {/* Target Metric Motivator Panel */}
                <div className="bg-s2/50 border border-b1 rounded-rs p-4 text-left mb-6">
                  <div className="flex items-center gap-1.5 mb-2 text-a3 animate-pulse">
                    <span>🔥</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-mu2">
                      Your Daily Target Goals
                    </span>
                  </div>
                  <p className="text-xs text-tx/85 leading-relaxed mb-3">
                    Let's make today an incredibly successful and rewarding shift! Your incentive target metrics for today:
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="bg-bg border border-b1/80 rounded p-2.5 text-center">
                      <span className="text-[9px] uppercase font-bold text-mu tracking-wider block mb-1">
                        Dials / Call Target
                      </span>
                      <span className="text-base font-extrabold text-white">50 - 60 Calls</span>
                    </div>
                    <div className="bg-bg border border-b1/80 rounded p-2.5 text-center">
                      <span className="text-[9px] uppercase font-bold text-mu tracking-wider block mb-1">
                        Lead Conversions
                      </span>
                      <span className="text-base font-extrabold text-green font-display">At least 3</span>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-mu mt-3.5 text-center italic">
                    "Every dial is a new opportunity. You've got this! 🚀"
                  </p>
                </div>
              </>
            )}

            {/* Action button to dismiss */}
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full btn primary py-2.5 text-xs font-bold rounded-rs bg-accent hover:bg-[#5d4fd6] text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg"
            >
              <span>Access Workspace Panel</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
