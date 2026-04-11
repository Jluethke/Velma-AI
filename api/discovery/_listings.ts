/**
 * GET  /api/discovery/listings  — query the discovery board
 * POST /api/discovery/listings  — create a new listing
 *
 * Query params (GET):
 *   flowSlug, role, market, limit
 *
 * Body (POST):
 *   { walletAddress, flowSlug, role, title, description, market?, tags? }
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getListings, getListingsByWallet, createListing, getCandidates, upsertMatch } from './_db.js';
import { scoreMatches } from './_matchEngine.js';

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string> },
  res: ServerResponse
) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  // ── GET ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const q = req.query ?? {};
    try {
      // If ?wallet= provided, return listings for that wallet (my listings)
      if (q.wallet) {
        const listings = await getListingsByWallet(q.wallet);
        json(res, 200, { listings });
        return;
      }
      const listings = await getListings({
        flowSlug: q.flowSlug,
        role: q.role,
        market: q.market,
        limit: q.limit ? Number(q.limit) : undefined,
      });
      json(res, 200, { listings });
    } catch (err) {
      json(res, 500, { error: String(err) });
    }
    return;
  }

  // ── POST ─────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = (req.body ?? {}) as {
      walletAddress?: string;
      flowSlug?: string;
      role?: string;
      title?: string;
      description?: string;
      market?: string;
      tags?: string[];
    };

    if (!body.walletAddress || !body.flowSlug || !body.role || !body.title || !body.description) {
      json(res, 400, { error: 'walletAddress, flowSlug, role, title, and description are required' });
      return;
    }

    if (body.role !== 'host' && body.role !== 'guest') {
      json(res, 400, { error: 'role must be "host" or "guest"' });
      return;
    }

    try {
      const listing = await createListing({
        wallet_address: body.walletAddress,
        flow_slug: body.flowSlug,
        role: body.role as 'host' | 'guest',
        title: body.title,
        description: body.description,
        market: body.market ?? null,
        tags: body.tags ?? [],
        status: 'active',
        expires_at: null,
      });

      // Trigger async match scoring (fire and forget — don't await)
      void scoreAndPersist(listing.id).catch(console.error);

      json(res, 201, { listing });
    } catch (err) {
      json(res, 500, { error: String(err) });
    }
    return;
  }

  json(res, 405, { error: 'Method not allowed' });
}

async function scoreAndPersist(listingId: string) {
  const { getListing } = await import('./_db.js');
  const listing = await getListing(listingId);
  if (!listing) return;

  const candidates = await getCandidates(listing);
  if (candidates.length === 0) return;

  const scores = await scoreMatches(listing, candidates);

  await Promise.all(
    scores.map(s =>
      upsertMatch(listing.id, s.candidateId, s.score, s.introText, s.reasoning).catch(console.error)
    )
  );
}
