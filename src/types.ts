/**
 * Global Type Definitions for SmartBet V9.2
 */

export type UserRole = 'user' | 'analyst' | 'admin';
export type TierLevel = 'FREE' | 'PRO' | 'ENTERPRISE_VIP';

export interface User {
  id: string;
  username: string;
  email: string;
  tier: TierLevel;
  role: UserRole;
  createdAt: string;
  twoFactorEnabled: boolean;
  publicKeyHash: string;
  encryptionKeySalt: string;
  balanceUSD: number;
}

export interface CheckDetail {
  status: 'PASS' | 'WARN' | 'FAIL' | 'NOT_CHECKED';
  message: string;
  details?: Record<string, unknown>;
  evidence?: string[];
}

export interface RiskFactor {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  factor: string;
  description: string;
}

export interface SiteLegitimacyResult {
  url: string;
  timestamp: string;
  fromCache?: boolean;
  checkTimeSeconds: number;
  technicalScore: number;
  verdict: '🟢 VERIFIED LEGIT' | '🟡 LIKELY LEGIT' | '⚪ UNVERIFIED' | '🟠 SUSPICIOUS' | '🔴 HIGH RISK';
  summary: string;
  verdictReasons: string[];
  riskFactors: RiskFactor[];
  checks: {
    https: CheckDetail;
    whois: CheckDetail;
    dns: CheckDetail;
    license: CheckDetail;
    operator: CheckDetail;
    provider: CheckDetail;
    iframe: CheckDetail;
    redirect: CheckDetail;
    encryptionGrade: CheckDetail;
  };
}

export interface SpinRecord {
  id: string;
  timestamp: number;
  outcome: 1 | 0; // 1 = win, 0 = loss
  payout: number;
  bet: number;
  multiplier: number;
  gameSlug?: string;
  nonce?: number;
  hashProof?: string;
}

export interface SessionState {
  totalSpins: number;
  totalWins: number;
  totalLosses: number;
  hitRate: number; // 0 to 1
  rtpObserved: number; // percentage e.g. 96.5%
  balanceChange: number;
  profitPercent: number;
  avgMultiplier: number;
  maxMultiplier: number;
  volatility: number;
  streak: string; // e.g. "WWLWLWW"
  streakWinCount: number;
  streakLoseCount: number;
  trend: 'UPTREND' | 'DOWNTREND' | 'FLAT' | 'VOLATILE';
  totalWagered: number;
  totalPayout: number;
  currentExposure: number;
  entropyScore: number;
}

export interface FeatureBreakdown {
  trend_score: number;
  volatility_score: number;
  rtp_score: number;
  momentum_score: number;
  streak_score: number;
  exposure_score: number;
  balance_score: number;
  data_quality_score: number;
  frequency_score: number;
  entropy_score: number;
}

export interface SignalOutput {
  signal: 'BET SMALL' | 'BET MEDIUM' | 'BET BIG' | 'TAKE PROFIT / PAUSE';
  score: number; // 0 - 100
  confidence: number; // 0 - 100%
  riskLevel: 'RENDAH' | 'SEDANG' | 'TINGGI' | 'EKSTREM';
  recommendedBetRange: {
    min: number;
    max: number;
  };
  breakdown: FeatureBreakdown;
  reasoning: string;
  strategyAdvice: string;
  kellyPercentage: number;
  expectedRNGVariance: string;
  generatedAt: string;
}

export interface ParsedGameInfo {
  urlValid: boolean;
  provider: string;
  gameName: string;
  gameSlug: string;
  mode: 'REAL' | 'DEMO' | 'SIMULATED';
  detectedRTP: number;
  volatilityClass: 'Low' | 'Medium' | 'High' | 'Extreme';
}

export interface ProvablyFairRecord {
  nonce: number;
  serverSeedHash: string;
  serverSeedRevealed?: string;
  clientSeed: string;
  combinedHash: string;
  normalizedRoll: number; // 0.0000 to 99.9999
  resultWin: boolean;
  multiplier: number;
  timestamp: number;
}

export interface NISTTestResults {
  monobitPass: boolean;
  monobitPValue: number;
  runsPass: boolean;
  runsPValue: number;
  chiSquarePass: boolean;
  chiSquareStat: number;
  entropyBits: number; // Max ~8.0
  sampleCount: number;
}

export type DatabaseType = 'POSTGRESQL' | 'SUPABASE' | 'FIRESTORE' | 'MYSQL' | 'REST_WEBHOOK';

export interface DatabaseConnectorConfig {
  id: string;
  name: string;
  type: DatabaseType;
  endpoint: string;
  apiKeyOrSecret: string;
  tableOrCollection: string;
  syncIntervalSec: number;
  autoSync: boolean;
  e2eEncryptionEnabled: boolean;
  encryptionKeyAlias: string;
  lastSyncTime?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  latencyMs: number;
}

export interface EncryptedSyncPacket {
  packetId: string;
  timestamp: number;
  senderId: string;
  ivHex: string;
  cipherText: string;
  authTagHex: string;
  signature: string;
  decryptedPreview?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  eventType: 'AUTH' | 'E2E_ENCRYPT' | 'RNG_SEED_ROLL' | 'DB_SYNC' | 'INTEGRITY_CHECK';
  severity: 'INFO' | 'SECURITY' | 'WARNING';
  message: string;
  hash: string;
}

export type ToastType = 'signal' | 'security' | 'rng' | 'sync' | 'threat' | 'info';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  category?: string;
  severity?: 'normal' | 'high' | 'critical';
  timestamp: string;
  code?: string;
  confidence?: number;
  hash?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}
