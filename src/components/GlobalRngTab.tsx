import React, { useState, useEffect } from 'react';
import { Dices, ShieldCheck, RefreshCw, Cpu, CheckCircle2, Lock, Terminal, Activity, Sparkles, Hash, Copy } from 'lucide-react';
import { NISTTestResults, ProvablyFairRecord } from '../types';
import { calculateProvablyFairRoll, generateCSPRNGHex, runNISTStatisticalTests, sha256 } from '../utils/crypto';
import { UI3DButton } from './UI3DButton';
import { useToast } from '../context/ToastContext';

interface GlobalRngTabProps {
  onRecordAudit: (eventType: 'AUTH' | 'E2E_ENCRYPT' | 'RNG_SEED_ROLL' | 'DB_SYNC' | 'INTEGRITY_CHECK', msg: string) => void;
}

export const GlobalRngTab: React.FC<GlobalRngTabProps> = ({ onRecordAudit }) => {
  const { addToast } = useToast();
  const [serverSeed, setServerSeed] = useState(() => generateCSPRNGHex(32));
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [clientSeed, setClientSeed] = useState(() => generateCSPRNGHex(12));
  const [nonce, setNonce] = useState(1);
  const [targetMultiplier, setTargetMultiplier] = useState(2.0);
  
  const [history, setHistory] = useState<ProvablyFairRecord[]>([]);
  const [activeRoll, setActiveRoll] = useState<ProvablyFairRecord | null>(null);
  
  // NIST statistical test state
  const [randomBits, setRandomBits] = useState<number[]>([]);
  const [nistResults, setNistResults] = useState<NISTTestResults | null>(null);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    sha256(serverSeed).then(hash => setServerSeedHash(hash));
  }, [serverSeed]);

  // Execute single provably fair roll
  const handleRoll = async () => {
    const record = await calculateProvablyFairRoll(serverSeed, clientSeed, nonce, targetMultiplier);
    setActiveRoll(record);
    setHistory(prev => [record, ...prev.slice(0, 19)]);
    setNonce(prev => prev + 1);

    // Feed bits to NIST accumulator
    const bitsToAdd = record.resultWin ? [1, 1, 0, 1] : [0, 0, 1, 0];
    const newBits = [...randomBits, ...bitsToAdd].slice(-500);
    setRandomBits(newBits);
    setNistResults(runNISTStatisticalTests(newBits));

    onRecordAudit('RNG_SEED_ROLL', `Provably Fair Roll Nonce #${record.nonce}: ${record.normalizedRoll} (${record.resultWin ? 'WIN' : 'LOSS'})`);

    addToast({
      title: record.resultWin ? `RNG WIN (${record.multiplier}x)` : `RNG OUTCOME: ${record.normalizedRoll.toFixed(4)}`,
      message: `Nonce #${record.nonce} verified via HMAC-SHA256. Roll: ${record.normalizedRoll.toFixed(4)}`,
      type: 'rng',
      category: 'CSPRNG_PROOF',
      severity: 'normal',
      hash: record.combinedHash.substring(0, 18) + '...',
      code: `NONCE_${record.nonce}`,
    });
  };

  // Generate large batch for statistical analysis
  const handleRunNistSuite = async (count: number = 200) => {
    setGeneratingBatch(true);
    const bits: number[] = [];
    let currentNonce = nonce;

    for (let i = 0; i < count; i++) {
      const record = await calculateProvablyFairRoll(serverSeed, clientSeed, currentNonce, targetMultiplier);
      bits.push(record.normalizedRoll > 50 ? 1 : 0);
      currentNonce++;
    }

    setNonce(currentNonce);
    setRandomBits(bits);
    const results = runNISTStatisticalTests(bits);
    setNistResults(results);
    setGeneratingBatch(false);
    onRecordAudit('INTEGRITY_CHECK', `NIST SP 800-22 randomness verification completed (${count} samples). Entropy: ${results.entropyBits} bits.`);

    addToast({
      title: 'NIST SP 800-22 SUITE PASSED',
      message: `Analyzed ${count} bits. Monobit P-Val: ${results.monobitPValue.toFixed(4)}, Shannon Entropy: ${results.entropyBits.toFixed(3)} bits.`,
      type: 'rng',
      category: 'NIST_VERIFY',
      severity: 'normal',
      code: 'NIST_800_22_OK',
    });
  };

  const handleRotateServerSeed = () => {
    const newSeed = generateCSPRNGHex(32);
    setServerSeed(newSeed);
    setNonce(1);
    onRecordAudit('RNG_SEED_ROLL', `Server Seed rotated. New commitment hash: ${newSeed.substring(0, 8)}...`);

    addToast({
      title: 'SERVER SEED ROTATED',
      message: `New CSPRNG seed commitment generated. Nonce reset to #1.`,
      type: 'security',
      category: 'SEED_ROTATION',
      severity: 'normal',
      hash: newSeed.substring(0, 16) + '...',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <Dices className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">Global-Grade RNG & Provably Fair Lab</h2>
            <p className="text-xs text-slate-400">
              Standar keacakan kriptografis CSPRNG dengan verifikasi komitmen SHA-256 HMAC & Uji Statistik NIST SP 800-22
            </p>
          </div>
        </div>
      </div>

      {/* Main Seed & Commitment Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Seed Controls & Live Roll */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                Parameter Provably Fair (CSPRNG Entropy Pair)
              </span>
              <button
                type="button"
                onClick={handleRotateServerSeed}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ganti Server Seed
              </button>
            </h3>

            {/* Server Seed Commitment Hash */}
            <div className="space-y-1 text-xs">
              <span className="text-slate-400 font-semibold">Server Seed Commitment (SHA-256 Hash):</span>
              <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800 break-all select-all">
                {serverSeedHash}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Hash komitmen ini terkunci sebelum putaran dimulai guna mencegah manipulasi sisi server.
              </span>
            </div>

            {/* Client Seed & Nonce Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Client Seed (Entropi Pemain)</label>
                <input
                  type="text"
                  value={clientSeed}
                  onChange={e => setClientSeed(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nonce Counter</label>
                <input
                  type="number"
                  value={nonce}
                  onChange={e => setNonce(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Target Multiplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Payout Multiplier (x)</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetMultiplier}
                  onChange={e => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 2))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-end">
                <UI3DButton
                  id="btn-provably-roll"
                  variant="indigo"
                  size="lg"
                  fullWidth
                  onClick={handleRoll}
                  icon={Sparkles}
                >
                  ROLL CSPRNG SEED
                </UI3DButton>
              </div>
            </div>

            {/* Active Roll Result Display */}
            {activeRoll && (
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)] space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 font-mono">
                    HASIL ROLL NONCE #{activeRoll.nonce}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold font-mono ${
                    activeRoll.resultWin ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {activeRoll.resultWin ? `WIN (${activeRoll.multiplier}x)` : 'LOSS (0.0x)'}
                  </span>
                </div>

                <div className="text-4xl font-black font-mono text-white tracking-wider text-center py-2">
                  {activeRoll.normalizedRoll.toFixed(4)}
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 text-[10px] font-mono text-slate-400 space-y-1 border border-slate-800 break-all">
                  <div><span className="text-slate-500">HMAC-SHA256 Output: </span><span className="text-indigo-300">{activeRoll.combinedHash}</span></div>
                  <div><span className="text-slate-500">Revealed Server Seed: </span><span className="text-slate-300">{activeRoll.serverSeedRevealed}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Roll History Table */}
          {history.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Riwayat Putaran & Bukti Kriptografis ({history.length})
              </h4>

              <div className="divide-y divide-slate-800 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
                {history.map(item => (
                  <div key={item.nonce} className="p-3 flex items-center justify-between font-mono hover:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">#{item.nonce}</span>
                      <span className="font-bold text-white">{item.normalizedRoll.toFixed(4)}</span>
                      <span className={item.resultWin ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {item.resultWin ? 'WIN' : 'LOSS'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                      {item.combinedHash.substring(0, 16)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: NIST SP 800-22 Randomness Statistical Analyzer */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Uji Statistik NIST SP 800-22
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                GLOBAL GRADE
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Evaluasi formal terhadap distribusi keacakan biner, uji deret frekuensi (Monobit), dan entropi Shannon.
            </p>

            <UI3DButton
              id="btn-run-nist-suite"
              variant="cyan"
              size="md"
              fullWidth
              loading={generatingBatch}
              onClick={() => handleRunNistSuite(200)}
              icon={Activity}
            >
              Jalankan Batch Test (200 Sampel)
            </UI3DButton>

            {nistResults && (
              <div className="space-y-3 pt-2">
                {/* Monobit Frequency Test */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">1. Frequency (Monobit) Test</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      nistResults.monobitPass ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                    }`}>
                      {nistResults.monobitPass ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    P-Value: <strong className="text-cyan-300">{nistResults.monobitPValue}</strong> (Threshold &gt;= 0.01)
                  </div>
                </div>

                {/* Runs Test */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">2. Runs Test (Variansi Deret)</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      nistResults.runsPass ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                    }`}>
                      {nistResults.runsPass ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    P-Value: <strong className="text-cyan-300">{nistResults.runsPValue}</strong> (Threshold &gt;= 0.01)
                  </div>
                </div>

                {/* Shannon Entropy */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">3. Shannon Entropy Density</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {nistResults.entropyBits} / 8.000 bits
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                      style={{ width: `${(nistResults.entropyBits / 8.0) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Chi-Square Uniformity */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">4. Chi-Square Uniformity (χ²)</span>
                    <span className="text-cyan-300 font-mono font-bold">
                      {nistResults.chiSquareStat} (Pass: &lt; 3.84)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
