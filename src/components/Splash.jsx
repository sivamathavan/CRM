import React, { useState, useEffect } from 'react';
import { ShieldAlert, User, KeyRound, ArrowRight, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { sPost } from '../utils/supabase';

export default function Splash({ workers, onLoginSuccess }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Force-clear inputs on mount to prevent browser autofill from leaking saved credentials
  useEffect(() => {
    setUsernameInput('');
    setPasswordInput('');
  }, []);

  // Clear error message when user starts typing or changes inputs
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [usernameInput, passwordInput]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const username = usernameInput.trim();
    const password = passwordInput;

    if (!username || !password) {
      setError('⚠️ Please enter both Username/ID and Password!');
      return;
    }

    // 1. Check for Admin Login (Name is 'mathavan' case-insensitive)
    if (username.toLowerCase() === 'mathavan') {
      const adminWorker = workers.find(w => w.role === 'admin');
      const adminPasskey = adminWorker ? adminWorker.passkey : null;

      // Direct login or check against database passkey if set
      if (!adminPasskey || password === adminPasskey) {
        handleLogin('mathavan', 'admin', adminWorker ? adminWorker.id : null);
      } else {
        setError('❌ Incorrect password for Admin! Try again.');
      }
      return;
    }

    // 2. Check for Telecaller Agent Login (matching by Employee ID or Name case-insensitive)
    const matchedWorker = workers.find(w => 
      (w.employee_id && w.employee_id.trim().toLowerCase() === username.toLowerCase()) ||
      (w.name && w.name.trim().toLowerCase() === username.toLowerCase())
    );

    if (matchedWorker) {
      if (password === matchedWorker.passkey) {
        handleLogin(matchedWorker.name, 'worker', matchedWorker.id);
      } else {
        setError('❌ Incorrect password! Try again.');
      }
    } else {
      setError('❌ Invalid Username or Employee ID!');
    }
  };

  const handleLogin = async (name, role, id) => {
    setLoading(true);
    // Log attendance for telecallers (excluding admin sessions)
    if (role !== 'admin' && id) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await sPost('attendance', [{
          worker_id: id,
          worker_name: name,
          date: today,
          login_time: new Date().toISOString(),
          status: 'Present'
        }]);
      } catch (e) {
        console.error('Attendance log failed:', e);
      }
    }
    setTimeout(() => {
      onLoginSuccess(name, role);
      setLoading(false);
    }, 450);
  };

  return (
    <div id="splash" className="fixed inset-0 z-[300] bg-bg flex flex-col items-center justify-center p-6 transition-all duration-500 overflow-y-auto">
      {/* Ambient glowing background blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-a3/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Brand Header */}
      <div className="z-10 flex flex-col items-center mb-6">
        <div className="sp-eye text-[10px] font-bold tracking-[0.3em] uppercase text-a2 mb-3.5 font-display flex items-center gap-2 select-none">
          Rturox Sales CRM
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-white via-a2 to-a3 bg-clip-text text-transparent m-0 select-none animate-pulse">
          Rturox
        </h1>
        <p className="font-display text-[11px] font-semibold tracking-[0.16em] uppercase text-mu mt-2 select-none">
          CRM · Telecalling · Team Management
        </p>
      </div>

      {/* Secure Login Form Card */}
      <div className={`z-10 bg-s1 border border-b2 rounded-r p-6 w-full max-w-[400px] shadow-2xl relative ${error ? 'animate-shake' : ''}`}>
        {loading && (
          <div className="absolute inset-0 bg-s1/80 rounded-r flex flex-col items-center justify-center z-50">
            <Loader2 size={36} className="text-accent animate-spin mb-2" />
            <span className="text-xs text-mu">Starting session...</span>
          </div>
        )}

        <h2 className="font-display text-[15px] font-bold mb-5 flex items-center gap-1.5 border-b border-b1 pb-2.5 text-white select-none">
          <KeyRound size={16} className="text-accent" />
          Workspace Secure Login
        </h2>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4" autoComplete="off">
          {/* Username / ID input field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider select-none">
              Username / Employee ID
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-mu shrink-0">
                <User size={15} />
              </span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter Your ID"
                className="w-full bg-bg border border-b2 rounded-rs pl-9 pr-3 py-2 text-xs text-tx outline-none focus:border-accent transition-colors"
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-mu2 tracking-wider select-none">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-mu shrink-0">
                <Lock size={15} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Your Passkey"
                className="w-full bg-bg border border-b2 rounded-rs pl-9 pr-10 py-2 text-xs text-tx outline-none focus:border-accent transition-colors tracking-wide"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-mu hover:text-tx transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="text-red text-[11px] font-semibold bg-red/10 border border-red/25 rounded p-2.5 text-center select-none">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full btn primary py-2.5 text-xs font-bold rounded-rs bg-accent hover:bg-[#5d4fd6] text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg mt-1"
          >
            <span>Access CRM Platform</span>
            <ArrowRight size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}
