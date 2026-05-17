import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, Mail, Globe, MapPin, Send, MessageSquare, Clipboard, Calendar, 
  Trash2, Edit, Check, ArrowLeft, Plus, Award, AlertCircle, Clock, AlertTriangle, ShieldCheck, Smartphone
} from 'lucide-react';
import { 
  getSvc, buildWAEN, buildWATN, buildSMS, buildHTML, getSubject, fn 
} from '../../utils/templates';

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

export default function LeadDetail({
  lead,
  history,
  followups,
  notIntLeads,
  gmailEmail,
  gmailToken,
  onConnectGmail,
  onSendEmail,
  onLogCall,
  onBackToList,
  onGoNext,
  onMarkCalled,
  onMarkWA,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('call');
  const [selOutcome, setSelOutcome] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [duration, setDuration] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Call timer states
  const [callSecs, setCallSecs] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const emailFrameRef = useRef(null);

  // Sync state when lead changes
  useEffect(() => {
    if (lead) {
      setSelOutcome('');
      setLogNotes('');
      setFollowupDate(lead.follow_up_date || '');
      setFollowupTime('');
      setDealValue(lead.deal_value || '');
      setDuration('');
      setCallSecs(0);
      setTimerActive(false); // Do not auto-start call timer on lead select
      setActiveTab('call'); // Reset to call outcome
    } else {
      setTimerActive(false);
    }
  }, [lead]);

  // Live timer interval runner
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setCallSecs(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Auto-synchronize duration state field in minutes
  useEffect(() => {
    if (callSecs > 0) {
      const computedMins = Math.max(1, Math.ceil(callSecs / 60));
      setDuration(String(computedMins));
    }
  }, [callSecs]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Load Iframe Preview Content
  useEffect(() => {
    if (activeTab === 'email' && lead && emailFrameRef.current) {
      const doc = emailFrameRef.current.contentDocument || emailFrameRef.current.contentWindow.document;
      doc.open();
      doc.write(buildHTML(lead));
      doc.close();
    }
  }, [activeTab, lead]);

  if (!lead) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-mu bg-bg">
        <div className="text-5xl opacity-20 mb-3">📞</div>
        <p className="text-sm font-semibold text-tx">Select a lead to start</p>
        <p className="text-[11px] text-mu2 mt-1">Pick any contact from the left list to begin telecalling</p>
      </div>
    );
  }

  const s = getSvc(lead.service, lead.industry);
  const initials = (lead.business || '').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '??';
  const statusColor = STATUS_COLORS[lead.overall_status] || STATUS_COLORS['New'];
  const hasWeb = lead.website && lead.website.trim() && lead.website !== '—' && lead.website.toLowerCase() !== 'null';

  // Quick Action Links
  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
  const waNum = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
  const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(buildWAEN(lead))}`;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const smsUrl = `sms:${lead.phone || ''}${isIOS ? '&' : '?'}body=${encodeURIComponent(buildSMS(lead))}`;

  // Direct Outcomes chip options
  const outcomeOptions = [
    { value: 'Interested', label: '✅ Interested', color: 'bg-green text-white hover:bg-green/90' },
    { value: 'Call Back', label: '🔄 Call Back', color: 'bg-amber text-bg hover:bg-amber/90' },
    { value: 'Not Interested', label: '❌ Not Interested', color: 'bg-red text-white hover:bg-red/90' },
    { value: 'No Answer', label: '📵 No Answer', color: 'bg-mu text-white hover:bg-mu/90' },
    { value: 'Busy', label: '⏳ Busy', color: 'bg-amber text-bg hover:bg-amber/90' },
    { value: 'Wrong Number', label: '🚫 Wrong Number', color: 'bg-mu2 text-white hover:bg-mu2/90' },
    { value: 'Won', label: '🏆 Won', color: 'bg-blue text-white hover:bg-blue/90' },
  ];

  // Quick Notes list
  const noteChips = [
    'Requested proposal',
    'Budget concern',
    'Call back next week',
    'Needs demo',
    'Already has vendor',
    'Very interested'
  ];

  const addNoteChip = (chip) => {
    setLogNotes(prev => prev ? `${prev}, ${chip}` : chip);
  };

  const handleSaveLog = async () => {
    if (!selOutcome) {
      showToast('⚠️ Pick a call outcome first!', 'warning');
      return;
    }
    setIsSaving(true);
    await onLogCall({
      leadId: lead.id,
      outcome: selOutcome,
      notes: logNotes,
      followupDate,
      followupTime,
      dealValue: dealValue ? parseFloat(dealValue) : null,
      duration: duration ? parseInt(duration) : null
    });
    setIsSaving(false);
  };

  const handleSendGmailDirect = async () => {
    if (!gmailToken) {
      showToast('⚠️ Connect Gmail first!', 'warning');
      return;
    }
    setIsSendingEmail(true);
    await onSendEmail();
    setIsSendingEmail(false);
  };

  const handleCopyMsg = (text) => {
    navigator.clipboard.writeText(text);
    showToast('📋 Message template copied to clipboard!', 'success');
  };

  return (
    <div id="leadView" className="flex-1 flex flex-col h-full overflow-hidden bg-bg">
      
      {/* 1. Lead Header Details Card */}
      <div className="p-4 border-b border-b1 bg-s1 shrink-0 select-none">
        <div className="flex gap-4 items-center">
          
          {/* Back button (Only visible on mobile) */}
          <button 
            onClick={onBackToList}
            className="md:hidden p-2 rounded-rs border border-b2 bg-s2 text-mu hover:text-tx cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Avatar Profile Initials */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-a3 flex items-center justify-center font-display font-extrabold text-white text-base shadow-[0_0_12px_rgba(108,92,231,0.3)] shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white truncate max-w-[240px]">
                {lead.business}
              </h2>
              {lead.overall_status && lead.overall_status !== 'New' && (
                <span 
                  className="text-[9px] font-bold px-2 py-0.5 rounded uppercase border select-none"
                  style={{
                    backgroundColor: `${statusColor}18`,
                    color: statusColor,
                    borderColor: `${statusColor}35`
                  }}
                >
                  {lead.overall_status}
                </span>
              )}
            </div>

            <p className="text-xs text-mu mt-1 truncate">
              {lead.industry && lead.industry !== '—' ? `${lead.industry} · ` : ''}
              {lead.city && lead.city !== '—' ? `${lead.city} · ` : ''}
              {lead.contact}
            </p>
          </div>
        </div>

        {/* Dynamic Fields row */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-b1">
          {lead.phone && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(lead.phone);
                showToast('📋 Copied phone number: ' + lead.phone, 'success');
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-rs bg-s2 border border-b2 text-tx hover:border-b3"
            >
              📞 {lead.phone}
            </button>
          )}
          {lead.email && (
            <a 
              href={`mailto:${lead.email}`}
              className="text-[11px] font-medium px-2.5 py-1 rounded-rs bg-s2 border border-b2 text-tx hover:border-b3 text-decoration-none"
            >
              📧 {lead.email}
            </a>
          )}
          {lead.address && lead.address !== '—' && (
            <span className="text-[10px] text-mu px-2.5 py-1 rounded-rs bg-s2/40 border border-b1 flex items-center gap-1 max-w-[200px] truncate">
              <MapPin size={10} />
              {lead.address}
            </span>
          )}
          {hasWeb ? (
            <a 
              href={lead.website} 
              target="_blank" 
              rel="noreferrer"
              className="text-[11px] font-semibold px-2.5 py-1 rounded-rs bg-green/10 border border-green/30 text-green hover:bg-green/20 text-decoration-none"
            >
              🌐 Website ↗
            </a>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-rs bg-red/10 border border-red/20 text-red flex items-center">
              ❌ No Website
            </span>
          )}
          {lead.maps_url && (
            <a 
              href={lead.maps_url} 
              target="_blank" 
              rel="noreferrer"
              className="text-[11px] font-medium px-2.5 py-1 rounded-rs bg-s2 border border-b2 text-tx hover:border-b3 text-decoration-none"
            >
              🗺️ Maps ↗
            </a>
          )}
        </div>

        {/* Action Calling Toolbar */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <a
            href={`tel:${lead.phone || ''}`}
            onClick={() => {
              setTimerActive(true); // Start live timer when calling
              onMarkCalled(lead.id);
            }}
            className="flex-1 min-w-[120px] bg-gradient-to-r from-green to-[#00cec9] text-white py-2 px-4 rounded-rs font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 shadow-[0_4px_12px_rgba(0,184,148,0.25)] text-decoration-none transition-all"
          >
            <Phone size={13} />
            <span>Call {fn(lead.contact)}</span>
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => onMarkWA(lead.id)}
            className="bg-transparent border border-[#25d366]/30 bg-[#25d366]/10 text-[#25d366] hover:bg-[#25d366]/20 py-2 px-4 rounded-rs font-bold text-xs flex items-center gap-1 text-decoration-none transition-all"
          >
            <MessageSquare size={13} />
            <span>WA</span>
          </a>
          <a
            href={smsUrl}
            className="bg-transparent border border-amber/30 bg-amber/10 text-amber hover:bg-amber/20 py-2 px-4 rounded-rs font-bold text-xs flex items-center gap-1 text-decoration-none transition-all"
          >
            <Smartphone size={13} />
            <span>SMS</span>
          </a>
          <button
            onClick={() => handleSendGmailDirect()}
            disabled={!gmailToken || isSendingEmail}
            className="bg-transparent border border-[#ea4335]/30 bg-[#ea4335]/12 text-[#ea4335] hover:bg-[#ea4335]/20 disabled:opacity-40 disabled:pointer-events-none py-2 px-4 rounded-rs font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
          >
            <Mail size={13} />
            <span>{isSendingEmail ? 'Sending...' : 'Email'}</span>
          </button>
        </div>
      </div>

      {/* 2. CRM Section tabs selector */}
      <div className="flex border-b border-b1 bg-s1 shrink-0 overflow-x-auto select-none scrollbar-none scrollbar-width-none">
        {[
          { id: 'call', label: '📞 Call Log' },
          { id: 'email', label: '📧 Email' },
          { id: 'wa-en', label: '💬 WA EN' },
          { id: 'wa-ta', label: '💬 WA TN' },
          { id: 'sms', label: '📱 SMS' },
          { id: 'followup', label: '📅 Followups' },
          { id: 'notint', label: '❌ Not Interested' },
          { id: 'hist', label: '📋 History' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[11px] font-medium px-4 py-3 shrink-0 cursor-pointer border-b-2 transition-all ${
              activeTab === tab.id
                ? 'text-tx border-accent bg-accent/5 font-semibold'
                : 'text-mu border-transparent hover:text-tx'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents Scroll Area */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-bg/50">
        
        {/* tab: Call Log Outcome Form */}
        {activeTab === 'call' && (
          <div className="p-4 fu-anim">
            <div className="bg-s2 border border-b2 rounded-r p-4">
              <h3 className="font-display text-xs font-bold text-white mb-1">📞 Log Call Outcome</h3>
              <p className="text-[10px] text-mu mb-4">Select what happened on this call and configure scheduling:</p>

              {/* Call Outcomes Chip Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {outcomeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelOutcome(opt.value)}
                    className={`text-[11px] font-semibold px-4 py-2 rounded-full border cursor-pointer transition-all ${
                      selOutcome === opt.value
                        ? `${opt.color} border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.2)]`
                        : 'bg-transparent border-b2 text-mu hover:text-tx hover:border-b3'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Pulsing Live Call Timer Card */}
              <div className="bg-bg/45 border border-b1 rounded-rs p-3 flex items-center justify-between mb-4 fu-anim">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green"></span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-mu tracking-wider flex items-center gap-1">
                    Live Call Timer
                  </span>
                </div>
                <div className="flex items-center gap-2.5 select-none">
                  <strong className="text-xs font-mono text-white tracking-widest bg-s3 border border-b2 px-2.5 py-1 rounded">
                    {formatTime(callSecs)}
                  </strong>
                  <button
                    onClick={() => setTimerActive(prev => !prev)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      timerActive 
                        ? 'border-amber/30 text-amber bg-amber/5 hover:bg-amber/10'
                        : 'border-green/30 text-green bg-green/5 hover:bg-green/10'
                    }`}
                  >
                    {timerActive ? 'Pause' : 'Start'}
                  </button>
                </div>
              </div>

              {/* Logging Form Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                
                {/* Followup scheduler */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Follow-up Date</label>
                  <input
                    type="date"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Follow-up Time</label>
                  <input
                    type="time"
                    value={followupTime}
                    onChange={(e) => setFollowupTime(e.target.value)}
                    className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                  />
                </div>

                {/* Call Analytics: values */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Deal Value (₹)</label>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="e.g. 25000"
                    className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Duration (mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 5"
                    className="bg-bg border border-b2 rounded-rs px-3 py-1.5 text-xs text-tx outline-none focus:border-accent"
                  />
                </div>

                {/* Call Notes Textarea & Note Chips */}
                <div className="col-span-2 flex flex-col gap-1.5 mt-1">
                  <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider">Call Notes</label>
                  
                  {/* Note Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2 select-none">
                    {noteChips.map(chip => (
                      <span
                        key={chip}
                        onClick={() => addNoteChip(chip)}
                        className="text-[9px] font-medium px-2.5 py-1 rounded-full border border-b2 bg-s3 text-mu cursor-pointer hover:border-accent hover:text-tx transition-all active:scale-95"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

                  <textarea
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="What did they say? Requirements, objections, budget, next steps..."
                    className="w-full bg-bg border border-b2 rounded-rs px-3 py-2 text-xs text-tx resize-none min-height-[70px] outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <button
                onClick={handleSaveLog}
                disabled={isSaving}
                className="w-full btn primary py-2.5 rounded-rs bg-accent hover:bg-[#5d4fd6] text-white font-bold text-xs flex justify-center items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSaving ? <Loader size={12} className="text-white" /> : <Clock size={14} />}
                <span>Save Call Outcome Logs</span>
              </button>
            </div>
          </div>
        )}

        {/* tab: Direct Email HTML preview & send */}
        {activeTab === 'email' && (
          <div className="p-4 fu-anim">
            {/* Header info */}
            <div className="bg-s2 border border-b1 rounded-rs p-3 mb-3 text-xs leading-relaxed select-none">
              <div className="flex gap-2 mb-1">
                <span className="text-mu2 uppercase text-[8.5px] font-bold tracking-wide w-12 shrink-0">To</span>
                <span className="text-tx">{lead.contact} &lt;{lead.email || '—'}&gt;</span>
              </div>
              <div className="flex gap-2">
                <span className="text-mu2 uppercase text-[8.5px] font-bold tracking-wide w-12 shrink-0">Subject</span>
                <span className="text-tx font-medium">{getSubject(lead)}</span>
              </div>
            </div>

            {/* Gmail Connection Status box */}
            {gmailEmail ? (
              <div className="bg-green/10 border border-green/25 text-green rounded-rs p-3 text-xs mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  Connected: <strong>{gmailEmail}</strong>
                </span>
                <button
                  onClick={onConnectGmail}
                  className="btn sm bg-green/20 hover:bg-green/30 text-green border border-green/35 text-[9px] px-2 py-0.5 rounded cursor-pointer"
                >
                  Reconnect
                </button>
              </div>
            ) : (
              <div className="bg-[#ea4335]/8 border border-[#ea4335]/25 text-[#ea4335] rounded-rs p-3 text-xs mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Gmail disconnected. Connect to send directly.
                </span>
                <button
                  onClick={onConnectGmail}
                  className="btn sm bg-[#ea4335]/15 hover:bg-[#ea4335]/25 text-[#ea4335] border border-[#ea4335]/35 text-[9.5px] font-semibold px-3 py-1 rounded cursor-pointer transition-all"
                >
                  Connect Gmail
                </button>
              </div>
            )}

            {/* Trigger buttons */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleSendGmailDirect}
                disabled={!gmailToken || isSendingEmail}
                className="flex-1 bg-gradient-to-r from-[#ea4335] to-[#ff7675] text-white py-2 px-3 rounded-rs text-xs font-bold flex justify-center items-center gap-1.5 shadow-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all"
              >
                <Mail size={13} />
                <span>Send styled HTML email directly</span>
              </button>
              <button
                onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email || '')}&su=${encodeURIComponent(getSubject(lead))}`, '_blank')}
                className="btn border border-b2 bg-s2 text-tx hover:bg-s3 text-xs px-3 py-2 rounded-rs flex items-center gap-1 cursor-pointer"
              >
                ↗ Gmail
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(buildHTML(lead));
                  alert('📋 HTML newsletter template copied! Paste directly into your email compose.');
                }}
                className="btn border border-b2 bg-s2 text-tx hover:bg-s3 text-xs px-3 py-2 rounded-rs flex items-center gap-1 cursor-pointer"
              >
                📋 HTML
              </button>
            </div>

            {/* Template iframe container */}
            <div className="email-preview-wrap overflow-hidden border border-b1 rounded-r">
              <iframe
                ref={emailFrameRef}
                title="Newsletter Email Layout Preview"
                className="w-full min-h-[500px] border-none block"
                sandbox="allow-same-origin allow-popups"
              />
            </div>
          </div>
        )}

        {/* tab: WhatsApp EN template view */}
        {activeTab === 'wa-en' && (
          <div className="p-4 fu-anim">
            <div className="flex justify-between items-center mb-2.5 select-none">
              <span className="text-[10px] text-mu font-semibold">💬 English Message Template (First Contact)</span>
              <button
                onClick={() => handleCopyMsg(buildWAEN(lead))}
                className="btn text-[9px] px-2.5 py-1 border border-b2 bg-s2 hover:bg-s3 text-tx rounded flex items-center gap-1 cursor-pointer"
              >
                <Clipboard size={10} />
                <span>Copy</span>
              </button>
            </div>
            <div className="bg-s2 border border-b1 rounded-r p-4 text-xs font-mono text-[#c8c6d8] whitespace-pre-wrap word-break select-all leading-relaxed max-h-[400px] overflow-y-auto">
              {buildWAEN(lead)}
            </div>
          </div>
        )}

        {/* tab: WhatsApp TN template view */}
        {activeTab === 'wa-ta' && (
          <div className="p-4 fu-anim">
            <div className="flex justify-between items-center mb-2.5 select-none">
              <span className="text-[10px] text-mu font-semibold">💬 Tamil Message Template (Follow-up)</span>
              <button
                onClick={() => handleCopyMsg(buildWATN(lead))}
                className="btn text-[9px] px-2.5 py-1 border border-b2 bg-s2 hover:bg-s3 text-tx rounded flex items-center gap-1 cursor-pointer"
              >
                <Clipboard size={10} />
                <span>Copy</span>
              </button>
            </div>
            <div className="bg-s2 border border-b1 rounded-r p-4 text-xs font-mono text-[#c8c6d8] whitespace-pre-wrap word-break select-all leading-relaxed max-h-[400px] overflow-y-auto">
              {buildWATN(lead)}
            </div>
          </div>
        )}

        {/* tab: SMS template view */}
        {activeTab === 'sms' && (
          <div className="p-4 fu-anim">
            <div className="flex justify-between items-center mb-2.5 select-none">
              <span className="text-[10px] text-mu font-semibold">📱 Professional SMS Message Template</span>
              <button
                onClick={() => handleCopyMsg(buildSMS(lead))}
                className="btn text-[9px] px-2.5 py-1 border border-b2 bg-s2 hover:bg-s3 text-tx rounded flex items-center gap-1 cursor-pointer"
              >
                <Clipboard size={10} />
                <span>Copy</span>
              </button>
            </div>
            <div className="bg-s2 border border-b1 rounded-r p-4 text-xs font-mono text-[#c8c6d8] whitespace-pre-wrap word-break select-all leading-relaxed max-h-[400px] overflow-y-auto">
              {buildSMS(lead)}
            </div>
          </div>
        )}

        {/* tab: Worker followups list */}
        {activeTab === 'followup' && (
          <div className="p-4 fu-anim">
            <h4 className="text-[10px] text-mu uppercase font-bold tracking-wider mb-3 select-none">📅 Your Scheduled Follow-ups</h4>
            
            <div className="flex flex-col gap-2">
              {followups.length === 0 ? (
                <div className="text-xs text-mu2 py-6 text-center border border-dashed border-b1 rounded-rs">
                  No follow-ups scheduled yet.
                </div>
              ) : (
                followups.map(fu => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = fu.follow_up_date === todayStr;
                  const isPast = fu.follow_up_date < todayStr;
                  const dateClr = isToday ? 'text-amber' : isPast ? 'text-red' : 'text-green';
                  const sClr = STATUS_COLORS[fu.overall_status] || STATUS_COLORS['New'];

                  return (
                    <div 
                      key={fu.id}
                      className="bg-s2 border border-b1 rounded-rs p-3 flex items-center gap-3"
                    >
                      <div className={`text-xs font-bold select-none min-w-[75px] shrink-0 ${dateClr}`}>
                        {isToday ? 'Today' : isPast ? 'Overdue' : fu.follow_up_date}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-tx truncate leading-normal">{fu.business}</div>
                        <div className="text-[10px] text-mu truncate mt-0.5">{fu.contact} · {fu.city || 'Coimbatore'}</div>
                      </div>
                      <span 
                        className="text-[8px] font-bold px-2 py-0.5 rounded border uppercase shrink-0"
                        style={{
                          backgroundColor: `${sClr}15`,
                          color: sClr,
                          borderColor: `${sClr}25`
                        }}
                      >
                        {fu.overall_status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* tab: Leads marked not interested */}
        {activeTab === 'notint' && (
          <div className="p-4 fu-anim">
            <h4 className="text-[10px] text-mu uppercase font-bold tracking-wider mb-3 select-none">❌ Leads Marked Not Interested</h4>

            <div className="flex flex-col gap-2">
              {notIntLeads.length === 0 ? (
                <div className="text-xs text-mu2 py-6 text-center border border-dashed border-b1 rounded-rs">
                  No leads marked Not Interested.
                </div>
              ) : (
                notIntLeads.map(l => (
                  <div 
                    key={l.id}
                    className="bg-s2 border border-b1 rounded-rs p-3 flex items-center gap-3"
                  >
                    <span className="text-base select-none shrink-0">❌</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-tx truncate leading-normal">{l.business}</div>
                      <div className="text-[10px] text-mu truncate mt-0.5">{l.contact} · {l.city} · {l.service}</div>
                    </div>
                    <span className="text-[9px] font-semibold text-mu shrink-0">{l.interest || 0}% Interest</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* tab: Call logs history */}
        {activeTab === 'hist' && (
          <div className="p-4 fu-anim">
            <h4 className="text-[10px] text-mu uppercase font-bold tracking-wider mb-3 select-none">📋 Full Call History</h4>

            <div className="flex flex-col gap-2.5">
              {history.length === 0 ? (
                <div className="text-xs text-mu2 py-6 text-center border border-dashed border-b1 rounded-rs">
                  No calls logged yet. Outbound logs will appear here.
                </div>
              ) : (
                history.map(log => {
                  const dateStr = new Date(log.called_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  });
                  const outcomeColor = STATUS_COLORS[log.call_outcome] || '#8887a0';

                  return (
                    <div 
                      key={log.id}
                      className="bg-s2 border border-b1 rounded-rs p-3.5 flex flex-col gap-2 fu-anim"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span 
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase"
                          style={{
                            backgroundColor: `${outcomeColor}15`,
                            color: outcomeColor,
                            borderColor: `${outcomeColor}25`
                          }}
                        >
                          {log.call_outcome}
                        </span>
                        <span className="text-[9.5px] text-mu2 font-medium">{dateStr}</span>
                      </div>
                      
                      {log.notes && (
                        <p className="text-xs text-mu leading-relaxed">{log.notes}</p>
                      )}

                      {log.deal_value && (
                        <div className="text-[10px] text-green font-bold flex items-center gap-1 select-none">
                          <Award size={10} />
                          <span>Deal Logged: ₹{log.deal_value.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      
                      {log.duration_mins && (
                        <div className="text-[9.5px] text-mu2 flex items-center gap-1 select-none">
                          <Clock size={10} />
                          <span>Duration: {log.duration_mins} mins</span>
                        </div>
                      )}

                      {log.follow_up_date && (
                        <div className="text-[10px] text-a2 font-medium flex items-center gap-1 select-none border-t border-b1 pt-1.5 mt-0.5">
                          <Calendar size={10} />
                          <span>Follow-up scheduled: {log.follow_up_date} {log.follow_up_time ? `at ${log.follow_up_time}` : ''}</span>
                        </div>
                      )}

                      <div className="text-[8.5px] text-mu2 font-semibold self-end select-none">
                        👤 Logged by: {log.called_by}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Action bar footer */}
      <div id="actionBar" className="p-3 border-t border-b1 bg-s1 shrink-0 flex items-center justify-between gap-3 select-none">
        <div className="text-[9.5px] text-mu leading-none">
          #{lead.no || '—'} · {lead.priority || 'Medium'} · {lead.called ? '📞 Called' : 'Not called'}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleCopyMsg(buildHTML(lead))}
            className="btn border border-b2 bg-s2 text-tx hover:bg-s3 text-[10.5px] font-medium px-3.5 py-1.5 rounded-rs cursor-pointer transition-all"
          >
            📋 HTML
          </button>
          
          <button
            onClick={onGoNext}
            className="btn border border-b2 bg-s2 text-tx hover:bg-s3 text-[10.5px] font-medium px-3.5 py-1.5 rounded-rs cursor-pointer transition-all"
          >
            ⏭️ Next
          </button>

          <button
            onClick={handleSaveLog}
            disabled={isSaving}
            className="btn primary bg-accent hover:bg-[#5d4fd6] text-white text-[10.5px] font-bold px-4 py-1.5 rounded-rs cursor-pointer shadow-md disabled:opacity-50 transition-all flex items-center gap-1"
          >
            {isSaving ? <Loader size={11} className="text-white" /> : <Clock size={12} />}
            <span>Save Log</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple internal spinner
function Loader({ size = 12, className = '' }) {
  return (
    <svg className={`animate-spin h-${size} w-${size} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
