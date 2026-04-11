/**
 * Fabric Discovery — Supabase REST client
 * =========================================
 * Uses the REST API directly (no SDK dependency).
 *
 * Required env vars:
 *   SUPABASE_URL          — e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service-role secret key
 *
 * SQL to run in Supabase → SQL Editor:
 * ──────────────────────────────────────────────────────────────────
 *   create table public.discovery_listings (
 *     id uuid primary key default gen_random_uuid(),
 *     wallet_address text not null,
 *     flow_slug text not null,
 *     role text not null check (role in ('host', 'guest')),
 *     title text not null,
 *     description text not null,
 *     market text,
 *     tags text[] default '{}',
 *     status text not null default 'active'
 *       check (status in ('active', 'matched', 'closed', 'paused')),
 *     created_at timestamptz not null default now(),
 *     updated_at timestamptz not null default now(),
 *     expires_at timestamptz
 *   );
 *
 *   create table public.discovery_matches (
 *     id uuid primary key default gen_random_uuid(),
 *     listing_id uuid not null references public.discovery_listings(id) on delete cascade,
 *     matched_listing_id uuid not null references public.discovery_listings(id) on delete cascade,
 *     score numeric(4,2) not null check (score >= 0 and score <= 10),
 *     ai_intro_text text not null,
 *     ai_reasoning text,
 *     status text not null default 'pending'
 *       check (status in ('pending', 'accepted', 'rejected', 'converted', 'expired')),
 *     fabric_session_id text,
 *     initiated_by text,
 *     created_at timestamptz not null default now(),
 *     updated_at timestamptz not null default now(),
 *     constraint no_self_match check (listing_id <> matched_listing_id),
 *     constraint unique_pair unique (listing_id, matched_listing_id)
 *   );
 *
 *   -- Allow all reads (public board)
 *   alter table public.discovery_listings enable row level security;
 *   create policy "public read" on public.discovery_listings for select using (true);
 *   alter table public.discovery_matches enable row level security;
 *   create policy "public read" on public.discovery_matches for select using (true);
 *   -- All writes go through API routes using service key (bypasses RLS)
 * ──────────────────────────────────────────────────────────────────
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiscoveryListing {
  id: string;
  wallet_address: string;
  flow_slug: string;
  role: 'host' | 'guest';
  title: string;
  description: string;
  market: string | null;
  tags: string[];
  status: 'active' | 'matched' | 'closed' | 'paused';
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface DiscoveryMatch {
  id: string;
  listing_id: string;
  matched_listing_id: string;
  score: number;
  ai_intro_text: string;
  ai_reasoning: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'converted' | 'expired';
  fabric_session_id: string | null;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function baseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function supaFetch(path: string, init?: RequestInit) {
  if (!SUPABASE_URL) throw new Error('SUPABASE_NOT_CONFIGURED');
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, { ...init, headers: { ...baseHeaders(), ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Supabase ${init?.method ?? 'GET'} ${path}: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Listings ────────────────────────────────────────────────────────────────

export async function getListings(params: {
  flowSlug?: string;
  role?: string;
  market?: string;
  status?: string;
  limit?: number;
}): Promise<DiscoveryListing[]> {
  const qs = new URLSearchParams();
  if (params.flowSlug) qs.set('flow_slug', `eq.${params.flowSlug}`);
  if (params.role) qs.set('role', `eq.${params.role}`);
  if (params.market) qs.set('market', `ilike.*${params.market}*`);
  qs.set('status', `eq.${params.status ?? 'active'}`);
  qs.set('order', 'created_at.desc');
  qs.set('limit', String(params.limit ?? 100));
  return supaFetch(`discovery_listings?${qs}`);
}

export async function getListingsByWallet(wallet: string): Promise<DiscoveryListing[]> {
  const qs = new URLSearchParams({
    wallet_address: `eq.${wallet.toLowerCase()}`,
    order: 'created_at.desc',
  });
  return supaFetch(`discovery_listings?${qs}`);
}

export async function getListing(id: string): Promise<DiscoveryListing | null> {
  const rows: DiscoveryListing[] = await supaFetch(
    `discovery_listings?id=eq.${id}&limit=1`
  );
  return rows[0] ?? null;
}

export async function createListing(
  data: Omit<DiscoveryListing, 'id' | 'created_at' | 'updated_at'>
): Promise<DiscoveryListing> {
  const rows: DiscoveryListing[] = await supaFetch('discovery_listings', {
    method: 'POST',
    body: JSON.stringify({ ...data, wallet_address: data.wallet_address.toLowerCase() }),
  });
  return rows[0];
}

export async function updateListing(
  id: string,
  data: Partial<DiscoveryListing>
): Promise<DiscoveryListing> {
  const rows: DiscoveryListing[] = await supaFetch(
    `discovery_listings?id=eq.${id}`,
    { method: 'PATCH', body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }) }
  );
  return rows[0];
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function getMatchesForListing(listingId: string): Promise<DiscoveryMatch[]> {
  const qs = new URLSearchParams({
    listing_id: `eq.${listingId}`,
    order: 'score.desc',
    limit: '50',
  });
  return supaFetch(`discovery_matches?${qs}`);
}

export async function getMatch(id: string): Promise<DiscoveryMatch | null> {
  const rows: DiscoveryMatch[] = await supaFetch(
    `discovery_matches?id=eq.${id}&limit=1`
  );
  return rows[0] ?? null;
}

export async function upsertMatch(
  listingId: string,
  matchedListingId: string,
  score: number,
  aiIntroText: string,
  aiReasoning: string
): Promise<DiscoveryMatch> {
  // Use upsert via conflict resolution
  const rows: DiscoveryMatch[] = await supaFetch('discovery_matches', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      listing_id: listingId,
      matched_listing_id: matchedListingId,
      score,
      ai_intro_text: aiIntroText,
      ai_reasoning: aiReasoning,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }),
  });
  return rows[0];
}

export async function updateMatch(
  id: string,
  data: Partial<DiscoveryMatch>
): Promise<DiscoveryMatch> {
  const rows: DiscoveryMatch[] = await supaFetch(
    `discovery_matches?id=eq.${id}`,
    { method: 'PATCH', body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }) }
  );
  return rows[0];
}

// ─── Counterpart candidates ───────────────────────────────────────────────────

/** Find listings that could match this one: same flow, opposite role, active. */
export async function getCandidates(listing: DiscoveryListing): Promise<DiscoveryListing[]> {
  const oppositeRole = listing.role === 'host' ? 'guest' : 'host';
  const qs = new URLSearchParams({
    flow_slug: `eq.${listing.flow_slug}`,
    role: `eq.${oppositeRole}`,
    status: 'eq.active',
    // Exclude the listing's own wallet
    wallet_address: `neq.${listing.wallet_address.toLowerCase()}`,
    order: 'created_at.desc',
    limit: '40',
  });
  return supaFetch(`discovery_listings?${qs}`);
}

// ─── Trust profiles ───────────────────────────────────────────────────────────

export interface TrustProfile {
  wallet: string;
  totalSessions: number;
  agreementRate: number;
  avgRating: number | null;
  byFlow: Record<string, { sessions: number; agreementRate: number; avgRating: number | null }>;
}

interface OutcomeRow {
  wallet_address: string;
  outcome: string;
  flow_slug: string | null;
  rating: number | null;
}

function buildEmptyTrustProfile(wallet: string): TrustProfile {
  return { wallet, totalSessions: 0, agreementRate: 0, avgRating: null, byFlow: {} };
}

/**
 * Batch-fetch trust outcomes for a list of wallet addresses.
 * Returns a map of wallet -> TrustProfile.
 * Wallets with no history get empty profiles.
 */
export async function getCandidateTrustScores(
  walletAddresses: string[]
): Promise<Record<string, TrustProfile>> {
  if (walletAddresses.length === 0) return {};

  const normalised = walletAddresses.map(w => w.toLowerCase());
  // Supabase PostgREST in() filter: wallet_address=in.(addr1,addr2,...)
  const inList = normalised.join(',');
  const qs = new URLSearchParams({
    wallet_address: `in.(${inList})`,
    select: 'wallet_address,outcome,flow_slug,rating',
  });

  const rows: OutcomeRow[] = await supaFetch(`fabric_outcomes?${qs}`);

  // Initialise empty profiles for all requested wallets
  const result: Record<string, TrustProfile> = {};
  for (const w of normalised) {
    result[w] = buildEmptyTrustProfile(w);
  }

  // Group rows by wallet
  const grouped: Record<string, OutcomeRow[]> = {};
  for (const row of rows ?? []) {
    const w = row.wallet_address.toLowerCase();
    if (!grouped[w]) grouped[w] = [];
    grouped[w].push(row);
  }

  for (const [wallet, walletRows] of Object.entries(grouped)) {
    const totalSessions = walletRows.length;
    const agreedCount = walletRows.filter(r => r.outcome === 'agreed').length;
    const agreementRate = agreedCount / totalSessions;

    const ratedRows = walletRows.filter(r => r.rating !== null);
    const avgRating =
      ratedRows.length > 0
        ? ratedRows.reduce((sum, r) => sum + (r.rating as number), 0) / ratedRows.length
        : null;

    const flowMap: Record<string, OutcomeRow[]> = {};
    for (const row of walletRows) {
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

    result[wallet] = { wallet, totalSessions, agreementRate, avgRating, byFlow };
  }

  return result;
}
