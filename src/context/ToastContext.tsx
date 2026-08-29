import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ToastNotification, ToastType } from '../types';

interface ToastContextType {
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  triggerSimulatedAlert: (type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Web Audio API tactical sound synthesizer
function playTacticalBeep(type: ToastType) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.04, now);

    if (type === 'threat') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'signal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'security') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(990, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1040, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Audio might be blocked by autoplay policies
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('smartbet_toast_sound');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('smartbet_toast_sound', JSON.stringify(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toastInput: Omit<ToastNotification, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => {
      const id = toastInput.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = toastInput.timestamp || new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });

      const newToast: ToastNotification = {
        ...toastInput,
        id,
        timestamp,
        duration: toastInput.duration ?? (toastInput.severity === 'critical' ? 7000 : 5000),
      };

      if (soundEnabled) {
        playTacticalBeep(newToast.type);
      }

      setToasts(prev => [newToast, ...prev.slice(0, 4)]); // max 5 simultaneous toasts
      return id;
    },
    [soundEnabled]
  );

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const triggerSimulatedAlert = useCallback((specificType?: ToastType) => {
    const simulationPool: Array<Omit<ToastNotification, 'id' | 'timestamp'>> = [
      {
        title: 'HIGH-CONVICTION SIGNAL CAPTURED',
        message: 'Algorithmic probability matrix detected 88.4% Win Density on Gates of Olympus.',
        type: 'signal',
        category: 'SIGNAL_CAPTURE',
        severity: 'high',
        confidence: 88.4,
        code: 'SIG-B992-OPT',
        actionLabel: 'VIEW SIGNAL',
      },
      {
        title: 'AES-256 SESSION KEY RE-SEEDED',
        message: 'Diffie-Hellman ephemeral keypair rotated. Zero-knowledge authentication proof verified.',
        type: 'security',
        category: 'E2E_VAULT',
        severity: 'normal',
        hash: '0x8f3c...b129',
        actionLabel: 'AUDIT LOG',
      },
      {
        title: 'RNG ENTROPY INTEGRITY VERIFIED',
        message: 'NIST SP 800-22 Monobit & Runs test passed (P-Value 0.6189 > 0.01).',
        type: 'rng',
        category: 'CSPRNG_PROOF',
        severity: 'normal',
        code: 'NIST-PASS-22',
        hash: 'SHA256:d41d8c...5fe',
      },
      {
        title: 'DATABASE REPLICATION PACKET COMMITTED',
        message: 'PostgreSQL encrypted payload #4829 successfully synced (latency 18ms).',
        type: 'sync',
        category: 'DB_STREAM',
        severity: 'normal',
        code: 'SYNC_200_OK',
      },
      {
        title: 'SECURITY THREAT DEFLECTED',
        message: 'Anomalous iframe injection & unsigned telemetry packet blocked by E2E firewall.',
        type: 'threat',
        category: 'FIREWALL_ALERT',
        severity: 'critical',
        code: 'SEC_BLOCK_403',
        actionLabel: 'INSPECT THREAT',
      },
    ];

    let selected = simulationPool[Math.floor(Math.random() * simulationPool.length)];
    if (specificType) {
      const match = simulationPool.find(p => p.type === specificType);
      if (match) selected = match;
    }

    addToast(selected);
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearAllToasts,
        soundEnabled,
        setSoundEnabled,
        triggerSimulatedAlert,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
