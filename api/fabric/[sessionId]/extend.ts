/**
 * POST /api/fabric/:sessionId/extend
 * Allows the host to extend the submission deadline.
 * Body: { hostToken: string, hours?: number }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, saveSession, publicView } from '../_store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query as { sessionId: string };
  const session = await getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const body = req.body as { hostToken?: string; hours?: number };
  const { hostToken, hours: rawHours } = body;

  if (!hostToken || hostToken !== session.hostToken) {
    return res.status(403).json({ error: 'Invalid host token' });
  }

  const hours = Math.min(72, Math.max(1, rawHours ?? 24));

  session.submissionDeadline += hours * 60 * 60 * 1000;
  session.reminded = false;

  await saveSession(session);

  return res.status(200).json(publicView(session));
}
