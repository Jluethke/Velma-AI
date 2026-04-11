/**
 * POST /api/fabric/:sessionId/save-synthesis
 * ============================================
 * Saves synthesis output produced client-side (via claude-code-proxy).
 * Authenticated by hostToken.
 *
 * Body: { hostToken: string, output: string }
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getSession, saveSession, publicView } from '../_store.js';
import { writeNotification } from '../../_notifications.js';

export default async function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string> },
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

  const sessionId = req.query?.sessionId;
  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'sessionId required' }));
    return;
  }

  const session = await getSession(sessionId);
  if (!session) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session not found' }));
    return;
  }

  const body = (req.body ?? {}) as { hostToken?: string; output?: string };

  if (!body.hostToken || body.hostToken !== session.hostToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid hostToken' }));
    return;
  }

  if (!body.output || typeof body.output !== 'string' || !body.output.trim()) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'output is required' }));
    return;
  }

  if (session.synthesis.status === 'complete') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(publicView(session)));
    return;
  }

  session.synthesis.status = 'complete';
  session.synthesis.output = body.output.trim();
  await saveSession(session);

  // Notify all sides
  const label = session.title ?? session.flowSlug;
  const sides: string[] = ['host', ...session.guestTokens.map((_, i) => `guest:${i}`)];
  const tokens: string[] = [session.hostToken, ...session.guestTokens];
  await Promise.all(sides.map((side, i) =>
    writeNotification({
      session_id: session.id,
      side,
      type: 'synthesis_ready',
      title: 'Synthesis ready',
      message: `Your ${label} session has been synthesised.`,
      action_url: `/fabric/${session.id}?${i === 0 ? 'hostToken' : 'guestToken'}=${tokens[i]}`,
    }).catch(() => { /* non-fatal */ })
  ));

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(publicView(session)));
}
