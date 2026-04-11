/**
 * Fabric Session Store — Vercel KV
 * ==================================
 * All functions are async. Sessions stored with 7-day TTL.
 * Keys: "fabric:<sessionId>"
 */

import { Redis } from "@upstash/redis";

const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
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
  guestTokens: string[];
  maxGuests: number;
  flowSlug: string;
  title?: string;
  hostWallet?: string;   // lowercase — used for subscription gate at synthesis time
  createdAt: number;
  expiresAt: number;
  submissionDeadline: number;
  reminded: boolean;
  host: FabricSide;
  guests: FabricSide[];
  synthesis: FabricSynthesis;
}

/** What any client (guest browser, GET endpoint) is allowed to see.
 *  Raw data from either party is intentionally absent — only synthesis output
 *  is ever exposed across party boundaries. */
export interface FabricSidePublic {
  submitted: boolean;
  sharedFields: string[];
}

export interface PublicSession {
  id: string;
  flowSlug: string;
  title?: string;
  createdAt: number;
  expiresAt: number;
  submissionDeadline: number;
  reminded: boolean;
  host: FabricSidePublic;
  guests: FabricSidePublic[];
  synthesis: FabricSynthesis;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function key(id: string) {
  return `fabric:${id}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function createSession(
  flowSlug: string,
  title?: string,
  maxGuests?: number,
  hostWallet?: string
): Promise<FabricSession> {
  const id = randomBytes(16).toString("hex");
  const hostToken = randomBytes(32).toString("hex");
  const now = Date.now();

  const resolvedMaxGuests = Math.min(Math.max(1, maxGuests ?? 1), 10);
  const guestTokens = Array.from({ length: resolvedMaxGuests }, () =>
    randomBytes(32).toString("hex")
  );

  const session: FabricSession = {
    id,
    hostToken,
    guestTokens,
    maxGuests: resolvedMaxGuests,
    flowSlug,
    title,
    hostWallet: hostWallet?.toLowerCase(),
    createdAt: now,
    expiresAt: now + TTL_SECONDS * 1000,
    submissionDeadline: now + 48 * 60 * 60 * 1000,
    reminded: false,
    host: { submitted: false, data: {}, sharedFields: [] },
    guests: [],
    synthesis: { status: "pending" },
  };

  await kv.set(key(id), session, { ex: TTL_SECONDS });
  await addToActiveIndex(id);
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

/** Safe public view — strips all raw answer data from all parties.
 *  Never returns host.data or any guest.data across party boundaries. */
export function publicView(session: FabricSession): PublicSession {
  return {
    id: session.id,
    flowSlug: session.flowSlug,
    title: session.title,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    submissionDeadline: session.submissionDeadline,
    reminded: session.reminded,
    host: { submitted: session.host.submitted, sharedFields: session.host.sharedFields },
    guests: session.guests.map(g => ({ submitted: g.submitted, sharedFields: g.sharedFields })),
    synthesis: session.synthesis,
  };
}

// ─── Active Session Index ─────────────────────────────────────────────────────

const ACTIVE_INDEX_KEY = 'fabric:active';

export async function addToActiveIndex(id: string): Promise<void> {
  await kv.sadd(ACTIVE_INDEX_KEY, id);
}

export async function removeFromActiveIndex(id: string): Promise<void> {
  await kv.srem(ACTIVE_INDEX_KEY, id);
}

export async function getActiveSessions(): Promise<FabricSession[]> {
  const ids = await kv.smembers(ACTIVE_INDEX_KEY) as string[];
  if (ids.length === 0) return [];
  const sessions = await Promise.all(ids.map(id => getSession(id)));
  return sessions.filter((s): s is FabricSession => s !== undefined);
}

/** Wraps user-supplied text in XML data tags so the model can distinguish
 *  between instructions (system/user prompt) and data (party answers).
 *  Also strips the most common injection trigger phrases. */
export function sanitizeForPrompt(text: string): string {
  const cleaned = text
    .replace(/ignore\s+(previous|all|prior)\s+instructions?/gi, '[redacted]')
    .replace(/disregard\s+(previous|all|prior)\s+instructions?/gi, '[redacted]')
    .replace(/you\s+are\s+now\s+/gi, '[redacted] ')
    .replace(/system\s*prompt/gi, '[redacted]')
    .replace(/\bACT\s+AS\b/g, '[redacted]')
    .replace(/\bDAN\b/g, '[redacted]');
  return `<user_data>\n${cleaned}\n</user_data>`;
}
