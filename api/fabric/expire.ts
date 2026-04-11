/**
 * POST /api/fabric/expire
 * Cron-triggered: marks sessions as expired if the deadline has passed without both sides submitting.
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
  let expired = 0;

  for (const session of sessions) {
    if (session.submissionDeadline >= now) continue;
    if (session.synthesis.status === 'complete') continue;

    session.synthesis.status = 'complete';
    session.synthesis.output = 'This session expired — one or both parties did not submit within the deadline.';

    // Notify both sides
    const label = session.title ?? session.flowSlug;
    const expireMsg = `${label} session expired without both sides submitting.`;
    await writeNotification({
      session_id: session.id,
      side: 'host',
      type: 'session_expired',
      title: 'Fabric session expired',
      message: expireMsg,
      action_url: `/fabric/${session.id}?hostToken=${session.hostToken}`,
    }).catch(() => { /* non-fatal */ });

    for (let i = 0; i < session.guestTokens.length; i++) {
      await writeNotification({
        session_id: session.id,
        side: `guest:${i}`,
        type: 'session_expired',
        title: 'Fabric session expired',
        message: expireMsg,
        action_url: `/fabric/${session.id}?guestToken=${session.guestTokens[i]}`,
      }).catch(() => { /* non-fatal */ });
    }

    await removeFromActiveIndex(session.id);
    await saveSession(session);
    expired++;
  }

  return res.status(200).json({ expired });
}
