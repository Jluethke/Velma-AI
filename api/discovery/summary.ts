/**
 * GET /api/discovery/summary?wallet={address}
 * Returns pending match count + active listing count for a wallet.
 * Used to drive the navbar badge without loading full match data.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getListingsByWallet, getMatchesForListing } from './_db.js';

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
  req: IncomingMessage & { query?: Record<string, string> },
  res: ServerResponse
) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'GET') { json(res, 405, { error: 'Method not allowed' }); return; }

  const wallet = req.query?.wallet;
  if (!wallet) { json(res, 400, { error: 'wallet is required' }); return; }

  try {
    const listings = await getListingsByWallet(wallet);
    const active = listings.filter(l => l.status === 'active');

    // Fetch matches for all active listings in parallel
    const matchArrays = await Promise.all(active.map(l => getMatchesForListing(l.id)));
    const pendingMatches = matchArrays.flat().filter(m => m.status === 'pending').length;

    json(res, 200, {
      activeListings: active.length,
      pendingMatches,
    });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}
