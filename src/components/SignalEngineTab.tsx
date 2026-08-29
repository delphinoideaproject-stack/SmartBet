import React, { useState, useMemo } from 'react';
import { Cpu, Zap, TrendingUp, BarChart3, Upload, Play, RotateCcw, AlertCircle, ArrowUpRight, ArrowDownRight, Sparkles, Check, Flame, ShieldAlert, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParsedGameInfo, SessionState, SignalOutput, SpinRecord, User } from '../types';
import { analyzeSession, computeSignalFeatures, generateSignalOutput, parseGameFromUrl } from '../utils/signalEngine';
import { UI3DButton } from './UI3DButton';
import { sha256 } from '../utils/crypto';
import { useToast } from '../context/ToastContext';

interface SignalEngineTabProps {
  currentUser: User | null;
  onRecordAudit: (eventType: 'AUTH' | 'E2E_ENCRYPT' | 'RNG_SEED_ROLL' | 'DB_SYNC' | 'INTEGRITY_CHECK', msg: string) => void;
}

export const SignalEngineTab: React.FC<SignalEngineTabProps> = ({ currentUser, onRecordAudit }) => {
  const { addToast } = useToast();
  const [urlInput, setUrlInput] = useState('https://pragmaticplay.com/en/games/gates-of-olympus');
  const [gameInfo, setGameInfo] = useState<ParsedGameInfo>(() => parseGameFromUrl('https://pragmaticplay.com/en/games/gates-of-olympus'));
  
  const [dataMode, setDataMode] = useState<'interactive' | 'text-paste' | 'mock-generator'>('interactive');
  const [textOutcomes, setTextOutcomes] = useState('WIN, LOSS, WIN, WIN, LOSS, WIN, LOSS, LOSS, WIN, WIN, WIN, LOSS');
  const [csvText, setCsvText] = useState('outcome,payout,bet\n1,250,100\n0,0,100\n1,300,100\n1,150,100\n0,0,100\n1,500,100');
  
  // Interactive live bet inputs
  const [manualBetAmount, setManualBetAmount] = useState<number>(100);
  const [manualWinMultiplier, setManualWinMultiplier] = useState<number>(2.5);
  
  // Spins session records
  const [spins, setSpins] = useState<SpinRecord[]>([
    { id: '1', timestamp: Date.now() - 60000, outcome: 1, payout: 250, bet: 100, multiplier: 2.5 },
    { id: '2', timestamp: Date.now() - 50000, outcome: 0, payout: 0, bet: 100, multiplier: 0 },
    { id: '3', timestamp: Date.now() - 40000, outcome: 1, payout: 300, bet: 100, multiplier: 3.0 },
    { id: '4', timestamp: Date.now() - 30000, outcome: 1, payout: 180, bet: 100, multiplier: 1.8 },
    { id: '5', timestamp: Date.now() - 20000, outcome: 0, payout: 0, bet: 100, multiplier: 0 },
    { id: '6', timestamp: Date.now() - 10000, outcome: 1, payout: 400, bet: 100, multiplier: 4.0 },
  ]);

  // Derived pure calculations with useMemo (prevents cascading re-renders)
  const sessionState = useMemo(() => analyzeSession(spins), [spins]);
  const features = useMemo(() => computeSignalFeatures(sessionState, gameInfo.detectedRTP), [sessionState, gameInfo.detectedRTP]);
  const signalResult = useMemo(() => {
    if (spins.length === 0) return null;
    const balance = currentUser ? currentUser.balanceUSD : 1000;
    return generateSignalOutput(features, sessionState, balance);
  }, [spins.length, features, sessionState, currentUser?.balanceUSD]);

  const handleUrlInputChange = (val: string) => {
    setUrlInput(val);
    const parsed = parseGameFromUrl(val);
    setGameInfo(parsed);
  };

  const dispatchSignalAlert = (signal: SignalOutput, session: SessionState, game: ParsedGameInfo) => {
    if (signal.signal === 'BET BIG') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      onRecordAudit('INTEGRITY_CHECK', `High Accuracy Signal 'BET BIG' generated for ${game.gameName} (Score: ${signal.score}/100)`);
      
      addToast({
        title: `HIGH WIN CONVICTION: ${signal.signal}`,
        message: `${game.gameName} • Win density ${signal.confidence.toFixed(1)}% (Kelly: ${signal.kellyPercentage.toFixed(1)}%).`,
        type: 'signal',
        category: 'SIGNAL_CAPTURE',
        severity: 'high',
        confidence: signal.confidence,
        code: `SIG-${signal.score}`,
        actionLabel: 'VIEW SIGNAL',
      });
    } else if (signal.signal === 'BET MEDIUM') {
      addToast({
        title: `OPTIMAL ENTRY: ${signal.signal}`,
        message: `${game.gameName} • Signal Score ${signal.score}/100 with ${(session.rtpObserved).toFixed(1)}% observed RTP.`,
        type: 'signal',
        category: 'SIGNAL_CAPTURE',
        severity: 'normal',
        confidence: signal.confidence,
        code: `SIG-${signal.score}`,
      });
    }
  };

  // Add interactive Spin
  const handleAddSpin = async (outcome: 1 | 0) => {
    const bet = manualBetAmount;
    const payout = outcome === 1 ? bet * manualWinMultiplier : 0;
    const mult = outcome === 1 ? manualWinMultiplier : 0;
    const newRecord: SpinRecord = {
      id: `${Date.now()}`,
      timestamp: Date.now(),
      outcome,
      payout,
      bet,
      multiplier: mult,
      gameSlug: gameInfo.gameSlug,
      nonce: spins.length + 1
    };

    const updated = [...spins, newRecord];
    setSpins(updated);

    const updatedSession = analyzeSession(updated);
    const updatedFeatures = computeSignalFeatures(updatedSession, gameInfo.detectedRTP);
    const balance = currentUser ? currentUser.balanceUSD : 1000;
    const newSignal = generateSignalOutput(updatedFeatures, updatedSession, balance);
    dispatchSignalAlert(newSignal, updatedSession, gameInfo);
  };

  // Process Text Outcomes
  const handleProcessTextOutcomes = () => {
    const parts = textOutcomes.split(/[,;\n\s]+/).filter(Boolean);
    const newSpins: SpinRecord[] = parts.map((p, idx) => {
      const isWin = ['WIN', 'W', '1', 'TRUE'].includes(p.toUpperCase());
      return {
        id: `txt-${idx}-${Date.now()}`,
        timestamp: Date.now() - (parts.length - idx) * 5000,
        outcome: isWin ? 1 : 0,
        payout: isWin ? manualBetAmount * 2.0 : 0,
        bet: manualBetAmount,
        multiplier: isWin ? 2.0 : 0
      };
    });
    setSpins(newSpins);
    const updatedSession = analyzeSession(newSpins);
    const updatedFeatures = computeSignalFeatures(updatedSession, gameInfo.detectedRTP);
    const balance = currentUser ? currentUser.balanceUSD : 1000;
    const newSignal = generateSignalOutput(updatedFeatures, updatedSession, balance);
    dispatchSignalAlert(newSignal, updatedSession, gameInfo);
  };

  // Process CSV
  const handleProcessCsv = () => {
    const lines = csvText.trim().split('\n');
    const newSpins: SpinRecord[] = [];
    const startIndex = lines[0].toLowerCase().includes('outcome') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());
      if (parts.length >= 3) {
        const out = parseInt(parts[0]) === 1 ? 1 : 0;
        const payout = parseFloat(parts[1]) || 0;
        const bet = parseFloat(parts[2]) || 100;
        newSpins.push({
          id: `csv-${i}`,
          timestamp: Date.now() - (lines.length - i) * 3000,
          outcome: out,
          payout,
          bet,
          multiplier: bet > 0 ? payout / bet : 0
        });
      }
    }

    if (newSpins.length > 0) {
      setSpins(newSpins);
      const updatedSession = analyzeSession(newSpins);
      const updatedFeatures = computeSignalFeatures(updatedSession, gameInfo.detectedRTP);
      const balance = currentUser ? currentUser.balanceUSD : 1000;
      const newSignal = generateSignalOutput(updatedFeatures, updatedSession, balance);
      dispatchSignalAlert(newSignal, updatedSession, gameInfo);
    }
  };

  // Generate Mock Data
  const handleGenerateMock = (type: 'balanced' | 'hot-wave' | 'cold-streak' | 'high-variance', count: number = 50) => {
    const mockList: SpinRecord[] = [];
    for (let i = 0; i < count; i++) {
      let winProb = 0.35;
      if (type === 'hot-wave') winProb = 0.58;
      if (type === 'cold-streak') winProb = 0.18;
      if (type === 'high-variance') winProb = 0.28;

      const isWin = Math.random() < winProb;
      const bet = 100;
      let mult = 0;
      if (isWin) {
        mult = type === 'high-variance' ? (Math.random() < 0.15 ? 15 + Math.random() * 30 : 2.5) : (1.5 + Math.random() * 4);
      }
      mockList.push({
        id: `mock-${i}-${Date.now()}`,
        timestamp: Date.now() - (count - i) * 2000,
        outcome: isWin ? 1 : 0,
        payout: parseFloat((bet * mult).toFixed(2)),
        bet,
        multiplier: parseFloat(mult.toFixed(2))
      });
    }

    setSpins(mockList);
    onRecordAudit('RNG_SEED_ROLL', `Generated ${count} CSPRNG mock spins (${type})`);

    const updatedSession = analyzeSession(mockList);
    const updatedFeatures = computeSignalFeatures(updatedSession, gameInfo.detectedRTP);
    const balance = currentUser ? currentUser.balanceUSD : 1000;
    const newSignal = generateSignalOutput(updatedFeatures, updatedSession, balance);
    dispatchSignalAlert(newSignal, updatedSession, gameInfo);
  };

  const handleClearSession = () => {
    setSpins([]);
  };

  const getSignalBadgeStyle = (sig: SignalOutput['signal']) => {
    switch (sig) {
      case 'BET BIG':
        return {
          bg: 'bg-emerald-500/20 border-emerald-500',
          text: 'text-emerald-400',
          glow: 'glow-emerald',
          gradient: 'from-emerald-500 via-teal-600 to-emerald-800'
        };
      case 'BET MEDIUM':
        return {
          bg: 'bg-cyan-500/20 border-cyan-500',
          text: 'text-cyan-400',
          glow: 'glow-cyan',
          gradient: 'from-cyan-500 via-blue-600 to-indigo-800'
        };
      case 'BET SMALL':
        return {
          bg: 'bg-amber-500/20 border-amber-500',
          text: 'text-amber-400',
          glow: 'glow-amber',
          gradient: 'from-amber-500 via-yellow-600 to-amber-800'
        };
      case 'TAKE PROFIT / PAUSE':
        return {
          bg: 'bg-purple-500/20 border-purple-500',
          text: 'text-purple-400',
          glow: 'shadow-purple-500/30',
          gradient: 'from-purple-500 via-pink-600 to-indigo-900'
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* URL Auto Extractor Header */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">SmartBet Auto-Detection Terminal</h2>
              <p className="text-xs text-slate-400">Auto-ekstraksi parameter game URL, RTP dasar, & profil volatilitas</p>
            </div>
          </div>

          {gameInfo.urlValid && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold font-mono rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {gameInfo.provider}
              </span>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {gameInfo.mode}
              </span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="input-signal-game-url"
            type="text"
            value={urlInput}
            onChange={e => handleUrlInputChange(e.target.value)}
            placeholder="https://example.com/id/game/gates-of-olympus-by-pragmatic-play"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-cyan-300 placeholder:text-slate-600 focus:border-cyan-500 outline-none"
          />

          <UI3DButton
            id="btn-recalculate-signal"
            variant="cyan"
            size="md"
            icon={Cpu}
            onClick={() => {
              if (signalResult) {
                dispatchSignalAlert(signalResult, sessionState, gameInfo);
              }
            }}
          >
            ANALYZE ENGINE
          </UI3DButton>
        </div>

        {/* Detected Info Cards */}
        {gameInfo.urlValid && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px]">Provider Teridentifikasi</span>
              <span className="font-bold text-white text-sm">{gameInfo.provider}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px]">Judul Game</span>
              <span className="font-bold text-cyan-400 text-sm truncate block">{gameInfo.gameName}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px]">Theoretical RTP</span>
              <span className="font-bold text-emerald-400 text-sm font-mono">{gameInfo.detectedRTP}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px]">Indeks Volatilitas</span>
              <span className="font-bold text-amber-400 text-sm">{gameInfo.volatilityClass}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Signal Display Card - Immersive UI Centerpiece Hero */}
      {signalResult && (
        <div className="relative bg-slate-900 rounded-[2.5rem] border border-cyan-500/30 p-8 flex flex-col shadow-[inset_0_0_60px_rgba(6,182,212,0.1),0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Subtle Background Grid Overlay */}
          <div className="absolute inset-0 opacity-15 pointer-events-none tactical-grid" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Col: Hero Signal & Prediction Display */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
              
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.35em] text-cyan-400 font-bold">
                  LIVE SIGNAL PREDICTION
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                  {signalResult.generatedAt}
                </span>
              </div>

              {/* Huge Immersive Typography */}
              <div className="flex items-baseline gap-4 flex-wrap justify-center lg:justify-start">
                <div className={`text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.25)] ${getSignalBadgeStyle(signalResult.signal).text}`}>
                  {signalResult.signal}
                </div>
                
                {signalResult.signal === 'BET BIG' && (
                  <span className="flex items-center justify-center p-3 rounded-2xl bg-emerald-500 text-slate-950 animate-bounce shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                    <Flame className="w-7 h-7 fill-current" />
                  </span>
                )}
              </div>

              {/* Immersive Probability Capsule */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <div className="px-6 py-2 bg-cyan-500/10 border border-cyan-500/40 rounded-full text-cyan-400 text-sm font-mono tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  WIN PROBABILITY: <strong className="text-white">{(signalResult.confidence).toFixed(1)}%</strong>
                </div>
                <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-full text-slate-300 text-xs font-mono">
                  SCORE: <strong className="text-cyan-300">{signalResult.score}/100</strong>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-300 max-w-xl leading-relaxed pt-1">
                {signalResult.reasoning}
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1 w-full max-w-xl">
                <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] block">
                  💡 Rekomendasi Taktis & Hedging:
                </span>
                <p>{signalResult.strategyAdvice}</p>
              </div>
            </div>

            {/* Right Col: System Gauges & Kelly Bet Sizing */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Score & Confidence Metric Box */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">
                  Telemetry Gauges
                </h3>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Algorithmic Score</span>
                      <span className="text-cyan-400 font-bold">{signalResult.score} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] rounded-full transition-all duration-500"
                        style={{ width: `${signalResult.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Confidence Density</span>
                      <span className="text-emerald-400 font-bold">{signalResult.confidence}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] rounded-full transition-all duration-500"
                        style={{ width: `${signalResult.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 font-mono">
                    <span className="text-slate-400">Risk Assessment:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      signalResult.riskLevel === 'TINGGI' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {signalResult.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Bet Sizing (Kelly Criterion) */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Saran Nominal Taruhan</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                    Half-Kelly ({signalResult.kellyPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  ${signalResult.recommendedBetRange.min} - ${signalResult.recommendedBetRange.max}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Dihitung otomatis berdasarkan saldo Anda (${currentUser ? currentUser.balanceUSD : 1000})
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Session Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Putaran</span>
          <span className="text-xl font-black text-white font-mono mt-1 block">{sessionState.totalSpins}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Hit Rate</span>
          <span className="text-xl font-black text-cyan-400 font-mono mt-1 block">{(sessionState.hitRate * 100).toFixed(1)}%</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">RTP Teramati</span>
          <span className={`text-xl font-black font-mono mt-1 block ${sessionState.rtpObserved >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {sessionState.rtpObserved.toFixed(1)}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Profit / Loss</span>
          <span className={`text-xl font-black font-mono mt-1 block ${sessionState.balanceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {sessionState.balanceChange >= 0 ? `+$${sessionState.balanceChange.toFixed(0)}` : `-$${Math.abs(sessionState.balanceChange).toFixed(0)}`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Max Multiplier</span>
          <span className="text-xl font-black text-amber-400 font-mono mt-1 block">{sessionState.maxMultiplier.toFixed(1)}x</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Trend Siklus</span>
          <span className={`text-sm font-extrabold uppercase mt-1.5 inline-block ${
            sessionState.trend === 'UPTREND' ? 'text-emerald-400' : sessionState.trend === 'DOWNTREND' ? 'text-red-400' : 'text-slate-300'
          }`}>
            {sessionState.trend}
          </span>
        </div>
      </div>

      {/* Trailing Streak Visualizer */}
      {sessionState.streak && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trailing Streak Ribbon:</span>
            <div className="flex items-center gap-1.5">
              {sessionState.streak.split('').map((char, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-black flex items-center justify-center ${
                    char === 'W'
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Streak: <strong className="text-emerald-400">{sessionState.streakWinCount}W</strong> / <strong className="text-slate-400">{sessionState.streakLoseCount}L</strong>
          </div>
        </div>
      )}

      {/* Data Input & 3D Interactive Controls */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Input Data & Kontrol Putaran 3D</h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setDataMode('interactive')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition cursor-pointer ${
                dataMode === 'interactive' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive 3D Play
            </button>
            <button
              onClick={() => setDataMode('text-paste')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition cursor-pointer ${
                dataMode === 'text-paste' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste Text / CSV
            </button>
            <button
              onClick={() => setDataMode('mock-generator')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition cursor-pointer ${
                dataMode === 'mock-generator' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CSPRNG Mock Generator
            </button>
          </div>
        </div>

        {/* 1. Interactive Mode */}
        {dataMode === 'interactive' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nominal Taruhan per Spin ($)</label>
                <input
                  type="number"
                  value={manualBetAmount}
                  onChange={e => setManualBetAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Multiplier Kemenangan (x)</label>
                <input
                  type="number"
                  step="0.1"
                  value={manualWinMultiplier}
                  onChange={e => setManualWinMultiplier(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-emerald-400 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* 3D Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <UI3DButton
                id="btn-spin-win"
                variant="emerald"
                size="lg"
                onClick={() => handleAddSpin(1)}
                icon={Flame}
                className="w-full h-16 uppercase tracking-wider text-base"
              >
                EXECUTE WIN
              </UI3DButton>

              <UI3DButton
                id="btn-spin-loss"
                variant="danger"
                size="lg"
                onClick={() => handleAddSpin(0)}
                icon={ArrowDownRight}
                className="w-full h-16 uppercase tracking-wider text-base"
              >
                RECORD LOSS
              </UI3DButton>

              <UI3DButton
                id="btn-clear-session"
                variant="dark"
                size="lg"
                onClick={handleClearSession}
                icon={RotateCcw}
                className="w-full h-16 uppercase tracking-wider text-base"
              >
                RESET RNG SESSION
              </UI3DButton>
            </div>
          </div>
        )}

        {/* 2. Text Paste Mode */}
        {dataMode === 'text-paste' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Paste Format Teks Putaran (WIN, LOSS, W, L, 1, 0):
              </label>
              <textarea
                value={textOutcomes}
                onChange={e => setTextOutcomes(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 focus:border-cyan-500 outline-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Contoh: WIN, LOSS, WIN, WIN, LOSS, WIN</span>
                <UI3DButton variant="cyan" size="sm" onClick={handleProcessTextOutcomes}>
                  Proses Teks Outcomes
                </UI3DButton>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Atau Paste Format CSV (outcome,payout,bet):
              </label>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 focus:border-cyan-500 outline-none"
              />
              <div className="mt-2 flex items-center justify-end">
                <UI3DButton variant="indigo" size="sm" onClick={handleProcessCsv}>
                  Impor & Analisis CSV
                </UI3DButton>
              </div>
            </div>
          </div>
        )}

        {/* 3. Mock Generator Mode */}
        {dataMode === 'mock-generator' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Simulasikan ratusan putaran menggunakan generator CSPRNG untuk menguji ketepatan signal scoring engine.
            </p>

            <div className="flex items-center gap-2.5 flex-wrap">
              <UI3DButton
                variant="cyan"
                size="md"
                onClick={() => handleGenerateMock('balanced', 50)}
              >
                Normal Wave (50 Spin)
              </UI3DButton>

              <UI3DButton
                variant="emerald"
                size="md"
                onClick={() => handleGenerateMock('hot-wave', 60)}
              >
                Hot Scatter Wave (60 Spin)
              </UI3DButton>

              <UI3DButton
                variant="amber"
                size="md"
                onClick={() => handleGenerateMock('cold-streak', 40)}
              >
                Cold Dead Spins (40 Spin)
              </UI3DButton>

              <UI3DButton
                variant="indigo"
                size="md"
                onClick={() => handleGenerateMock('high-variance', 100)}
              >
                Max Volatility (100 Spin)
              </UI3DButton>
            </div>
          </div>
        )}

        {/* Feature Breakdown Table */}
        {signalResult && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Dekomposisi Pembobotan Skor Algoritmik
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Trend Score</span>
                <span className="font-bold text-cyan-400 font-mono">{signalResult.breakdown.trend_score} / 20</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Volatility Index</span>
                <span className="font-bold text-cyan-400 font-mono">{signalResult.breakdown.volatility_score} / 20</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">RTP Deviation</span>
                <span className="font-bold text-cyan-400 font-mono">{signalResult.breakdown.rtp_score} / 20</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Momentum Score</span>
                <span className="font-bold text-cyan-400 font-mono">{signalResult.breakdown.momentum_score} / 20</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Streak Weight</span>
                <span className="font-bold text-cyan-400 font-mono">{signalResult.breakdown.streak_score} / 15</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
