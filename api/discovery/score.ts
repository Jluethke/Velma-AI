/**
 * POST /api/discovery/score
 * Body: { listingId: string }
 *
 * Manually trigger match scoring for a listing.
 * Called after listing creation (fire-and-forget) and can be called again
 * to refresh matches as new listings appear.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getListing, getCandidates, upsertMatch } from './_db.js';
import { scoreMatches } from './_matchEngine.js';

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export async function scoreAndPersist(listingId: string): Promise<void> {
  const listing = await getListing(listingId);
  if (!listing) throw new Error(`Listing not found: ${listingId}`);

  const candidates = await getCandidates(listing);
  if (candidates.length === 0) return;

  const scores = await scoreMatches(listing, candidates);

  await Promise.all(
    scores.map(s =>
      upsertMatch(listing.id, s.candidateId, s.score, s.introText, s.reasoning)
    )
  );
}

export default async function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string> },
  res: ServerResponse
) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') { json(res, 405, { error: 'Method not allowed' }); return; }

  const body = (req.body ?? {}) as { listingId?: string };
  if (!body.listingId) { json(res, 400, { error: 'listingId is required' }); return; }

  try {
    const listing = await getListing(body.listingId);
    if (!listing) { json(res, 404, { error: 'Listing not found' }); return; }

    const candidates = await getCandidates(listing);
    if (candidates.length === 0) {
      json(res, 200, { matched: 0, message: 'No candidates found' });
      return;
    }

    const scores = await scoreMatches(listing, candidates);

    await Promise.all(
      scores.map(s =>
        upsertMatch(listing.id, s.candidateId, s.score, s.introText, s.reasoning)
      )
    );

    json(res, 200, { matched: scores.length });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}
