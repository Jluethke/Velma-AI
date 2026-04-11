/**
 * GET /api/discovery/trust?wallet=ADDRESS
 * =========================================
 * Returns a TrustProfile for a given wallet address,
 * computed from their Fabric session outcomes.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { TrustProfile } from './_db.js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

interface OutcomeRow {
  id: string;
  session_id: string;
  wallet_address: string;
  role: string;
  outcome: string;
  flow_slug: string | null;
  matched_wallet: string | null;
  rating: number | null;
  created_at: string;
}

function computeTrustProfile(wallet: string, rows: OutcomeRow[]): TrustProfile {
  if (rows.length === 0) {
    return {
      wallet,
      totalSessions: 0,
      agreementRate: 0,
      avgRating: null,
      byFlow: {},
    };
  }

  const totalSessions = rows.length;
  const agreedCount = rows.filter(r => r.outcome === 'agreed').length;
  const agreementRate = agreedCount / totalSessions;

  const ratedRows = rows.filter(r => r.rating !== null);
  const avgRating =
    ratedRows.length > 0
      ? ratedRows.reduce((sum, r) => sum + (r.rating as number), 0) / ratedRows.length
      : null;

  // Group by flow_slug
  const flowMap: Record<string, OutcomeRow[]> = {};
  for (const row of rows) {
    const slug = row.flow_slug ?? '__unknown__';
    if (!flowMap[slug]) flowMap[slug] = [];
    flowMap[slug].push(row);
  }

  const byFlow: TrustProfile['byFlow'] = {};
  for (const [slug, flowRows] of Object.entries(flowMap)) {
    const sessions = flowRows.length;
    const flowAgreed = flowRows.filter(r => r.outcome === 'agreed').length;
    const flowRated = flowRows.filter(r => r.rating !== null);
    byFlow[slug] = {
      sessions,
      agreementRate: flowAgreed / sessions,
      avgRating:
        flowRated.length > 0
          ? flowRated.reduce((sum, r) => sum + (r.rating as number), 0) / flowRated.length
          : null,
    };
  }

  return { wallet, totalSessions, agreementRate, avgRating, byFlow };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const wallet = req.query.wallet as string | undefined;
  if (!wallet) {
    return res.status(400).json({ error: 'wallet query parameter is required' });
  }

  const qs = new URLSearchParams({
    wallet_address: `eq.${wallet.toLowerCase()}`,
    select: '*',
  });

  const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/fabric_outcomes?${qs}`, {
    method: 'GET',
    headers,
  });

  if (!fetchRes.ok) {
    const text = await fetchRes.text().catch(() => fetchRes.statusText);
    console.error('fabric_outcomes fetch error:', fetchRes.status, text);
    return res.status(500).json({ error: 'Failed to fetch trust data' });
  }

  const rows: OutcomeRow[] = await fetchRes.json();
  const profile = computeTrustProfile(wallet.toLowerCase(), rows ?? []);

  return res.status(200).json(profile);
}
