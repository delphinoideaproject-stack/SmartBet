/**
 * Real-Time 3rd-Party Database & Webhook Integration Hub
 * Supports PostgreSQL, Supabase, Firestore, MySQL, and Custom REST Webhooks
 * with AES-256 End-to-End Cryptographic payload envelopes.
 */

import { DatabaseConnectorConfig, EncryptedSyncPacket, SecurityAuditLog } from '../types';
import { encryptDataAESGCM, generateCSPRNGHex, hmacSha256, sha256 } from './crypto';

export const INITIAL_DB_CONFIGS: DatabaseConnectorConfig[] = [
  {
    id: 'db-supabase-prod',
    name: 'Supabase Realtime Cluster (Asia-SE)',
    type: 'SUPABASE',
    endpoint: 'https://ixklnmpqasdfghjkl.supabase.co/rest/v1/player_signals',
    apiKeyOrSecret: 'sbp_live_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
    tableOrCollection: 'smartbet_telemetry_live',
    syncIntervalSec: 3,
    autoSync: true,
    e2eEncryptionEnabled: true,
    encryptionKeyAlias: 'E2E-AES256-VAULT-KEY-ALPHA',
    lastSyncTime: 'Baru saja',
    status: 'CONNECTED',
    latencyMs: 38
  },
  {
    id: 'db-postgres-primary',
    name: 'PostgreSQL Enterprise DB (SSL Mode: Require)',
    type: 'POSTGRESQL',
    endpoint: 'postgresql://smartbet_admin:***@pg-cluster.internal.cloud:5432/telemetry_db',
    apiKeyOrSecret: 'pg_sec_vault_k88_production_aes',
    tableOrCollection: 'player_bet_records',
    syncIntervalSec: 5,
    autoSync: false,
    e2eEncryptionEnabled: true,
    encryptionKeyAlias: 'E2E-AES256-VAULT-KEY-ALPHA',
    lastSyncTime: '12 menit lalu',
    status: 'CONNECTED',
    latencyMs: 24
  },
  {
    id: 'db-firestore-cloud',
    name: 'Google Cloud Firestore Real-time Sync',
    type: 'FIRESTORE',
    endpoint: 'projects/smartbet-v9-live/databases/(default)/documents/sessions',
    apiKeyOrSecret: 'AIzaSyA_LiveCloudFirestoreSecretKey99281',
    tableOrCollection: 'active_sessions',
    syncIntervalSec: 2,
    autoSync: false,
    e2eEncryptionEnabled: true,
    encryptionKeyAlias: 'E2E-AES256-VAULT-KEY-ALPHA',
    lastSyncTime: '30 menit lalu',
    status: 'CONNECTED',
    latencyMs: 45
  },
  {
    id: 'db-custom-webhook',
    name: 'Custom E2E Encrypted Webhook Endpoint',
    type: 'REST_WEBHOOK',
    endpoint: 'https://api.my-custom-analytics.org/v1/smartbet/stream',
    apiKeyOrSecret: 'whsec_e2e_signature_hmac_sha256_live',
    tableOrCollection: 'events_stream',
    syncIntervalSec: 1,
    autoSync: false,
    e2eEncryptionEnabled: true,
    encryptionKeyAlias: 'E2E-AES256-VAULT-KEY-ALPHA',
    lastSyncTime: 'Belum pernah',
    status: 'DISCONNECTED',
    latencyMs: 0
  }
];

export async function createEncryptedSyncPacket(
  payloadObj: Record<string, unknown>,
  passphrase: string,
  senderId: string = 'client_node_v9'
): Promise<EncryptedSyncPacket> {
  const jsonString = JSON.stringify(payloadObj);
  const encryptionResult = await encryptDataAESGCM(jsonString, passphrase);
  const signature = await hmacSha256(passphrase, encryptionResult.cipherText);

  return {
    packetId: `PKT-${generateCSPRNGHex(8).toUpperCase()}`,
    timestamp: Date.now(),
    senderId,
    ivHex: encryptionResult.ivHex,
    cipherText: encryptionResult.cipherText,
    authTagHex: encryptionResult.saltHex,
    signature,
    decryptedPreview: jsonString
  };
}

export async function createAuditLog(
  eventType: SecurityAuditLog['eventType'],
  severity: SecurityAuditLog['severity'],
  message: string
): Promise<SecurityAuditLog> {
  const timestamp = new Date().toISOString();
  const rawData = `${timestamp}:${eventType}:${message}`;
  const hash = await sha256(rawData);

  return {
    id: `LOG-${generateCSPRNGHex(6).toUpperCase()}`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    eventType,
    severity,
    message,
    hash: hash.substring(0, 16)
  };
}
