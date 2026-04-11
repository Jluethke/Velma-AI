/**
 * GET|POST /api/velma/:action
 * ============================
 * Single Vercel function routing Velma notification endpoints.
 *
 * Routes:
 *   GET  /api/velma/notifications → _notifications
 *   POST /api/velma/dismiss       → _dismiss
 */

import type { IncomingMessage, ServerResponse } from 'http';
import notifications from './_notifications.js';
import dismiss from './_dismiss.js';

type Req = IncomingMessage & { body?: unknown; query?: Record<string, string> };

const ROUTES: Record<string, (req: Req, res: ServerResponse) => Promise<void> | void> = {
  notifications,
  dismiss,
};

export default async function handler(req: Req, res: ServerResponse) {
  const action = req.query?.action;

  if (!action || !ROUTES[action]) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Unknown action: ${action ?? '(none)'}` }));
    return;
  }

  return ROUTES[action](req, res);
}
