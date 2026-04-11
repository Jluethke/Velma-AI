/**
 * GET /api/fabric/expire
 *
 * Cron job — runs daily at 3am UTC.
 * Cleans up expired sessions from the active index and sends
 * a session_expired Velma notification for any session that
 * expired without synthesis completing.
 *
 * Protected by CRON_SECRET env var (Vercel injects Authorization header).
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getActiveSessions, removeFromActiveIndex } from './_store.js';
import { writeNotification } from '../_notifications.js';

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
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    const provided = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (provided !== `Bearer ${cronSecret}`) { json(res, 401, { error: 'Unauthorized' }); return; }
  }

  const now = Date.now();

  try {
    const sessions = await getActiveSessions();
    let expired = 0;

    for (const session of sessions) {
      if (session.expiresAt >= now) continue;

      // If synthesis never completed, notify the host
      if (session.synthesis.status !== 'complete') {
        const label = session.title || session.flowSlug;
        await writeNotification({
          session_id: session.id,
          side: 'host',
          type: 'session_expired',
          title: 'Session expired',
          message: `"${label}" has expired without completing synthesis. Start a new session when you're ready.`,
          action_url: '/start',
        });
      }

      await removeFromActiveIndex(session.id);
      expired++;
    }

    json(res, 200, { expired, checked: sessions.length });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}
