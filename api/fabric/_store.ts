/**
 * Fabric Session Store — Vercel KV
 * ==================================
 * All functions are async. Sessions stored with 7-day TTL.
 * Keys: "fabric:<sessionId>"
 */

import { kv } from "@vercel/kv";
import { randomBytes } from "crypto";

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

const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function key(id: string) {
  return `fabric:${id}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function createSession(
  flowSlug: string,
  title?: string
): Promise<FabricSession> {
  const id = randomBytes(16).toString("hex");
  const hostToken = randomBytes(32).toString("hex");
  const now = Date.now();

  const session: FabricSession = {
    id,
    hostToken,
    flowSlug,
    title,
    createdAt: now,
    expiresAt: now + TTL_SECONDS * 1000,
    host: { submitted: false, data: {}, sharedFields: [] },
    guest: { submitted: false, data: {}, sharedFields: [] },
    synthesis: { status: "pending" },
  };

  await kv.set(key(id), session, { ex: TTL_SECONDS });
  return session;
}

export async function getSession(
  id: string
): Promise<FabricSession | undefined> {
  const session = await kv.get<FabricSession>(key(id));
  return session ?? undefined;
}

export async function saveSession(session: FabricSession): Promise<void> {
  const remainingSeconds = Math.max(
    1,
    Math.floor((session.expiresAt - Date.now()) / 1000)
  );
  await kv.set(key(session.id), session, { ex: remainingSeconds });
}

export function publicView(session: FabricSession): PublicSession {
  const { hostToken: _hostToken, ...pub } = session;
  return pub;
}
