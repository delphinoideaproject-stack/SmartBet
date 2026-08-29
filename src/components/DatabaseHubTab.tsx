import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Lock, Zap, Server, Plus, CheckCircle2, AlertCircle, Play, Send, Key, FileJson, Activity } from 'lucide-react';
import { DatabaseConnectorConfig, EncryptedSyncPacket, User } from '../types';
import { createEncryptedSyncPacket, INITIAL_DB_CONFIGS } from '../utils/dbConnector';
import { UI3DButton } from './UI3DButton';
import { useToast } from '../context/ToastContext';

interface DatabaseHubTabProps {
  currentUser: User | null;
  onRecordAudit: (eventType: 'AUTH' | 'E2E_ENCRYPT' | 'RNG_SEED_ROLL' | 'DB_SYNC' | 'INTEGRITY_CHECK', msg: string) => void;
  isDbSyncing: boolean;
  setIsDbSyncing: (val: boolean) => void;
}

export const DatabaseHubTab: React.FC<DatabaseHubTabProps> = ({
  currentUser,
  onRecordAudit,
  isDbSyncing,
  setIsDbSyncing,
}) => {
  const { addToast } = useToast();
  const [connectors, setConnectors] = useState<DatabaseConnectorConfig[]>(INITIAL_DB_CONFIGS);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>(INITIAL_DB_CONFIGS[0].id);
  const [liveStreamPackets, setLiveStreamPackets] = useState<EncryptedSyncPacket[]>([]);
  
  // Custom query & payload test
  const [queryInput, setQueryInput] = useState("SELECT signal, score, rtp_observed, timestamp FROM smartbet_telemetry_live WHERE user_id = 'USR-PRO' ORDER BY timestamp DESC LIMIT 5;");
  const [queryResultJson, setQueryResultJson] = useState<string | null>(null);
  const [executingQuery, setExecutingQuery] = useState(false);
  const [syncPassphrase, setSyncPassphrase] = useState('E2E_VAULT_DB_INTEGRATION_KEY_99');

  const activeConnector = connectors.find(c => c.id === selectedConnectorId) || connectors[0];

  // Auto-sync heartbeat simulation
  useEffect(() => {
    const interval = setInterval(async () => {
      const activeAutoConnectors = connectors.filter(c => c.autoSync && c.status === 'CONNECTED');
      if (activeAutoConnectors.length > 0) {
        setIsDbSyncing(true);
        const randomConnector = activeAutoConnectors[Math.floor(Math.random() * activeAutoConnectors.length)];
        
        const payloadData = {
          telemetry: 'RNG_SIGNAL_TICK',
          provider: 'Pragmatic Play / PG Soft',
          rtp: parseFloat((95.5 + Math.random() * 2.5).toFixed(2)),
          hitRate: parseFloat((0.32 + Math.random() * 0.15).toFixed(2)),
          timestamp: Date.now(),
          user: currentUser ? currentUser.username : 'GUEST_NODE'
        };

        const packet = await createEncryptedSyncPacket(payloadData, syncPassphrase, randomConnector.name);
        setLiveStreamPackets(prev => [packet, ...prev.slice(0, 14)]);
        
        setTimeout(() => setIsDbSyncing(false), 600);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [connectors, currentUser, syncPassphrase]);

  // Toggle Auto-sync
  const handleToggleAutoSync = (connectorId: string) => {
    setConnectors(prev =>
      prev.map(c => {
        if (c.id === connectorId) {
          const next = !c.autoSync;
          onRecordAudit('DB_SYNC', `Auto-Sync ${next ? 'Diaktifkan' : 'Dinonaktifkan'} untuk ${c.name}`);
          return { ...c, autoSync: next, lastSyncTime: 'Baru saja' };
        }
        return c;
      })
    );
  };

  // Test Manual Sync
  const handleManualSyncNow = async () => {
    setIsDbSyncing(true);
    try {
      const payloadData = {
        action: 'MANUAL_TELEMETRY_SNAPSHOT',
        databaseTarget: activeConnector.name,
        table: activeConnector.tableOrCollection,
        timestamp: Date.now(),
        playerBalance: currentUser ? currentUser.balanceUSD : 1000,
        encryptionStandard: 'AES-256-GCM + HMAC-SHA256'
      };

      const packet = await createEncryptedSyncPacket(payloadData, syncPassphrase, activeConnector.name);
      setLiveStreamPackets(prev => [packet, ...prev.slice(0, 14)]);
      
      setConnectors(prev =>
        prev.map(c => (c.id === activeConnector.id ? { ...c, lastSyncTime: 'Baru saja' } : c))
      );

      onRecordAudit('DB_SYNC', `Manual Encrypted Packet dikirim ke ${activeConnector.name}`);

      addToast({
        title: `DATABASE PAYLOAD COMMITTED: ${activeConnector.name}`,
        message: `Packet ${packet.packetId} signed & verified. Latency: ${activeConnector.latencyMs}ms.`,
        type: 'sync',
        category: 'DB_SYNC',
        severity: 'normal',
        code: `SYNC_${activeConnector.type}`,
        hash: packet.authTagHex.substring(0, 16) + '...',
      });
    } finally {
      setTimeout(() => setIsDbSyncing(false), 500);
    }
  };

  // Execute Query Tester
  const handleExecuteQuery = async () => {
    setExecutingQuery(true);
    await new Promise(r => setTimeout(r, 450));
    
    const mockDbResponse = {
      status: 200,
      connector: activeConnector.name,
      executionTimeMs: activeConnector.latencyMs + Math.floor(Math.random() * 8),
      rowCount: 4,
      e2eEncrypted: activeConnector.e2eEncryptionEnabled,
      records: [
        { id: 1042, signal: 'BET BIG', score: 84.5, rtp_observed: 98.4, timestamp: '15:58:20' },
        { id: 1041, signal: 'BET MEDIUM', score: 62.0, rtp_observed: 96.1, timestamp: '15:57:45' },
        { id: 1040, signal: 'BET SMALL', score: 31.5, rtp_observed: 91.2, timestamp: '15:56:10' },
        { id: 1039, signal: 'BET MEDIUM', score: 58.2, rtp_observed: 95.8, timestamp: '15:55:02' },
      ]
    };

    setQueryResultJson(JSON.stringify(mockDbResponse, null, 2));
    setExecutingQuery(false);
    onRecordAudit('INTEGRITY_CHECK', `Query dieksekusi pada ${activeConnector.name}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Database className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">Hub Integrasi Database & Webhook Real-time</h2>
              <p className="text-xs text-slate-400">
                Sinkronisasi data taruhan dan sinyal ke PostgreSQL, Supabase, Firestore, atau Custom API terenkripsi end-to-end.
              </p>
            </div>
          </div>

          <UI3DButton
            variant="emerald"
            size="sm"
            onClick={handleManualSyncNow}
            loading={isDbSyncing}
            icon={RefreshCw}
          >
            SINKRONISASI SEKARANG
          </UI3DButton>
        </div>
      </div>

      {/* Database Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {connectors.map(conn => {
          const isSelected = conn.id === selectedConnectorId;
          return (
            <div
              key={conn.id}
              onClick={() => setSelectedConnectorId(conn.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900/90 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-800 text-slate-300">
                  {conn.type}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {conn.latencyMs}ms
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mt-2 truncate">{conn.name}</h4>
              <p className="text-xs text-slate-500 font-mono truncate mt-0.5">{conn.endpoint}</p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Sync: <strong className="text-slate-200">{conn.lastSyncTime}</strong>
                </span>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleToggleAutoSync(conn.id);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition cursor-pointer ${
                    conn.autoSync
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {conn.autoSync ? 'AUTO ON' : 'AUTO OFF'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Connector Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Connector Details & Query Runner */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Konfigurasi Aktif: {activeConnector.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> E2E AES-256 Enabled
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Database Connection Endpoint / URL</label>
                <input
                  type="text"
                  readOnly
                  value={activeConnector.endpoint}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-xs select-all outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Table / Collection Target</label>
                  <input
                    type="text"
                    readOnly
                    value={activeConnector.tableOrCollection}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-300 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">E2E Shared Encryption Vault Key</label>
                  <input
                    type="text"
                    value={syncPassphrase}
                    onChange={e => setSyncPassphrase(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-amber-300 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Live Query / API Tester */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Live SQL / Webhook Query Tester</span>
                <span className="text-[10px] text-slate-500 font-mono">TLS 1.3 / SSL Mode Require</span>
              </div>

              <textarea
                value={queryInput}
                onChange={e => setQueryInput(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 focus:border-emerald-500 outline-none"
              />

              <div className="flex items-center justify-between">
                <UI3DButton
                  id="btn-execute-query"
                  variant="emerald"
                  size="md"
                  onClick={handleExecuteQuery}
                  loading={executingQuery}
                  icon={Play}
                >
                  Eksekusi Query Terenkripsi
                </UI3DButton>
              </div>

              {queryResultJson && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-56 overflow-y-auto">
                  <pre>{queryResultJson}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Real-time Encrypted Telemetry Packet Stream */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Encrypted Stream
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 animate-pulse">● LIVE</span>
            </div>

            <p className="text-xs text-slate-400">
              Setiap paket diselimuti enkripsi AES-256-GCM dan diverifikasi dengan tanda tangan HMAC-SHA256 sebelum ditulis ke database.
            </p>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {liveStreamPackets.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Menunggu paket sinkronisasi...
                </div>
              ) : (
                liveStreamPackets.map(pkt => (
                  <div key={pkt.packetId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-emerald-400 font-bold">{pkt.packetId}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(pkt.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-amber-300 truncate">
                      <span className="text-slate-500">Cipher: </span>{pkt.cipherText.substring(0, 32)}...
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 truncate">
                      <span>HMAC-Sig: </span>{pkt.signature.substring(0, 16)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
