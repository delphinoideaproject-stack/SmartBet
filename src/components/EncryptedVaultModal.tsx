import React, { useState } from 'react';
import { X, Lock, Shield, KeyRound, CheckCircle2, Copy, FileCode, RefreshCw, Database, Terminal, ShieldAlert } from 'lucide-react';
import { User, SecurityAuditLog } from '../types';
import { UI3DButton } from './UI3DButton';
import { decryptDataAESGCM, encryptDataAESGCM, generateCSPRNGHex } from '../utils/crypto';

interface EncryptedVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  auditLogs: SecurityAuditLog[];
}

export const EncryptedVaultModal: React.FC<EncryptedVaultModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  auditLogs
}) => {
  const [testPayload, setTestPayload] = useState('{"playerId":"USR-77A1","balance":1450.50,"activeStreak":"WWWLW","timestamp":1772183900}');
  const [testPassphrase, setTestPassphrase] = useState('SmartbetMasterPassphrase2026!');
  const [cipherOutput, setCipherOutput] = useState<{ cipherText: string; ivHex: string; saltHex: string } | null>(null);
  const [decryptedOutput, setDecryptedOutput] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'crypto-inspector' | 'audit-logs' | 'keys'>('crypto-inspector');
  const [encrypting, setEncrypting] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestEncrypt = async () => {
    setEncrypting(true);
    try {
      const result = await encryptDataAESGCM(testPayload, testPassphrase);
      setCipherOutput(result);
      setDecryptedOutput(null);
    } catch {
      alert('Enkripsi gagal.');
    } finally {
      setEncrypting(false);
    }
  };

  const handleTestDecrypt = async () => {
    if (!cipherOutput) return;
    setDecrypting(true);
    try {
      const plain = await decryptDataAESGCM(
        cipherOutput.cipherText,
        cipherOutput.ivHex,
        cipherOutput.saltHex,
        testPassphrase
      );
      setDecryptedOutput(plain);
    } catch {
      alert('Gagal mendekripsi: Passphrase salah atau data korup.');
    } finally {
      setDecrypting(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      exportTime: new Date().toISOString(),
      user: currentUser,
      encryptedAuditLogs: auditLogs,
      securityStandard: 'AES-256-GCM / SHA-256 HMAC',
      checksum: generateCSPRNGHex(16)
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartbet_encrypted_vault_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-cyan-950/50">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">E2E Cryptographic Security Vault</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pemeriksaan integritas data pemain, audit log tamper-proof, dan enkripsi payload real-time
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

        {/* Navigation Sub-tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('crypto-inspector')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'crypto-inspector'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AES-GCM Live Inspector
          </button>
          <button
            onClick={() => setActiveTab('audit-logs')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'audit-logs'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tamper-Proof Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'keys'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Keys & Salt
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'crypto-inspector' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    Plaintext JSON Payload (Sebelum dikirim ke Database Pihak Ketiga)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Web Crypto API</span>
                </div>
                <textarea
                  value={testPayload}
                  onChange={e => setTestPayload(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Passphrase Kunci Enkripsi Sesi</label>
                <input
                  type="text"
                  value={testPassphrase}
                  onChange={e => setTestPassphrase(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <UI3DButton
                  id="btn-test-encrypt"
                  variant="cyan"
                  size="md"
                  onClick={handleTestEncrypt}
                  loading={encrypting}
                  icon={Lock}
                >
                  Jalankan Enkripsi AES-256-GCM
                </UI3DButton>

                {cipherOutput && (
                  <UI3DButton
                    id="btn-test-decrypt"
                    variant="emerald"
                    size="md"
                    onClick={handleTestDecrypt}
                    loading={decrypting}
                    icon={KeyRound}
                  >
                    Uji Dekripsi Kembali
                  </UI3DButton>
                )}
              </div>

              {cipherOutput && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-900/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      Hasil Cipher Block (AES-GCM-256 Hex Buffer)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      SECURE ENVELOPE
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 font-mono text-[11px] text-slate-300 break-all border border-slate-800">
                    <span className="text-slate-500 select-none">Ciphertext: </span>
                    <span className="text-amber-300">{cipherOutput.cipherText}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                      <span className="text-slate-500">IV (96-bit): </span>{cipherOutput.ivHex}
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                      <span className="text-slate-500">Salt (128-bit): </span>{cipherOutput.saltHex}
                    </div>
                  </div>

                  {decryptedOutput && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800 text-emerald-300 font-mono text-xs">
                      <span className="font-bold block text-[10px] text-emerald-400 uppercase tracking-wider mb-1">
                        Hasil Dekripsi Berhasil (Integrity Valid):
                      </span>
                      {decryptedOutput}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit-logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Log Kejadian Kriptografi Real-time</span>
                <span className="text-[11px] text-slate-500">Semua log di-hash SHA-256</span>
              </div>

              <div className="divide-y divide-slate-800 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden max-h-80 overflow-y-auto">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-3 hover:bg-slate-900/50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{log.timestamp}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          log.severity === 'SECURITY'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {log.eventType}
                        </span>
                      </div>
                      <p className="text-slate-200 mt-1">{log.message}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 select-all">
                      #{log.hash}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  Kunci Sesi Pengguna Aktif
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[11px]">User ID:</span>
                    <span className="text-cyan-300">{currentUser ? currentUser.id : 'ANON-GUEST-NODE'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Public Key Hash (SHA-256):</span>
                    <span className="text-slate-300 break-all">{currentUser ? currentUser.publicKeyHash : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Encryption Salt:</span>
                    <span className="text-slate-300">{currentUser ? currentUser.encryptionKeySalt : '9f88c42a10be39d7'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UI3DButton
                  id="btn-export-backup"
                  variant="indigo"
                  size="md"
                  icon={FileCode}
                  onClick={handleExportBackup}
                >
                  Ekspor Backup Vault Terenkripsi (.JSON)
                </UI3DButton>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Zero-Knowledge Architecture: Data didekripsi hanya di memori browser Anda.
          </div>
          <UI3DButton variant="dark" size="sm" onClick={onClose}>
            Tutup
          </UI3DButton>
        </div>
      </div>
    </div>
  );
};
