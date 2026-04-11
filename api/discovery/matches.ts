/**
 * GET /api/discovery/matches?listingId=<uuid>
 * Returns all scored matches for a listing, with the matched listing details joined.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getMatchesForListing, getListing } from './_db.js';

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'GET') { json(res, 405, { error: 'Method not allowed' }); return; }

  const listingId = req.query?.listingId;
  if (!listingId) { json(res, 400, { error: 'listingId is required' }); return; }

  try {
    const matches = await getMatchesForListing(listingId);

    // Join the matched listing details
    const enriched = await Promise.all(
      matches.map(async m => {
        const matchedListing = await getListing(m.matched_listing_id);
        return { ...m, matched_listing: matchedListing };
      })
    );

    json(res, 200, { matches: enriched });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}
