import Dexie, { Table } from 'dexie';

export interface CachedScheme {
  scheme_id: string;
  data: any;
  cached_at: number;
}

export interface CachedProfile {
  id: string;
  data: any;
  cached_at: number;
}

export interface CachedApplication {
  application_id: string;
  data: any;
  cached_at: number;
}

export interface PendingSync {
  id?: number;
  endpoint: string;
  method: string;
  body: string;
  created_at: number;
}

export interface CachedMatchResult {
  id: string;
  eligible: any[];
  near_miss: any[];
  cached_at: number;
}

class SahayakDB extends Dexie {
  schemes!: Table<CachedScheme, string>;
  profile!: Table<CachedProfile, string>;
  applications!: Table<CachedApplication, string>;
  pendingSync!: Table<PendingSync, number>;
  matchResults!: Table<CachedMatchResult, string>;
  qrTokens!: Table<{ id: string; signed_jwt: string; cached_at: number }, string>;

  constructor() {
    super('SahayakDB');
    this.version(1).stores({
      schemes: 'scheme_id',
      profile: 'id',
      applications: 'application_id',
      pendingSync: '++id, endpoint',
      matchResults: 'id',
      qrTokens: 'id',
    });
  }
}

export const db = new SahayakDB();

// Utility functions
export async function cacheSchemes(schemes: any[]) {
  const now = Date.now();
  await db.schemes.bulkPut(schemes.map(s => ({ scheme_id: s.scheme_id, data: s, cached_at: now })));
}

export async function getCachedSchemes(): Promise<any[]> {
  const cached = await db.schemes.toArray();
  return cached.map(c => c.data);
}

export async function cacheProfile(profile: any) {
  await db.profile.put({ id: 'current', data: profile, cached_at: Date.now() });
}

export async function getCachedProfile(): Promise<any | null> {
  const cached = await db.profile.get('current');
  return cached?.data || null;
}

export async function addPendingSync(endpoint: string, method: string, body: any) {
  await db.pendingSync.add({
    endpoint, method, body: JSON.stringify(body), created_at: Date.now()
  });
}

export async function processPendingSync() {
  const pending = await db.pendingSync.toArray();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  for (const item of pending) {
    try {
      await fetch(`${API_BASE}${item.endpoint}`, {
        method: item.method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: item.body,
      });
      await db.pendingSync.delete(item.id!);
    } catch {
      break; // Still offline
    }
  }
}
