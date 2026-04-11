/**
 * GET /api/velma/notifications
 * ==============================
 * Returns unread Velma notifications for a wallet or a Fabric session side.
 *
 * Query params (one required):
 *   ?wallet=<address>
 *   ?sessionId=<id>&token=<hostToken|guestToken>
 *
 * Returns: { notifications: VelmaNotification[] }
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getSession } from '../fabric/_store.js';
import {
  getNotificationsByWallet,
  getNotificationsBySession,
} from '../_notifications.js';

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string> },
  res: ServerResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const { wallet, sessionId, token } = req.query ?? {};

  // ── Wallet-scoped ──────────────────────────────────────────────────────────
  if (wallet) {
    const notifications = await getNotificationsByWallet(wallet.toLowerCase(), true);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ notifications }));
    return;
  }

  // ── Session-scoped ─────────────────────────────────────────────────────────
  if (sessionId && token) {
    const session = await getSession(sessionId);
    if (!session) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found' }));
      return;
    }

    let side: string | undefined;
    if (token === session.hostToken) {
      side = 'host';
    } else {
      const idx = session.guestTokens.indexOf(token);
      if (idx !== -1) side = `guest:${idx}`;
    }

    if (!side) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid token' }));
      return;
    }

    const notifications = await getNotificationsBySession(sessionId, side, true);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ notifications }));
    return;
  }

  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'wallet or sessionId+token required' }));
}
