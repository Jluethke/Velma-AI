/**
 * POST /api/fabric/remind
 * Cron-triggered: sends reminders for sessions nearing their submission deadline.
 * Protected by Authorization: Bearer ${CRON_SECRET}
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getActiveSessions, saveSession, removeFromActiveIndex } from './_store.js';
import { writeNotification } from '../_notifications.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sessions = await getActiveSessions();
  const now = Date.now();
  let reminded = 0;

  for (const session of sessions) {
    // Skip already-reminded or complete sessions
    if (session.reminded) continue;
    if (session.synthesis.status === 'complete') continue;

    const timeUntilDeadline = session.submissionDeadline - now;
    if (timeUntilDeadline >= 24 * 60 * 60 * 1000) continue;

    // Determine which side(s) haven't submitted
    // Support both old `guest` field and new `guests` array
    const guestsArr = session.guests;
    const hostSubmitted = session.host.submitted;
    const guestSubmitted = guestsArr.length > 0
      ? guestsArr.every(g => g.submitted)
      : false;

    const anyMissing = !hostSubmitted || !guestSubmitted;
    if (!anyMissing) continue;

    let missingSide: 'host' | 'guest' | 'both';
    if (!hostSubmitted && !guestSubmitted) {
      missingSide = 'both';
    } else if (!hostSubmitted) {
      missingSide = 'host';
    } else {
      missingSide = 'guest';
    }

    const hoursRemaining = Math.max(0, Math.floor(timeUntilDeadline / (1000 * 60 * 60)));

    // Write in-app Velma notifications
    const sessionLabel = session.title ?? session.flowSlug;
    const notifMessage = `${sessionLabel} — ${hoursRemaining}h left to submit. Don't leave the other side hanging.`;

    if (missingSide === 'host' || missingSide === 'both') {
      await writeNotification({
        session_id: session.id,
        side: 'host',
        type: 'fabric_reminder',
        title: 'Fabric session expiring soon',
        message: notifMessage,
        action_url: `/fabric/${session.id}?hostToken=${session.hostToken}`,
      }).catch(() => { /* non-fatal */ });
    }

    if (missingSide === 'guest' || missingSide === 'both') {
      for (let i = 0; i < session.guestTokens.length; i++) {
        const guestSubmitted = session.guests[i]?.submitted ?? false;
        if (!guestSubmitted) {
          await writeNotification({
            session_id: session.id,
            side: `guest:${i}`,
            type: 'fabric_reminder',
            title: 'Fabric session expiring soon',
            message: notifMessage,
            action_url: `/fabric/${session.id}?guestToken=${session.guestTokens[i]}`,
          }).catch(() => { /* non-fatal */ });
        }
      }
    }

    // Also fire webhook if configured (optional external integration)
    const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'fabric_reminder',
          sessionId: session.id,
          title: sessionLabel,
          missingSide,
          hoursRemaining,
        }),
      }).catch(() => { /* non-fatal */ });
    }

    // Mark reminded and save
    session.reminded = true;

    // Remove from active index if already past deadline
    if (now > session.submissionDeadline) {
      await removeFromActiveIndex(session.id);
    }

    await saveSession(session);
    reminded++;
  }

  return res.status(200).json({ reminded, checked: sessions.length });
}
