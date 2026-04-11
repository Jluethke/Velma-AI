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
  flowSlug: string;
  title?: string;
  createdAt: number;
  expiresAt: number;
  host: FabricSide;
  guest: FabricSide;
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
  host: FabricSidePublic;
  guest: FabricSidePublic;
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

/** Safe public view — strips all raw answer data from both parties.
 *  Never returns host.data or guest.data across party boundaries. */
export function publicView(session: FabricSession): PublicSession {
  return {
    id: session.id,
    flowSlug: session.flowSlug,
    title: session.title,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    host: { submitted: session.host.submitted, sharedFields: session.host.sharedFields },
    guest: { submitted: session.guest.submitted, sharedFields: session.guest.sharedFields },
    synthesis: session.synthesis,
  };
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
