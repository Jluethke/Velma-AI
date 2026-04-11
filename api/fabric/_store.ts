/**
 * Fabric Session Store
 * ====================
 * In-memory store for Fabric multiplayer sessions.
 * Module-level state persists across warm serverless invocations.
 * Sessions are also written to /tmp/fabric-sessions.json for warm-start
 * recovery (best-effort — /tmp is ephemeral on Vercel).
 *
 * NOTE: For production, replace with Vercel KV / Redis / Upstash.
 */

import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FabricSession {
  id: string;
  flowSlug: string;
  title: string;
  hostToken: string;
  createdAt: string;
  expiresAt: string;
  host: {
    submitted: boolean;
    data: Record<string, unknown>;
    sharedFields: string[];
  };
  guest: {
    submitted: boolean;
    data: Record<string, unknown>;
    sharedFields: string[];
  };
  synthesis: {
    status: "pending" | "ready";
    output: string | null;
  };
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

const STORE_PATH = "/tmp/fabric-sessions.json";

function loadFromDisk(): Map<string, FabricSession> {
  try {
    if (existsSync(STORE_PATH)) {
      const raw = readFileSync(STORE_PATH, "utf-8");
      const obj = JSON.parse(raw) as Record<string, FabricSession>;
      return new Map(Object.entries(obj));
    }
  } catch {
    // /tmp may not be available or file corrupted — start fresh
  }
  return new Map();
}

function saveToDisk(sessions: Map<string, FabricSession>): void {
  try {
    const obj: Record<string, FabricSession> = {};
    for (const [k, v] of sessions) {
      obj[k] = v;
    }
    writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2), "utf-8");
  } catch {
    // best-effort — /tmp write failure should not break the API
  }
}

// ---------------------------------------------------------------------------
// In-memory store (module singleton)
// ---------------------------------------------------------------------------

const sessions: Map<string, FabricSession> = loadFromDisk();

// ---------------------------------------------------------------------------
// TTL pruning — remove expired sessions on each write
// ---------------------------------------------------------------------------

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (new Date(session.expiresAt).getTime() < now) {
      sessions.delete(id);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new Fabric session. Returns the full session object including
 * the secret hostToken (never expose to guests).
 */
export function createSession(flowSlug: string, title?: string): FabricSession {
  pruneExpired();

  const id = randomUUID();
  const hostToken = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const session: FabricSession = {
    id,
    flowSlug,
    title: title ?? flowSlug,
    hostToken,
    createdAt: now.toISOString(),
    expiresAt,
    host: { submitted: false, data: {}, sharedFields: [] },
    guest: { submitted: false, data: {}, sharedFields: [] },
    synthesis: { status: "pending", output: null },
  };

  sessions.set(id, session);
  saveToDisk(sessions);
  return session;
}

/**
 * Look up a session by ID. Returns null if not found or expired.
 */
export function getSession(id: string): FabricSession | null {
  const session = sessions.get(id);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    sessions.delete(id);
    saveToDisk(sessions);
    return null;
  }
  return session;
}

/**
 * Persist a modified session back to the store.
 */
export function saveSession(session: FabricSession): void {
  sessions.set(session.id, session);
  saveToDisk(sessions);
}

/**
 * Build the guest-safe view of a session (strips hostToken).
 */
export function publicView(session: FabricSession): Omit<FabricSession, "hostToken"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hostToken: _hostToken, ...pub } = session;
  return pub;
}
