/**
 * POST /api/discovery/score-all
 *
 * Protected cron endpoint. Re-scores all active listings sequentially.
 * Requires Authorization: Bearer ${CRON_SECRET} header.
 *
 * Intended to be called nightly via cron at 2am UTC.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getListings } from './_db.js';
import { scoreAndPersist } from './_score.js';

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage & { headers: Record<string, string | string[] | undefined> },
  res: ServerResponse
) {
  if (req.method !== 'GET') { json(res, 405, { error: 'Method not allowed' }); return; }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) { json(res, 401, { error: 'Unauthorized' }); return; }

  const authHeader = req.headers['authorization'];
  const provided = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (provided !== `Bearer ${cronSecret}`) { json(res, 401, { error: 'Unauthorized' }); return; }

  try {
    const activeListings = await getListings({ status: 'active' });

    const errors: string[] = [];
    let processed = 0;

    for (const listing of activeListings) {
      try {
        await scoreAndPersist(listing.id);
        processed++;
      } catch (err) {
        errors.push(`${listing.id}: ${String(err)}`);
      }
      // Small delay between calls to be nice to the API
      await new Promise(r => setTimeout(r, 500));
    }

    json(res, 200, { processed, errors, total: activeListings.length });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}
