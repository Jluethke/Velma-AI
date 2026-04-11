/**
 * POST /api/fabric/:sessionId/:action
 * =====================================
 * Single Vercel function routing all per-session mutation endpoints.
 *
 * Routes:
 *   POST /api/fabric/:sessionId/host       → _host
 *   POST /api/fabric/:sessionId/guest      → _guest
 *   POST /api/fabric/:sessionId/synthesize → _synthesize
 *   POST /api/fabric/:sessionId/outcome    → _outcome
 *   POST /api/fabric/:sessionId/extend     → _extend
 */

import type { IncomingMessage, ServerResponse } from 'http';
import host from './_host.js';
import guest from './_guest.js';
import synthesize from './_synthesize.js';
import outcome from './_outcome.js';
import extend from './_extend.js';
import prompt from './_prompt.js';
import saveSynthesis from './_save-synthesis.js';

type Req = IncomingMessage & { body?: unknown; query?: Record<string, string> };

const ROUTES: Record<string, (req: Req, res: ServerResponse) => Promise<void> | void> = {
  host,
  guest,
  synthesize,
  outcome,
  extend,
  prompt,
  'save-synthesis': saveSynthesis,
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
