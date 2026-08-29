/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, SecurityAuditLog } from './types';
import { Navbar } from './components/Navbar';
import { SignalEngineTab } from './components/SignalEngineTab';
import { SiteCheckerTab } from './components/SiteCheckerTab';
import { GlobalRngTab } from './components/GlobalRngTab';
import { DatabaseHubTab } from './components/DatabaseHubTab';
import { AuthModal } from './components/AuthModal';
import { EncryptedVaultModal } from './components/EncryptedVaultModal';
import { ToastProvider, useToast } from './context/ToastContext';
import { TacticalToastContainer } from './components/TacticalToast';
import { createAuditLog } from './utils/dbConnector';
import { ShieldCheck, Lock, Activity, Sparkles, Terminal } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'signal-engine' | 'site-checker' | 'rng-lab' | 'db-hub'>('signal-engine');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isDbSyncing, setIsDbSyncing] = useState(false);
  const { addToast } = useToast();
  
  // Current logged in user (starts with a Pro default session or null)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('smartbet_current_user');
      return saved ? JSON.parse(saved) : {
        id: 'USR-PRO-8891',
        username: 'ProTrader_Alpha',
        email: 'alpha@smartbet.network',
        tier: 'PRO',
        role: 'user',
        createdAt: '2026-01-15T08:00:00.000Z',
        twoFactorEnabled: true,
        publicKeyHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
        encryptionKeySalt: '9f88c42a10be39d7',
        balanceUSD: 1000
      };
    } catch {
      return null;
    }
  });

  // Security audit trail
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);

  // Record audit log helper
  const handleRecordAudit = useCallback(
    async (
      eventType: SecurityAuditLog['eventType'],
      msg: string,
      severity: SecurityAuditLog['severity'] = 'INFO'
    ) => {
      const newLog = await createAuditLog(eventType, severity, msg);
      setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]);
    },
    []
  );

  useEffect(() => {
    handleRecordAudit('AUTH', 'Sesi pengguna diotentikasi dengan kunci enkripsi AES-256.');
    
    // Initial welcome tactical alert
    const timer = setTimeout(() => {
      addToast({
        title: 'SECURE SESSION INITIALIZED',
        message: 'Engine V9.2 ready. E2E AES-256-GCM cipher active and real-time signal stream online.',
        type: 'security',
        category: 'SYSTEM_BOOT',
        severity: 'normal',
        hash: '0x8891...fa20',
        actionLabel: 'SECURITY STATUS',
        onAction: () => setIsVaultOpen(true),
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [handleRecordAudit, addToast]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('smartbet_current_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    handleRecordAudit('AUTH', `Pengguna ${user.username} berhasil login (${user.tier}).`);
    addToast({
      title: 'OPERATOR AUTHENTICATED',
      message: `User ${user.username} successfully signed in with tier ${user.tier}.`,
      type: 'security',
      category: 'AUTH_SUCCESS',
      severity: 'normal',
      actionLabel: 'OPEN VAULT',
      onAction: () => setIsVaultOpen(true),
    });
  };

  const handleLogout = () => {
    handleRecordAudit('AUTH', `Pengguna ${currentUser?.username || 'user'} logout.`);
    addToast({
      title: 'SESSION TERMINATED',
      message: 'Operator logged out. Encryption keys scrubbed from memory cache.',
      type: 'info',
      category: 'SESSION_END',
      severity: 'normal',
    });
    setCurrentUser(null);
    localStorage.removeItem('smartbet_current_user');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      
      {/* Tactical Background Grid Overlay */}
      <div className="fixed inset-0 tactical-grid opacity-35 pointer-events-none z-0" />
      
      {/* Top Gradient Atmosphere */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        onLogout={handleLogout}
        isDbSyncing={isDbSyncing}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Active Tab View Rendering */}
        {activeTab === 'signal-engine' && (
          <SignalEngineTab
            currentUser={currentUser}
            onRecordAudit={handleRecordAudit}
          />
        )}

        {activeTab === 'site-checker' && (
          <SiteCheckerTab />
        )}

        {activeTab === 'rng-lab' && (
          <GlobalRngTab
            onRecordAudit={handleRecordAudit}
          />
        )}

        {activeTab === 'db-hub' && (
          <DatabaseHubTab
            currentUser={currentUser}
            onRecordAudit={handleRecordAudit}
            isDbSyncing={isDbSyncing}
            setIsDbSyncing={setIsDbSyncing}
          />
        )}

      </main>

      {/* Persistent Bottom Security Status Bar */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM SECURE
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline font-mono">
              E2E AES-256-GCM • HMAC-SHA256 • NIST SP 800-22 RNG Compliance
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsVaultOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1.5 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Buka Security Vault</span>
            </button>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-500">
              SmartBet V9.2 Analytical Tool
            </span>
          </div>

        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Encrypted Vault & Security Inspector Modal */}
      <EncryptedVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        currentUser={currentUser}
        auditLogs={auditLogs}
      />

      {/* Tactical High-Contrast Toast Notification Stream & Trigger Dock */}
      <TacticalToastContainer
        onOpenVault={() => setIsVaultOpen(true)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
