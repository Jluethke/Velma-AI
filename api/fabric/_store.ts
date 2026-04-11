/**
 * Fabric Session Store
 * ====================
 * In-memory Map with /tmp JSON warm-restart cache.
 * Sessions expire after 7 days.
 *
 * To upgrade to Vercel KV: replace the three functions
 * (memStore.get / memStore.set / loadFromDisk+saveToDisk)
 * with kv.get / kv.set — interface stays the same.
 */

import { randomBytes } from "crypto";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FabricSide {
  submitted: boolean;
  data: Record<string, unknown>;
  sharedFields: string[];
}

export interface FabricSynthesis {
  status: "pending" | "ready" | "complete";
  output?: string;
}

export interface FabricSession {
  id: string;
  hostToken: string;
  flowSlug: string;
  title?: string;
  createdAt: number;
  expiresAt: number;
  host: FabricSide;
  guest: FabricSide;
  synthesis: FabricSynthesis;
}

export type PublicSession = Omit<FabricSession, "hostToken">;

// ─── Constants ───────────────────────────────────────────────────────────────

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_DIR = "/tmp";
const CACHE_FILE = join(CACHE_DIR, "fabric-sessions.json");

// ─── In-memory store ─────────────────────────────────────────────────────────

const memStore = new Map<string, FabricSession>();
let loaded = false;

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  try {
    const raw = readFileSync(CACHE_FILE, "utf8");
    const sessions = JSON.parse(raw) as FabricSession[];
    const now = Date.now();
    for (const session of sessions) {
      if (session.expiresAt > now) {
        memStore.set(session.id, session);
      }
    }
  } catch {
    // File doesn't exist or is corrupt — start fresh
  }
}

function persistToDisk(): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const sessions = Array.from(memStore.values());
    writeFileSync(CACHE_FILE, JSON.stringify(sessions), "utf8");
  } catch {
    // /tmp write failures are non-fatal — memory is still the source of truth
  }
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, session] of memStore) {
    if (session.expiresAt <= now) {
      memStore.delete(id);
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function createSession(flowSlug: string, title?: string): FabricSession {
  ensureLoaded();
  pruneExpired();

  const id = randomBytes(16).toString("hex");
  const hostToken = randomBytes(32).toString("hex");
  const now = Date.now();

  const session: FabricSession = {
    id,
    hostToken,
    flowSlug,
    title,
    createdAt: now,
    expiresAt: now + TTL_MS,
    host: { submitted: false, data: {}, sharedFields: [] },
    guest: { submitted: false, data: {}, sharedFields: [] },
    synthesis: { status: "pending" },
  };

  memStore.set(id, session);
  persistToDisk();
  return session;
}

export function getSession(id: string): FabricSession | undefined {
  ensureLoaded();
  const session = memStore.get(id);
  if (!session) return undefined;
  if (session.expiresAt <= Date.now()) {
    memStore.delete(id);
    persistToDisk();
    return undefined;
  }
  return session;
}

export function saveSession(session: FabricSession): void {
  memStore.set(session.id, session);
  persistToDisk();
}

export function publicView(session: FabricSession): PublicSession {
  const { hostToken: _hostToken, ...pub } = session;
  return pub;
}
