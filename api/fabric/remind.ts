/**
 * GET /api/fabric/remind
 *
 * Cron job — runs daily at 9am UTC.
 * Sends a Velma reminder notification for any Fabric session where:
 *   - Submission deadline is within the next 12 hours
 *   - Both sides have NOT yet submitted
 *   - The session hasn't already been reminded
 *   - Synthesis is still pending
 *
 * Protected by CRON_SECRET env var (Vercel injects Authorization header).
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getActiveSessions, saveSession } from './_store.js';
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
  const windowMs = 12 * 60 * 60 * 1000; // 12 hours

  try {
    const sessions = await getActiveSessions();
    let reminded = 0;

    for (const session of sessions) {
      if (session.reminded) continue;
      if (session.synthesis.status !== 'pending') continue;
      if (session.expiresAt < now) continue;

      const timeToDeadline = session.submissionDeadline - now;
      if (timeToDeadline > windowMs || timeToDeadline < 0) continue;

      const hoursLeft = Math.max(1, Math.round(timeToDeadline / (60 * 60 * 1000)));
      const label = session.title || session.flowSlug;

      // Remind host if they haven't submitted
      if (!session.host.submitted) {
        await writeNotification({
          session_id: session.id,
          side: 'host',
          type: 'fabric_reminder',
          title: 'Session deadline approaching',
          message: `"${label}" closes in ~${hoursLeft}h. Submit your answers before it expires.`,
          action_url: `/fabric/${session.id}`,
        });
      }

      // Remind each guest that hasn't submitted
      for (let i = 0; i < session.guestTokens.length; i++) {
        const guest = session.guests[i];
        if (!guest || !guest.submitted) {
          await writeNotification({
            session_id: session.id,
            side: `guest_${i}`,
            type: 'fabric_reminder',
            title: 'Session deadline approaching',
            message: `"${label}" closes in ~${hoursLeft}h. Your answers are still needed.`,
            action_url: `/fabric/${session.id}`,
          });
        }
      }

      session.reminded = true;
      await saveSession(session);
      reminded++;
    }

    json(res, 200, { reminded, checked: sessions.length });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}
