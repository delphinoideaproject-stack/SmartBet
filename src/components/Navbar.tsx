import React from 'react';
import { ShieldCheck, Cpu, Database, Dices, Lock, User as UserIcon, LogIn, Sparkles, RefreshCw, KeyRound } from 'lucide-react';
import { User, TierLevel } from '../types';
import { UI3DButton } from './UI3DButton';

interface NavbarProps {
  activeTab: 'site-checker' | 'signal-engine' | 'rng-lab' | 'db-hub';
  setActiveTab: (tab: 'site-checker' | 'signal-engine' | 'rng-lab' | 'db-hub') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenVault: () => void;
  onLogout: () => void;
  isDbSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenVault,
  onLogout,
  isDbSyncing,
}) => {
  const getTierBadge = (tier: TierLevel) => {
    switch (tier) {
      case 'ENTERPRISE_VIP':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-extrabold border-amber-300';
      case 'PRO':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold border-cyan-300';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0f172a] border-b border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Version matching Immersive UI theme */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">
                SmartBet <span className="text-cyan-400 font-normal">Engine v9.2</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 mt-1">
                Global RNG Class-A Certification
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Immersive UI Pill */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-full bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <button
              id="nav-tab-signal-engine"
              onClick={() => setActiveTab('signal-engine')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all duration-150 cursor-pointer ${
                activeTab === 'signal-engine'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Signal Engine</span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">V9.2</span>
            </button>

            <button
              id="nav-tab-site-checker"
              onClick={() => setActiveTab('site-checker')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all duration-150 cursor-pointer ${
                activeTab === 'site-checker'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Site Legitimacy</span>
            </button>

            <button
              id="nav-tab-rng-lab"
              onClick={() => setActiveTab('rng-lab')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all duration-150 cursor-pointer ${
                activeTab === 'rng-lab'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Global RNG Lab</span>
            </button>

            <button
              id="nav-tab-db-hub"
              onClick={() => setActiveTab('db-hub')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all duration-150 cursor-pointer ${
                activeTab === 'db-hub'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Database Hub</span>
              {isDbSyncing && <RefreshCw className="w-3 h-3 text-emerald-300 animate-spin" />}
            </button>
          </nav>

          {/* Right Action Tools & Immersive Auth Profile */}
          <div className="flex items-center gap-4">
            
            {/* E2E Encryption Status Pill */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">E2E Encryption</span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AES-256 ACTIVE
              </span>
            </div>

            <div className="hidden sm:block h-10 w-px bg-slate-800" />

            {/* E2E Security Badge / Vault Button */}
            <button
              id="btn-open-encrypted-vault"
              onClick={onOpenVault}
              title="Inspect AES-256 E2E Encrypted Vault"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono text-cyan-400 transition cursor-pointer group shadow-[0_0_10px_rgba(6,182,212,0.1)]"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline font-semibold">VAULT</span>
            </button>

            {/* Auth Section - Immersive Pill */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-slate-900/60 p-1.5 pr-4 rounded-full border border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-cyan-500/20 font-mono">
                    {currentUser.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-none truncate max-w-[100px]">
                      {currentUser.username}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      Authenticated
                    </span>
                  </div>
                </div>

                <UI3DButton
                  id="btn-logout-header"
                  variant="dark"
                  size="sm"
                  onClick={onLogout}
                >
                  Logout
                </UI3DButton>
              </div>
            ) : (
              <UI3DButton
                id="btn-login-header"
                variant="cyan"
                size="sm"
                icon={LogIn}
                onClick={onOpenAuth}
              >
                Login
              </UI3DButton>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden items-center justify-around py-2.5 border-t border-slate-800/80 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('signal-engine')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 text-[10px] font-bold rounded-xl ${
              activeTab === 'signal-engine' ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/60' : 'text-slate-400'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Signal</span>
          </button>
          <button
            onClick={() => setActiveTab('site-checker')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 text-[10px] font-bold rounded-xl ${
              activeTab === 'site-checker' ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/60' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Checker</span>
          </button>
          <button
            onClick={() => setActiveTab('rng-lab')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 text-[10px] font-bold rounded-xl ${
              activeTab === 'rng-lab' ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-800/60' : 'text-slate-400'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>RNG Lab</span>
          </button>
          <button
            onClick={() => setActiveTab('db-hub')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 text-[10px] font-bold rounded-xl ${
              activeTab === 'db-hub' ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/60' : 'text-slate-400'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>DB Hub</span>
          </button>
        </div>
      </div>
    </header>
  );
};
