/**
 * GET|POST|PATCH /api/discovery/:action
 * ========================================
 * Single Vercel function routing all discovery endpoints.
 * Consolidates 11 handlers → 1 function to stay within the 12-function Hobby limit.
 *
 * Routes:
 *   GET    /api/discovery/listings      → _listings
 *   POST   /api/discovery/listings      → _listings
 *   POST   /api/discovery/infer         → _infer
 *   GET    /api/discovery/matches       → _matches
 *   PATCH  /api/discovery/manage        → _manage
 *   POST   /api/discovery/prefill       → _prefill
 *   POST   /api/discovery/respond       → _respond
 *   POST   /api/discovery/score         → _score
 *   POST   /api/discovery/score-all     → _score-all  (cron protected)
 *   POST   /api/discovery/source        → _source
 *   GET    /api/discovery/summary       → _summary
 *   GET    /api/discovery/trust         → _trust
 */

import type { IncomingMessage, ServerResponse } from 'http';
import infer from './_infer.js';
import listings from './_listings.js';
import manage from './_manage.js';
import matches from './_matches.js';
import prefill from './_prefill.js';
import respond from './_respond.js';
import score from './_score.js';
import scoreAll from './_score-all.js';
import source from './_source.js';
import summary from './_summary.js';
import trust from './_trust.js';

type Req = IncomingMessage & { body?: unknown; query?: Record<string, string> };

const ROUTES: Record<string, (req: Req, res: ServerResponse) => Promise<void> | void> = {
  infer,
  listings,
  manage,
  matches,
  prefill,
  respond,
  score,
  'score-all': scoreAll,
  source,
  summary,
  trust,
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
