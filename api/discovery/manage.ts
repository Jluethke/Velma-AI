/**
 * PATCH /api/discovery/manage
 * Body: { listingId, walletAddress, status: 'active' | 'paused' | 'closed' }
 *
 * Updates listing status. Validates ownership via wallet_address.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getListing, updateListing } from './_db.js';

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'PATCH') { json(res, 405, { error: 'Method not allowed' }); return; }

  const body = (req.body ?? {}) as {
    listingId?: string;
    walletAddress?: string;
    status?: string;
  };

  if (!body.listingId || !body.walletAddress || !body.status) {
    json(res, 400, { error: 'listingId, walletAddress, and status are required' });
    return;
  }

  const validStatuses = ['active', 'paused', 'closed'];
  if (!validStatuses.includes(body.status)) {
    json(res, 400, { error: `status must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    const listing = await getListing(body.listingId);
    if (!listing) { json(res, 404, { error: 'Listing not found' }); return; }

    if (listing.wallet_address !== body.walletAddress.toLowerCase()) {
      json(res, 403, { error: 'You do not own this listing' });
      return;
    }

    const updated = await updateListing(body.listingId, {
      status: body.status as 'active' | 'paused' | 'closed',
    });

    json(res, 200, { listing: updated });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}
