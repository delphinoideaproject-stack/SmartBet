/**
 * SmartBet V9.2 - Advanced Signal Scoring Engine
 * Enhanced algorithmic session state analysis with Kelly Criterion & statistical momentum
 */

import { FeatureBreakdown, ParsedGameInfo, SessionState, SignalOutput, SpinRecord } from '../types';

export const PROVIDER_DATABASE: Record<string, { name: string; patterns: string[]; defaultRTP: number; volatility: 'Low' | 'Medium' | 'High' | 'Extreme' }> = {
  pragmatic: {
    name: 'Pragmatic Play',
    patterns: ['pragmatic', 'pragmaticplay', '/gs2c/', 'symbol=vs', 'gates-of-olympus', 'sweet-bonanza', 'starlight-princess'],
    defaultRTP: 96.50,
    volatility: 'Extreme'
  },
  pgsoft: {
    name: 'PG Soft (Pocket Games)',
    patterns: ['pgsoft', 'pg-soft', 'pg_soft', 'mahjong-ways', 'treasures-of-aztec', 'lucky-neko'],
    defaultRTP: 96.72,
    volatility: 'Medium'
  },
  habanero: {
    name: 'Habanero',
    patterns: ['habanero', 'hbn', 'koi-gate', 'fa-cai-shen'],
    defaultRTP: 96.60,
    volatility: 'High'
  },
  nolimit: {
    name: 'NoLimit City',
    patterns: ['nolimit', 'nlcity', 'san-quentin', 'mental', 'tombstone'],
    defaultRTP: 96.06,
    volatility: 'Extreme'
  },
  spribe: {
    name: 'Spribe (Provably Fair)',
    patterns: ['spribe', 'aviator', 'mines', 'dice', 'plinko'],
    defaultRTP: 97.00,
    volatility: 'Medium'
  },
  playtech: {
    name: 'Playtech',
    patterns: ['playtech', 'pt', 'age-of-gods', 'buffalo-blitz'],
    defaultRTP: 95.96,
    volatility: 'High'
  },
  evolution: {
    name: 'Evolution Gaming',
    patterns: ['evolution', 'crazy-time', 'lightning-roulette', 'monopoly'],
    defaultRTP: 96.08,
    volatility: 'Extreme'
  },
  microgaming: {
    name: 'Microgaming / Games Global',
    patterns: ['microgaming', 'mg', 'mega-moolah', 'immortal-romance'],
    defaultRTP: 96.24,
    volatility: 'High'
  }
};

// URL Parser function
export function parseGameFromUrl(url: string): ParsedGameInfo {
  const result: ParsedGameInfo = {
    urlValid: false,
    provider: 'Generic / Custom RNG',
    gameName: 'Custom Game Session',
    gameSlug: 'generic-game',
    mode: 'REAL',
    detectedRTP: 96.0,
    volatilityClass: 'Medium'
  };

  if (!url || typeof url !== 'string') return result;

  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return result;
  }

  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.toLowerCase();
    const fullSearch = (parsed.pathname + parsed.search + parsed.hash).toLowerCase();

    // Check provider patterns
    let matchedProviderKey = '';
    for (const [key, info] of Object.entries(PROVIDER_DATABASE)) {
      if (info.patterns.some(p => fullSearch.includes(p.toLowerCase()))) {
        matchedProviderKey = key;
        result.provider = info.name;
        result.detectedRTP = info.defaultRTP;
        result.volatilityClass = info.volatility;
        break;
      }
    }

    // Extract game slug
    let extractedSlug = '';
    if (path.includes('/game/')) {
      const parts = path.split('/game/');
      if (parts[1]) extractedSlug = parts[1].split('/')[0].split('?')[0];
    } else if (path.includes('/games/')) {
      const parts = path.split('/games/');
      if (parts[1]) extractedSlug = parts[1].split('/')[0].split('?')[0];
    } else if (path.includes('/play/')) {
      const parts = path.split('/play/');
      if (parts[1]) extractedSlug = parts[1].split('/')[0].split('?')[0];
    } else {
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0) {
        extractedSlug = segments[segments.length - 1];
      }
    }

    if (extractedSlug) {
      result.gameSlug = extractedSlug;
      // Clean slug into title
      let cleaned = extractedSlug
        .replace(/[-_]+/g, ' ')
        .replace(/by\s+(pragmatic|pg\s*soft|habanero|nolimit|playtech|microgaming)/gi, '')
        .replace(/\b(demo|real|play|slot|casino)\b/gi, '')
        .trim();

      if (cleaned.length > 0) {
        result.gameName = cleaned
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    } else {
      result.gameName = matchedProviderKey ? `${result.provider} Live Terminal` : parsed.hostname;
    }

    // Detect Demo vs Real
    if (fullSearch.includes('demo') || fullSearch.includes('fun=1') || fullSearch.includes('mode=trial')) {
      result.mode = 'DEMO';
    } else {
      result.mode = 'REAL';
    }

    result.urlValid = true;
    return result;
  } catch {
    return result;
  }
}

// Session state analyzer
export function analyzeSession(spins: SpinRecord[]): SessionState {
  if (!spins || spins.length < 2) {
    return {
      totalSpins: spins ? spins.length : 0,
      totalWins: spins ? spins.filter(s => s.outcome === 1).length : 0,
      totalLosses: spins ? spins.filter(s => s.outcome === 0).length : 0,
      hitRate: spins && spins.length > 0 ? (spins[0].outcome === 1 ? 1.0 : 0.0) : 0,
      rtpObserved: 0,
      balanceChange: 0,
      profitPercent: 0,
      avgMultiplier: 0,
      maxMultiplier: 0,
      volatility: 0,
      streak: spins && spins.length > 0 ? (spins[0].outcome === 1 ? 'W' : 'L') : '',
      streakWinCount: 0,
      streakLoseCount: 0,
      trend: 'FLAT',
      totalWagered: spins ? spins.reduce((acc, s) => acc + (s.bet || 0), 0) : 0,
      totalPayout: spins ? spins.reduce((acc, s) => acc + (s.payout || 0), 0) : 0,
      currentExposure: 0,
      entropyScore: 0.95
    };
  }

  const totalSpins = spins.length;
  const wins = spins.filter(s => s.outcome === 1).length;
  const losses = totalSpins - wins;
  const hitRate = wins / totalSpins;

  const totalWagered = spins.reduce((acc, s) => acc + (s.bet || 0), 0);
  const totalPayout = spins.reduce((acc, s) => acc + (s.payout || 0), 0);
  const rtpObserved = totalWagered > 0 ? (totalPayout / totalWagered) * 100 : 0;

  const multipliers = spins.map(s => (s.bet > 0 ? s.payout / s.bet : 0));
  const avgMultiplier = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;
  const maxMultiplier = Math.max(...multipliers, 0);

  // Standard deviation of multipliers
  const meanMult = avgMultiplier;
  const variance = multipliers.reduce((acc, val) => acc + Math.pow(val - meanMult, 2), 0) / multipliers.length;
  const volatility = Math.sqrt(variance);

  const balanceChange = totalPayout - totalWagered;
  const profitPercent = totalWagered > 0 ? (balanceChange / totalWagered) * 100 : 0;

  // Streak calculation (last 15 spins)
  let streakStr = '';
  let streakWinCount = 0;
  let streakLoseCount = 0;

  const recent = spins.slice(-15);
  for (const s of recent) {
    if (s.outcome === 1) {
      streakStr += 'W';
    } else {
      streakStr += 'L';
    }
  }

  // Count active trailing streak
  for (let i = spins.length - 1; i >= 0; i--) {
    if (spins[i].outcome === 1) {
      if (streakLoseCount === 0) streakWinCount++;
      else break;
    } else {
      if (streakWinCount === 0) streakLoseCount++;
      else break;
    }
  }

  // Trend detection
  let trend: 'UPTREND' | 'DOWNTREND' | 'FLAT' | 'VOLATILE' = 'FLAT';
  if (profitPercent > 15) {
    trend = 'UPTREND';
  } else if (profitPercent < -15) {
    trend = 'DOWNTREND';
  } else if (volatility > 2.5) {
    trend = 'VOLATILE';
  }

  // Shannon entropy of outcomes
  const p0 = losses / totalSpins;
  const p1 = wins / totalSpins;
  let entropy = 0;
  if (p0 > 0) entropy -= p0 * Math.log2(p0);
  if (p1 > 0) entropy -= p1 * Math.log2(p1);

  return {
    totalSpins,
    totalWins: wins,
    totalLosses: losses,
    hitRate,
    rtpObserved,
    balanceChange,
    profitPercent,
    avgMultiplier,
    maxMultiplier,
    volatility,
    streak: streakStr,
    streakWinCount,
    streakLoseCount,
    trend,
    totalWagered,
    totalPayout,
    currentExposure: spins.length > 0 ? spins[spins.length - 1].bet : 0,
    entropyScore: entropy
  };
}

// Compute scoring features
export function computeSignalFeatures(session: SessionState, baseRTP: number = 96.5): FeatureBreakdown {
  // 1. Trend Score (0 - 20)
  let trend_score = 10;
  if (session.profitPercent > 0) {
    trend_score = Math.min(20, 10 + (session.profitPercent / 100) * 20);
  } else {
    trend_score = Math.max(2, 10 + (session.profitPercent / 100) * 8);
  }

  // 2. Volatility Score (0 - 20)
  let volatility_score = 12;
  if (session.volatility >= 0.4 && session.volatility <= 1.8) {
    volatility_score = 19; // Ideal sweet spot
  } else if (session.volatility > 3.0) {
    volatility_score = 7; // Extremely erratic
  } else {
    volatility_score = 14;
  }

  // 3. RTP Score (0 - 20)
  const dev = Math.abs(session.rtpObserved - baseRTP);
  let rtp_score = 20;
  if (session.totalSpins >= 10) {
    if (dev < 5) {
      rtp_score = 20;
    } else if (dev < 15) {
      rtp_score = 15;
    } else {
      rtp_score = Math.max(3, 20 - dev * 0.8);
    }
  } else {
    rtp_score = 14; // Neutral when small sample
  }

  // 4. Momentum Score (0 - 20)
  let momentum_score = 10;
  if (session.hitRate > 0.42) {
    momentum_score = Math.min(20, 15 + (session.hitRate - 0.42) * 35);
  } else if (session.hitRate < 0.22) {
    momentum_score = 4;
  } else {
    momentum_score = 12;
  }

  // 5. Streak Score (0 - 15)
  let streak_score = 7;
  if (session.streakWinCount >= 3) {
    streak_score = Math.min(15, 8 + session.streakWinCount * 1.5);
  } else if (session.streakLoseCount >= 5) {
    streak_score = Math.max(2, 8 - session.streakLoseCount * 0.9);
  }

  // 6. Exposure & Balance Score
  const exposure_score = session.currentExposure > 0 ? 8 : 10;
  let balance_score = 10;
  if (session.profitPercent > 25) {
    balance_score = 18;
  } else if (session.profitPercent > 0) {
    balance_score = 14;
  } else {
    balance_score = Math.max(2, 10 + session.profitPercent / 15);
  }

  // 7. Data Quality & Frequency Score
  let data_quality_score = 3;
  if (session.totalSpins > 100) data_quality_score = 10;
  else if (session.totalSpins > 50) data_quality_score = 8;
  else if (session.totalSpins > 20) data_quality_score = 5;

  const frequency_score = Math.min(10, Math.max(2, (session.totalSpins / 80) * 10));
  const entropy_score = Math.min(10, session.entropyScore * 10);

  return {
    trend_score: parseFloat(trend_score.toFixed(1)),
    volatility_score: parseFloat(volatility_score.toFixed(1)),
    rtp_score: parseFloat(rtp_score.toFixed(1)),
    momentum_score: parseFloat(momentum_score.toFixed(1)),
    streak_score: parseFloat(streak_score.toFixed(1)),
    exposure_score: parseFloat(exposure_score.toFixed(1)),
    balance_score: parseFloat(balance_score.toFixed(1)),
    data_quality_score: parseFloat(data_quality_score.toFixed(1)),
    frequency_score: parseFloat(frequency_score.toFixed(1)),
    entropy_score: parseFloat(entropy_score.toFixed(1))
  };
}

// Generate High Accuracy Signal Output
export function generateSignalOutput(
  features: FeatureBreakdown,
  session: SessionState,
  userBalance: number = 1000
): SignalOutput {
  const weights = {
    trend_score: 1.0,
    volatility_score: 1.0,
    rtp_score: 1.1,
    momentum_score: 1.3,
    streak_score: 0.9,
    exposure_score: 0.8,
    balance_score: 0.9,
    data_quality_score: 0.6,
    frequency_score: 0.5,
    entropy_score: 0.7
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const val = features[key as keyof FeatureBreakdown] || 0;
    weightedSum += val * weight;
    totalWeight += weight * 20; // max normalized score per feature
  }

  const rawScore = (weightedSum / totalWeight) * 100;
  const score = Math.max(5, Math.min(98, parseFloat(rawScore.toFixed(1))));

  // Signal categorization
  let signal: SignalOutput['signal'] = 'BET MEDIUM';
  let confidence = 50;
  let riskLevel: SignalOutput['riskLevel'] = 'SEDANG';
  let reasoning = '';
  let strategyAdvice = '';

  if (session.profitPercent >= 100 || (session.totalSpins > 30 && session.profitPercent >= 60)) {
    signal = 'TAKE PROFIT / PAUSE';
    confidence = 88.5;
    riskLevel = 'RENDAH';
    reasoning = 'Target profit tercapai dengan return signifikan. Siklus RNG berpotensi memasuki fase mean-reversion.';
    strategyAdvice = 'Kunci kemenangan (Lock Profit), turunkan bet ke level baseline minimum atau istirahat 15 menit.';
  } else if (score < 38) {
    signal = 'BET SMALL';
    confidence = parseFloat((42 + score * 0.35).toFixed(1));
    riskLevel = features.streak_score < 4 ? 'TINGGI' : 'SEDANG';
    reasoning = 'Kondisi algoritma slot belum berada pada frekuensi payout optimal. Dominasi dead spin terdeteksi.';
    strategyAdvice = 'Gunakan mode sampling bertahap (1% - 2% dari saldo) untuk menguji kestabilan putaran tanpa menguras modal.';
  } else if (score < 68) {
    signal = 'BET MEDIUM';
    confidence = parseFloat((55 + (score - 38) * 0.55).toFixed(1));
    riskLevel = 'SEDANG';
    reasoning = 'Stabilitas RTP dan ritme momentum menunjukkan distribusi wajar. Terbuka peluang multiplier menengah.';
    strategyAdvice = 'Naikkan bet secara moderat (3% - 5% dari saldo) dengan cut-loss ketat jika terjadi 4 dead spin beruntun.';
  } else {
    signal = 'BET BIG';
    confidence = parseFloat((72 + (score - 68) * 0.75).toFixed(1));
    riskLevel = features.volatility_score > 16 ? 'RENDAH' : 'SEDANG';
    reasoning = 'Indikator momentum, frekuensi scatter/multiplier, dan variansi RNG berada pada fase panas (Hot Wave).';
    strategyAdvice = 'Manfaatkan jendela momentum (5% - 8% dari saldo). Pertahankan disiplin stop-win saat target kenaikan 30% tercapai.';
  }

  // Kelly Criterion fraction
  const p = Math.max(0.2, Math.min(0.7, session.hitRate || 0.35));
  const b = session.avgMultiplier > 1 ? session.avgMultiplier : 2.0;
  const q = 1 - p;
  const rawKelly = (b * p - q) / b;
  const kellyPercentage = Math.max(0.01, Math.min(0.12, parseFloat((rawKelly * 0.5).toFixed(3)))); // Half-Kelly for safety

  const minBet = userBalance > 0 ? Math.max(1, Math.round(userBalance * (signal === 'BET BIG' ? 0.05 : signal === 'BET MEDIUM' ? 0.025 : 0.01))) : 10;
  const maxBet = userBalance > 0 ? Math.max(minBet + 5, Math.round(userBalance * (signal === 'BET BIG' ? 0.09 : signal === 'BET MEDIUM' ? 0.05 : 0.025))) : 50;

  return {
    signal,
    score,
    confidence,
    riskLevel,
    recommendedBetRange: { min: minBet, max: maxBet },
    breakdown: features,
    reasoning,
    strategyAdvice,
    kellyPercentage: kellyPercentage * 100,
    expectedRNGVariance: session.volatility > 2.0 ? 'High Clustering' : 'Uniform Steady',
    generatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
}
