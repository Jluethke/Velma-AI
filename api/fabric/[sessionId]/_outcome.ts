/**
 * POST /api/fabric/:sessionId/outcome
 * =====================================
 * Records the outcome of a Fabric session for a participant.
 * No auth beyond knowing the sessionId.
 *
 * SQL to run in Supabase → SQL Editor:
 * ──────────────────────────────────────────────────────────────────
 * create table if not exists fabric_outcomes (
 *   id uuid primary key default gen_random_uuid(),
 *   session_id text not null,
 *   wallet_address text not null,
 *   role text not null,
 *   outcome text not null,
 *   flow_slug text,
 *   matched_wallet text,
 *   rating integer,
 *   created_at timestamptz default now(),
 *   unique(session_id, wallet_address)
 * );
 * ──────────────────────────────────────────────────────────────────
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession } from '../_store.js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
};

const VALID_OUTCOMES = ['agreed', 'no_deal', 'still_talking'] as const;
type Outcome = typeof VALID_OUTCOMES[number];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = req.query as { sessionId: string };

  const {
    walletAddress,
    role,
    outcome,
    rating,
    matchedWallet,
  } = req.body as {
    walletAddress?: string;
    role?: string;
    outcome?: string;
    rating?: number;
    matchedWallet?: string;
  };

  // Validate required fields
  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json({ error: 'walletAddress is required' });
  }
  if (!role || (role !== 'host' && role !== 'guest')) {
    return res.status(400).json({ error: 'role must be "host" or "guest"' });
  }
  if (!outcome || !VALID_OUTCOMES.includes(outcome as Outcome)) {
    return res.status(400).json({ error: 'outcome must be one of: agreed, no_deal, still_talking' });
  }
  if (rating !== undefined && rating !== null) {
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }
  }

  // Try to get the session to extract flowSlug; not required for outcome to succeed
  let flowSlug: string | null = null;
  try {
    const session = await getSession(sessionId);
    if (session) {
      flowSlug = session.flowSlug;
    }
  } catch {
    // Session may have expired — continue without flowSlug
  }

  // Upsert to fabric_outcomes
  const row: Record<string, unknown> = {
    session_id: sessionId,
    wallet_address: walletAddress.toLowerCase(),
    role,
    outcome,
    flow_slug: flowSlug,
  };
  if (matchedWallet !== undefined && matchedWallet !== null) {
    row.matched_wallet = matchedWallet.toLowerCase();
  }
  if (rating !== undefined && rating !== null) {
    row.rating = Number(rating);
  }

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/fabric_outcomes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(row),
  });

  if (!upsertRes.ok) {
    const text = await upsertRes.text().catch(() => upsertRes.statusText);
    console.error('fabric_outcomes upsert error:', upsertRes.status, text);
    return res.status(500).json({ error: 'Failed to record outcome' });
  }

  return res.status(200).json({ success: true });
}
