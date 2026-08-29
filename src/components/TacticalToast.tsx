import React, { useState, useEffect, useRef } from 'react';
import { ToastNotification, ToastType } from '../types';
import { useToast } from '../context/ToastContext';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Dices,
  Database,
  Info,
  X,
  Volume2,
  VolumeX,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const typeConfig: Record<
  ToastType,
  {
    icon: React.ElementType;
    borderColor: string;
    glowShadow: string;
    accentBg: string;
    textColor: string;
    badgeBg: string;
    badgeText: string;
    barColor: string;
    indicatorDot: string;
  }
> = {
  signal: {
    icon: Zap,
    borderColor: 'border-cyan-500/70',
    glowShadow: 'shadow-[0_0_25px_rgba(6,182,212,0.25)]',
    accentBg: 'bg-cyan-950/40',
    textColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/90 border-cyan-700/60',
    badgeText: 'text-cyan-300',
    barColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
    indicatorDot: 'bg-cyan-400',
  },
  security: {
    icon: ShieldCheck,
    borderColor: 'border-emerald-500/70',
    glowShadow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    accentBg: 'bg-emerald-950/40',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/90 border-emerald-700/60',
    badgeText: 'text-emerald-300',
    barColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    indicatorDot: 'bg-emerald-400',
  },
  threat: {
    icon: AlertTriangle,
    borderColor: 'border-red-500/80',
    glowShadow: 'shadow-[0_0_30px_rgba(239,68,68,0.35)]',
    accentBg: 'bg-red-950/50',
    textColor: 'text-red-400',
    badgeBg: 'bg-red-950/90 border-red-700/60',
    badgeText: 'text-red-300',
    barColor: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]',
    indicatorDot: 'bg-red-400',
  },
  rng: {
    icon: Dices,
    borderColor: 'border-indigo-500/70',
    glowShadow: 'shadow-[0_0_25px_rgba(99,102,241,0.25)]',
    accentBg: 'bg-indigo-950/40',
    textColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-950/90 border-indigo-700/60',
    badgeText: 'text-indigo-300',
    barColor: 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]',
    indicatorDot: 'bg-indigo-400',
  },
  sync: {
    icon: Database,
    borderColor: 'border-teal-500/70',
    glowShadow: 'shadow-[0_0_25px_rgba(20,184,166,0.25)]',
    accentBg: 'bg-teal-950/40',
    textColor: 'text-teal-400',
    badgeBg: 'bg-teal-950/90 border-teal-700/60',
    badgeText: 'text-teal-300',
    barColor: 'bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)]',
    indicatorDot: 'bg-teal-400',
  },
  info: {
    icon: Info,
    borderColor: 'border-slate-700',
    glowShadow: 'shadow-[0_0_15px_rgba(148,163,184,0.15)]',
    accentBg: 'bg-slate-900/60',
    textColor: 'text-slate-300',
    badgeBg: 'bg-slate-900 border-slate-700',
    badgeText: 'text-slate-400',
    barColor: 'bg-slate-400',
    indicatorDot: 'bg-slate-400',
  },
};

export const TacticalToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 5000;
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  const cfg = typeConfig[toast.type] || typeConfig.info;
  const IconComponent = cfg.icon;

  useEffect(() => {
    if (isPaused) return;

    const interval = 25;
    const timer = setInterval(() => {
      remainingTimeRef.current -= interval;
      const pct = Math.max(0, (remainingTimeRef.current / duration) * 100);
      setProgress(pct);

      if (remainingTimeRef.current <= 0) {
        clearInterval(timer);
        onDismiss(toast.id);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, duration, onDismiss, toast.id]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div
      id={`tactical-toast-${toast.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        group relative w-full sm:w-[410px] rounded-xl bg-slate-950/95 backdrop-blur-xl border ${cfg.borderColor}
        ${cfg.glowShadow} transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden select-none
      `}
    >
      {/* Tactical Corner HUD Brackets */}
      <span className="absolute top-1 left-1.5 text-[9px] font-mono text-slate-600 leading-none pointer-events-none select-none">
        ⌜
      </span>
      <span className="absolute top-1 right-1.5 text-[9px] font-mono text-slate-600 leading-none pointer-events-none select-none">
        ⌝
      </span>
      <span className="absolute bottom-2.5 left-1.5 text-[9px] font-mono text-slate-600 leading-none pointer-events-none select-none">
        ⌞
      </span>
      <span className="absolute bottom-2.5 right-1.5 text-[9px] font-mono text-slate-600 leading-none pointer-events-none select-none">
        ⌟
      </span>

      {/* Main Toast Inner Layout */}
      <div className="p-4 space-y-2.5">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            
            {/* Status Ping Dot */}
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.indicatorDot}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.indicatorDot}`} />
            </span>

            {/* Category / Scope Tag */}
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md border ${cfg.badgeBg} ${cfg.badgeText}`}>
              {toast.category || toast.type.toUpperCase()}
            </span>

            {/* Confidence or Code badge if provided */}
            {toast.confidence !== undefined && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-black rounded bg-black/60 text-white border border-cyan-500/40 flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 text-cyan-400" />
                {toast.confidence.toFixed(1)}%
              </span>
            )}

            {toast.code && !toast.confidence && (
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                [{toast.code}]
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500">
              {toast.timestamp}
            </span>
            <button
              id={`btn-dismiss-toast-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-slate-800 transition cursor-pointer"
              title="Dismiss Alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${cfg.accentBg} ${cfg.textColor} border ${cfg.borderColor} shrink-0 mt-0.5`}>
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="text-xs font-black uppercase tracking-tight text-white leading-tight font-sans">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-300 font-normal leading-relaxed break-words">
              {toast.message}
            </p>

            {/* Hash proof badge if provided */}
            {toast.hash && (
              <div className="pt-1">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 truncate block max-w-full">
                  HASH: {toast.hash}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button Ribbon (Optional) */}
        {toast.actionLabel && (
          <div className="pt-1 flex items-center justify-end">
            <button
              onClick={() => {
                if (toast.onAction) toast.onAction();
                onDismiss(toast.id);
              }}
              className={`
                px-3 py-1 text-[11px] font-mono font-bold uppercase rounded-lg border transition cursor-pointer flex items-center gap-1.5
                ${cfg.accentBg} ${cfg.textColor} ${cfg.borderColor} hover:bg-white hover:text-black hover:border-white shadow-sm
              `}
            >
              <span>{toast.actionLabel}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

      </div>

      {/* Real-time Countdown Linear Progress Bar */}
      <div className="w-full h-1 bg-slate-900">
        <div
          className={`h-full transition-all ease-linear ${cfg.barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const TacticalToastContainer: React.FC<{
  onOpenVault?: () => void;
  onSelectTab?: (tab: 'signal-engine' | 'site-checker' | 'rng-lab' | 'db-hub') => void;
}> = ({ onOpenVault, onSelectTab }) => {
  const { toasts, removeToast, clearAllToasts, soundEnabled, setSoundEnabled, triggerSimulatedAlert } = useToast();
  const [showSimPanel, setShowSimPanel] = useState(false);

  // Attach interactive navigation handlers to toasts if not provided
  const handleToastAction = (toast: ToastNotification) => {
    if (toast.onAction) {
      toast.onAction();
      return;
    }

    if (toast.type === 'signal' && onSelectTab) {
      onSelectTab('signal-engine');
    } else if (toast.type === 'security' && onOpenVault) {
      onOpenVault();
    } else if (toast.type === 'rng' && onSelectTab) {
      onSelectTab('rng-lab');
    } else if (toast.type === 'sync' && onSelectTab) {
      onSelectTab('db-hub');
    } else if (toast.type === 'threat' && onOpenVault) {
      onOpenVault();
    }
  };

  return (
    <>
      {/* Floating Tactical Toast Stack in Bottom-Right Screen */}
      <div
        id="tactical-toast-stack"
        className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3 max-w-[calc(100vw-2rem)] pointer-events-auto"
      >
        {/* Floating Quick Action & Audio Toolbar when toasts are present or for live simulation */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-md text-xs">
          
          {/* Sound Synthesizer Toggle */}
          <button
            id="btn-toast-sound-toggle"
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
              soundEnabled
                ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/60'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
            title={soundEnabled ? 'Mute Tactical Audio Synthesizer' : 'Enable Tactical Audio Synthesizer'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
          </button>

          {/* Quick Simulation Trigger Button */}
          <button
            id="btn-toast-sim-trigger"
            onClick={() => setShowSimPanel(prev => !prev)}
            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
              showSimPanel
                ? 'text-indigo-300 bg-indigo-950/60 border border-indigo-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Toggle Real-time Alerts Simulation Bar"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="hidden sm:inline">ALERTS DISPATCH</span>
          </button>

          {/* Clear All Toasts */}
          {toasts.length > 0 && (
            <button
              id="btn-toast-clear-all"
              onClick={clearAllToasts}
              className="px-2 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              CLEAR ({toasts.length})
            </button>
          )}
        </div>

        {/* Expanded Quick Trigger Simulation Panel */}
        {showSimPanel && (
          <div className="w-full sm:w-[410px] p-3 rounded-xl bg-slate-950/95 border border-indigo-500/50 shadow-2xl backdrop-blur-xl space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-300 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-indigo-400" />
                Live Event Dispatcher
              </span>
              <button
                onClick={() => setShowSimPanel(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              <button
                onClick={() => triggerSimulatedAlert('signal')}
                className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 transition cursor-pointer text-left truncate flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>+ Signal Capture</span>
              </button>

              <button
                onClick={() => triggerSimulatedAlert('threat')}
                className="p-1.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition cursor-pointer text-left truncate flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                <span>+ Threat Alert</span>
              </button>

              <button
                onClick={() => triggerSimulatedAlert('security')}
                className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 transition cursor-pointer text-left truncate flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>+ E2E Key Proof</span>
              </button>

              <button
                onClick={() => triggerSimulatedAlert('rng')}
                className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 transition cursor-pointer text-left truncate flex items-center gap-1"
              >
                <Dices className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>+ NIST RNG Event</span>
              </button>
            </div>
          </div>
        )}

        {/* Toast Items Stream */}
        <div className="flex flex-col gap-2.5 w-full items-end">
          {toasts.map(toast => (
            <TacticalToastItem
              key={toast.id}
              toast={{
                ...toast,
                onAction: () => handleToastAction(toast),
              }}
              onDismiss={removeToast}
            />
          ))}
        </div>
      </div>
    </>
  );
};
