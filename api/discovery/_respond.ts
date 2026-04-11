/**
 * POST /api/discovery/respond
 * Body: { matchId: string, action: 'accept' | 'reject', walletAddress: string }
 *
 * On accept:
 *   1. Verifies the wallet owns a listing in this match
 *   2. Creates a Fabric session for the flow
 *   3. Updates match status to 'accepted', stores fabric_session_id
 *   4. Returns { guestUrl, hostToken, sessionId }
 *
 * On reject:
 *   Updates match status to 'rejected'
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getMatch, getListing, updateMatch } from './_db.js';
import { createSession } from '../fabric/_store.js';

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
  if (req.method !== 'POST') { json(res, 405, { error: 'Method not allowed' }); return; }

  const body = (req.body ?? {}) as {
    matchId?: string;
    action?: string;
    walletAddress?: string;
  };

  if (!body.matchId || !body.action || !body.walletAddress) {
    json(res, 400, { error: 'matchId, action, and walletAddress are required' });
    return;
  }

  if (body.action !== 'accept' && body.action !== 'reject') {
    json(res, 400, { error: 'action must be "accept" or "reject"' });
    return;
  }

  try {
    const match = await getMatch(body.matchId);
    if (!match) { json(res, 404, { error: 'Match not found' }); return; }

    if (match.status !== 'pending') {
      json(res, 409, { error: `Match is already ${match.status}` });
      return;
    }

    // Verify wallet owns one of the listings in this match
    const [listing, matchedListing] = await Promise.all([
      getListing(match.listing_id),
      getListing(match.matched_listing_id),
    ]);

    const wallet = body.walletAddress.toLowerCase();
    const isOwner =
      listing?.wallet_address === wallet ||
      matchedListing?.wallet_address === wallet;

    if (!isOwner) {
      json(res, 403, { error: 'You do not own a listing in this match' });
      return;
    }

    if (body.action === 'reject') {
      await updateMatch(match.id, { status: 'rejected' });
      json(res, 200, { status: 'rejected' });
      return;
    }

    // Accept: create a Fabric session
    const flowSlug = listing?.flow_slug ?? matchedListing?.flow_slug ?? 'unknown';
    const title = [listing?.title, matchedListing?.title].filter(Boolean).join(' × ');

    const session = await createSession(flowSlug, title);

    const host = req.headers?.host ?? 'flowfabric.io';
    const baseUrl = process.env.FABRIC_BASE_URL ?? `https://${host}`;
    const guestUrl = `${baseUrl}/fabric/${session.id}`;

    await updateMatch(match.id, {
      status: 'accepted',
      fabric_session_id: session.id,
      initiated_by: wallet,
    });

    json(res, 200, {
      status: 'accepted',
      sessionId: session.id,
      guestUrl,
      hostToken: session.hostToken,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}
