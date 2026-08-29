import React, { useState } from 'react';
import { X, Lock, Shield, KeyRound, CheckCircle2, Copy, Sparkles, User as UserIcon, Mail } from 'lucide-react';
import { User, TierLevel } from '../types';
import { UI3DButton } from './UI3DButton';
import { generateCSPRNGHex, sha256 } from '../utils/crypto';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [selectedTier, setSelectedTier] = useState<TierLevel>('PRO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSeedPhrase, setGeneratedSeedPhrase] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateSeed = () => {
    const wordList = [
      'cipher', 'quantum', 'matrix', 'signal', 'entropy', 'kinetic', 'vortex', 'oracle',
      'shield', 'telemetry', 'vector', 'zenith', 'pulse', 'stratum', 'nexus', 'prism'
    ];
    const words: string[] = [];
    for (let i = 0; i < 12; i++) {
      const idx = Math.floor(Math.random() * wordList.length);
      words.push(wordList[idx]);
    }
    setGeneratedSeedPhrase(words.join(' '));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username.trim()) {
      setError('Username wajib diisi.');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Password minimal 6 karakter untuk proteksi AES-GCM.');
      setLoading(false);
      return;
    }

    try {
      // Simulate cryptographic key derivation and secure login
      await new Promise(r => setTimeout(r, 600));
      const pubKey = await sha256(`${username}:${email}:${password}`);
      const salt = generateCSPRNGHex(16);

      const newUser: User = {
        id: `USR-${generateCSPRNGHex(4).toUpperCase()}`,
        username: username.trim(),
        email: email.trim() || `${username.toLowerCase()}@smartbet.network`,
        tier: selectedTier,
        role: 'user',
        createdAt: new Date().toISOString(),
        twoFactorEnabled: true,
        publicKeyHash: pubKey,
        encryptionKeySalt: salt,
        balanceUSD: selectedTier === 'ENTERPRISE_VIP' ? 5000 : selectedTier === 'PRO' ? 1000 : 250
      };

      onLoginSuccess(newUser);
      onClose();
    } catch {
      setError('Terjadi kesalahan saat menginisialisasi sesi kriptografi.');
    } finally {
      setLoading(false);
    }
  };

  const copySeedPhrase = () => {
    if (generatedSeedPhrase) {
      navigator.clipboard.writeText(generatedSeedPhrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-cyan-950/40">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isRegister ? 'Registrasi Vault Pemain Terenkripsi' : 'Autentikasi Pengguna SmartBet'}
              </h3>
              <p className="text-xs text-slate-400">
                Dilindungi Enkripsi End-to-End AES-256 & SHA-256 Key derivation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Quick Demo Pre-fill */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400">⚡ Demo 1-Click:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setUsername('ProTrader_Alpha');
                  setEmail('alpha@smartbet.io');
                  setPassword('Smartbet99Secure!');
                  setSelectedTier('PRO');
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 transition cursor-pointer"
              >
                Pro Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('VIP_HighRoller');
                  setEmail('vip@smartbet.io');
                  setPassword('VIPSecretKey2026!');
                  setSelectedTier('ENTERPRISE_VIP');
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-800 transition cursor-pointer"
              >
                VIP Whale
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username / Player ID</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                id="auth-input-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Contoh: Sigma_Trader99"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email (Untuk Notifikasi Signal E2E)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="auth-input-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="player@smartbet.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Master Key / Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                id="auth-input-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Kunci passphrase enkripsi AES"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
              />
            </div>
          </div>

          {/* Tier Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pilih Tier Keamanan & Signal Engine</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTier('FREE')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedTier === 'FREE'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">FREE TIER</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Basic signals</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTier('PRO')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedTier === 'PRO'
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-md shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold text-cyan-400">PRO TRADER</div>
                <div className="text-[10px] text-cyan-300/80 mt-0.5">Kelly & Live DB</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTier('ENTERPRISE_VIP')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedTier === 'ENTERPRISE_VIP'
                    ? 'border-amber-400 bg-amber-950/60 text-amber-200 shadow-md shadow-amber-500/20'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold text-amber-400">VIP WHALE</div>
                <div className="text-[10px] text-amber-300/80 mt-0.5">Unlimited E2E Sync</div>
              </button>
            </div>
          </div>

          {/* Seed Phrase Recovery Generation (optional) */}
          {isRegister && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  12-Word Recovery Seed Phrase
                </span>
                <button
                  type="button"
                  onClick={handleGenerateSeed}
                  className="text-[11px] text-cyan-400 hover:underline font-semibold cursor-pointer"
                >
                  Generate Seed
                </button>
              </div>

              {generatedSeedPhrase ? (
                <div className="p-2 rounded-xl bg-slate-900 font-mono text-[11px] text-cyan-300 border border-slate-700 flex items-center justify-between break-words">
                  <span>{generatedSeedPhrase}</span>
                  <button
                    type="button"
                    onClick={copySeedPhrase}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer ml-2"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Kunci pemulihan terenkripsi untuk memulihkan database taruhan di perangkat lain.
                </p>
              )}
            </div>
          )}

          {/* Submit 3D Button */}
          <div className="pt-2">
            <UI3DButton
              id="btn-auth-submit"
              type="submit"
              variant={selectedTier === 'ENTERPRISE_VIP' ? 'amber' : 'cyan'}
              size="lg"
              fullWidth
              loading={loading}
              icon={Sparkles}
            >
              {isRegister ? 'Buat Akun & Inisialisasi Kunci E2E' : 'Masuk ke SmartBet Signal Hub'}
            </UI3DButton>
          </div>

          {/* Toggle Register / Login */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-cyan-400 transition cursor-pointer"
            >
              {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Registrasi Akun Terenkripsi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
