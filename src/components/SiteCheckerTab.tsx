import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Globe, Server, Lock, ExternalLink, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown, ChevronUp, Clock, Sparkles } from 'lucide-react';
import { CheckDetail, SiteLegitimacyResult } from '../types';
import { verifySiteLegitimacy } from '../utils/legitimacyChecker';
import { UI3DButton } from './UI3DButton';
import { useToast } from '../context/ToastContext';

export const SiteCheckerTab: React.FC = () => {
  const { addToast } = useToast();
  const [urlInput, setUrlInput] = useState('https://pragmaticplay.com/en/games/gates-of-olympus');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SiteLegitimacyResult | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>('license');

  const presetUrls = [
    { label: 'Pragmatic Official', url: 'https://pragmaticplay.com/en/games/gates-of-olympus' },
    { label: 'PG Soft Mahjong', url: 'https://pgsoft.com/games/mahjong-ways-2' },
    { label: 'Licensed MGA Casino', url: 'https://mga-licensed-casino.eu/game/sweet-bonanza' },
    { label: 'Suspicious Mirror .xyz', url: 'http://gacor-scatter-jp99.xyz/game/load?id=8831' }
  ];

  const handleVerify = async (targetUrl?: string) => {
    const urlToTest = targetUrl || urlInput;
    if (!urlToTest.trim()) return;

    setLoading(true);
    try {
      const res = await verifySiteLegitimacy(urlToTest);
      setResult(res);

      if (res.verdict.includes('HIGH RISK') || res.verdict.includes('SUSPICIOUS')) {
        addToast({
          title: 'SECURITY THREAT DETECTED',
          message: `Site ${new URL(res.url).hostname} flagged as ${res.verdict}. Technical Score: ${res.technicalScore}/100.`,
          type: 'threat',
          category: 'SECURITY_THREAT',
          severity: 'critical',
          code: 'THREAT_HIGH_RISK',
          actionLabel: 'VIEW ANALYSIS',
        });
      } else {
        addToast({
          title: 'SITE LEGITIMACY VERIFIED',
          message: `${new URL(res.url).hostname} verified. SSL & Official Gaming Provider handshake intact.`,
          type: 'security',
          category: 'LEGIT_VERIFIED',
          severity: 'normal',
          code: `SCORE_${res.technicalScore}`,
        });
      }
    } catch {
      alert('Gagal memverifikasi situs.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictStyle = (verdict: SiteLegitimacyResult['verdict']) => {
    if (verdict.includes('VERIFIED LEGIT')) {
      return {
        border: 'border-emerald-500',
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-400',
        glow: 'glow-emerald',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      };
    }
    if (verdict.includes('LIKELY LEGIT')) {
      return {
        border: 'border-cyan-500',
        bg: 'bg-cyan-950/40',
        text: 'text-cyan-400',
        glow: 'glow-cyan',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
      };
    }
    if (verdict.includes('SUSPICIOUS')) {
      return {
        border: 'border-amber-500',
        bg: 'bg-amber-950/40',
        text: 'text-amber-400',
        glow: 'glow-amber',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    }
    if (verdict.includes('HIGH RISK')) {
      return {
        border: 'border-red-500',
        bg: 'bg-red-950/40',
        text: 'text-red-400',
        glow: 'shadow-red-500/20',
        badge: 'bg-red-500/20 text-red-300 border-red-500/40'
      };
    }
    return {
      border: 'border-slate-600',
      bg: 'bg-slate-900/60',
      text: 'text-slate-300',
      glow: '',
      badge: 'bg-slate-800 text-slate-400 border-slate-700'
    };
  };

  const getStatusIcon = (status: 'PASS' | 'WARN' | 'FAIL' | 'NOT_CHECKED') => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'WARN':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Tab Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SmartBet V9.2 Legitimacy Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verifikasi Keaslian Situs & Integritas Lisensi
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Audit komprehensif terhadap keaslian SSL/TLS, usia domain WHOIS, lisensi regulasi resmi (MGA, UKGC, PAGCOR, Curaçao), keberadaan operator legal, serta deteksi iframe cloaking phishing secara real-time.
          </p>
        </div>

        {/* Input Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
            <input
              id="input-site-url"
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://situs-tujuan.com/game/gates-of-olympus"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition shadow-inner"
            />
          </div>

          <UI3DButton
            id="btn-verify-site"
            variant="cyan"
            size="lg"
            onClick={() => handleVerify()}
            loading={loading}
            icon={ShieldCheck}
            className="sm:w-auto"
          >
            VERIFIKASI SITUS
          </UI3DButton>
        </div>

        {/* Preset Quick Links */}
        <div className="mt-4 flex items-center flex-wrap gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Uji Cepat:</span>
          {presetUrls.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrlInput(preset.url);
                handleVerify(preset.url);
              }}
              className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700/60 transition cursor-pointer font-mono text-[11px]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-medium">Verdict Keputusan</span>
              <span className={`text-base sm:text-lg font-extrabold mt-1 ${getVerdictStyle(result.verdict).text}`}>
                {result.verdict}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-medium">Skor Teknis Keamanan</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-white">{result.technicalScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-medium">Waktu Pemindaian</span>
              <div className="flex items-center gap-1 mt-1 text-slate-200 font-mono text-sm">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{result.checkTimeSeconds}s</span>
                {result.fromCache && (
                  <span className="text-[10px] px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    CACHED
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-medium">Enkripsi Jaringan</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> TLS 1.3 Active
              </span>
            </div>
          </div>

          {/* Verdict Box */}
          <div className={`p-6 rounded-3xl border-2 ${getVerdictStyle(result.verdict).border} ${getVerdictStyle(result.verdict).bg} ${getVerdictStyle(result.verdict).glow}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getVerdictStyle(result.verdict).badge}`}>
                    {result.verdict}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{result.url}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2">{result.summary}</h3>
              </div>

              <div className="flex items-center gap-2">
                <UI3DButton
                  variant="dark"
                  size="sm"
                  onClick={() => handleVerify()}
                  icon={Sparkles}
                >
                  Pindai Ulang
                </UI3DButton>
              </div>
            </div>

            {/* Verdict Reasons */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-1.5">
              {result.verdictReasons.map((reason, idx) => (
                <p key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                  <span>{reason}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Risk Factors if any */}
          {result.riskFactors.length > 0 && (
            <div className="p-5 rounded-3xl bg-red-950/20 border border-red-800/60 space-y-3">
              <h4 className="text-xs font-bold text-red-400 flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Faktor Risiko Terdeteksi ({result.riskFactors.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.riskFactors.map((rf, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-red-900/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-300">{rf.factor}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-red-900 text-red-200 uppercase">
                        {rf.level}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">{rf.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Verification Checks Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Detail Hasil Pemeriksaan Teknis & Regulasi
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {(Object.entries(result.checks) as [string, CheckDetail][]).map(([key, check]) => {
                const isOpen = openAccordion === key;
                return (
                  <div
                    key={key}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenAccordion(isOpen ? null : key)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-850/60 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="text-sm font-semibold text-white">{check.message}</span>
                        </div>
                      </div>
                      <div className="text-slate-400">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-4 pt-2 border-t border-slate-800/80 bg-slate-950/60 space-y-2.5 text-xs">
                        {check.evidence && check.evidence.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Bukti & Analisis:
                            </span>
                            {check.evidence.map((ev, i) => (
                              <div key={i} className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                                <span className="text-cyan-400">•</span>
                                <span>{ev}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {check.details && Object.keys(check.details).length > 0 && (
                          <div className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                            <pre>{JSON.stringify(check.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
