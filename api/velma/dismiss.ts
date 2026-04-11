/**
 * POST /api/velma/dismiss
 * =========================
 * Marks a notification (or all wallet notifications) as read.
 *
 * Body: { id?: string, wallet?: string }
 *   id     — dismiss a single notification by UUID
 *   wallet — dismiss all notifications for a wallet (batch clear)
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { dismissNotification, dismissAllByWallet } from '../_notifications.js';

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const body = (req.body ?? {}) as { id?: string; wallet?: string };

  if (body.id) {
    await dismissNotification(body.id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ dismissed: body.id }));
    return;
  }

  if (body.wallet) {
    await dismissAllByWallet(body.wallet.toLowerCase());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ dismissed: 'all', wallet: body.wallet.toLowerCase() }));
    return;
  }

  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'id or wallet required' }));
}
