import React from 'react';
import { PhoneCall, Flame, Settings, LogOut, ChevronDown, User, Shield } from 'lucide-react';

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

export default function Topbar({
  curUser,
  curRole,
  activeView,
  setView,
  leadsCount,
  calledCount,
  hotCount,
  sortVal,
  setSortVal,
  onLogout,
  curUserPhoto // Dynamic user avatar photo URL
}) {
  const isAdmin = curRole === 'admin';

  return (
    <header className="h-[60px] bg-bg/95 border-b border-b1 px-3 sm:px-4 flex items-center justify-between shrink-0 sticky top-0 z-[100] backdrop-blur-md w-full overflow-hidden">
      {/* Left section: Logo and Role Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <h1 className="font-display font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-white via-a2 to-a3 bg-clip-text text-transparent m-0 select-none">
          Rturox
        </h1>
        <div className="w-[1px] h-5 bg-b2 hidden sm:block" />
        
        {/* Active Session Badge */}
        <div className={`text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1 rounded-full flex items-center gap-1.5 transition-all select-none border shrink-0 min-w-0 ${
          isAdmin 
            ? 'bg-[#fd79a8]/12 border-[#fd79a8]/25 text-a3 shadow-[0_0_10px_rgba(253,121,168,0.15)]' 
            : 'bg-accent/12 border-accent/25 text-a2'
        }`}>
          {curUserPhoto ? (
            <div className="w-4.5 h-4.5 rounded-full overflow-hidden shrink-0 border border-current flex items-center justify-center bg-s2">
              <img 
                src={parsePhotoUrlParams(curUserPhoto).url} 
                alt={curUser}
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${parsePhotoUrlParams(curUserPhoto).zoom})`,
                  transformOrigin: 'center',
                  objectPosition: `center ${parsePhotoUrlParams(curUserPhoto).offsetY}%`
                }}
              />
            </div>
          ) : (
            isAdmin ? <Shield size={12} className="shrink-0" /> : <User size={12} className="shrink-0" />
          )}
          <span className="truncate max-w-[60px] sm:max-w-[120px] md:max-w-none">
            {isAdmin ? 'Mathavan' : curUser}
          </span>
        </div>
      </div>

      {/* Middle section: CRM stats - hidden on tiny mobile, responsive layout */}
      <div className="hidden md:flex items-center gap-5 text-xs text-mu select-none shrink-0">
        {/* Hide overall totals/hot leads from workers per legacy design */}
        {isAdmin && (
          <span className="flex items-center gap-1.5 font-medium">
            Total <strong className="text-tx font-semibold text-sm">{leadsCount}</strong>
          </span>
        )}
        <span className="flex items-center gap-1.5 font-medium">
          <PhoneCall size={13} className="text-green" />
          <strong className="text-tx font-semibold text-sm">{calledCount}</strong>
          <span className="text-[10px] text-mu2 uppercase tracking-wide">
            {isAdmin ? 'called' : 'today'}
          </span>
        </span>
        {isAdmin && (
          <span className="flex items-center gap-1.5 font-medium">
            <Flame size={13} className="text-a3 animate-pulse" />
            🔥 <strong className="text-tx font-semibold text-sm">{hotCount}</strong>
          </span>
        )}
      </div>

      {/* Right section: Control buttons, filter, logout */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* CRM View Toggle removed for admin to lock them in Admin Workspace */}

        {/* Sort selector - only visible for active CRM calling workspace */}
        {activeView === 'crm' && (
          <div className="relative flex items-center shrink-0 min-w-0">
            <select
              value={sortVal}
              onChange={(e) => setSortVal(e.target.value)}
              className="bg-bg border border-b2 rounded-rs pl-2 pr-6 py-1.5 text-[11px] sm:text-xs text-tx font-medium outline-none cursor-pointer hover:border-b3 transition-all appearance-none max-w-[110px] sm:max-w-[160px] md:max-w-none truncate"
            >
              <option value="name">🔤 A to Z</option>
              <option value="no_website">Hot🔥 (No Website)</option>
              <option value="uncalled">📞 Uncalled first</option>
              <option value="followup">⏰ Followup (Call Back)</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 pointer-events-none text-mu" />
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="btn text-xs px-2.5 py-1.5 rounded-rs border border-b2 bg-s2/50 text-red hover:bg-red/10 border-red/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
          title="Exit Session"
        >
          <LogOut size={12} className="shrink-0" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </header>
  );
}
