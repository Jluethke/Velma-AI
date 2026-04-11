/**
 * GET  /api/fabric/:sessionId          — returns public session state
 * POST /api/fabric/remind              — cron: deadline reminders
 * POST /api/fabric/expire              — cron: expire stale sessions
 *
 * "remind" and "expire" are literal strings that match this dynamic route
 * when their dedicated files no longer exist. Cron paths in vercel.json
 * are unchanged — Vercel routes them here via [sessionId] matching.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getSession, publicView, getActiveSessions, saveSession, removeFromActiveIndex } from './_store.js';
import { writeNotification } from '../_notifications.js';

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function cronAuthed(req: IncomingMessage): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers['authorization'];
  const provided = Array.isArray(auth) ? auth[0] : auth;
  return provided === `Bearer ${secret}`;
}

// ── POST /api/fabric/remind ───────────────────────────────────────────────────

async function handleRemind(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') { json(res, 405, { error: 'Method not allowed' }); return; }
  if (!cronAuthed(req)) { json(res, 401, { error: 'Unauthorized' }); return; }

  const sessions = await getActiveSessions();
  const now = Date.now();
  let reminded = 0;

  for (const session of sessions) {
    if (session.reminded) continue;
    if (session.synthesis.status === 'complete') continue;

    const timeUntilDeadline = session.submissionDeadline - now;
    if (timeUntilDeadline >= 24 * 60 * 60 * 1000) continue;

    const hostSubmitted = session.host.submitted;
    const allGuestsSubmitted = session.guests.length > 0 && session.guests.every(g => g.submitted);
    if (hostSubmitted && allGuestsSubmitted) continue;

    const missingSide: 'host' | 'guest' | 'both' =
      !hostSubmitted && !allGuestsSubmitted ? 'both' :
      !hostSubmitted ? 'host' : 'guest';

    const hoursRemaining = Math.max(0, Math.floor(timeUntilDeadline / (1000 * 60 * 60)));
    const sessionLabel = session.title ?? session.flowSlug;
    const notifMessage = `${sessionLabel} \u2014 ${hoursRemaining}h left to submit. Don\u2019t leave the other side hanging.`;

    if (missingSide === 'host' || missingSide === 'both') {
      await writeNotification({
        session_id: session.id, side: 'host',
        type: 'fabric_reminder', title: 'Fabric session expiring soon', message: notifMessage,
        action_url: `/fabric/${session.id}?hostToken=${session.hostToken}`,
      }).catch(() => { /* non-fatal */ });
    }

    if (missingSide === 'guest' || missingSide === 'both') {
      for (let i = 0; i < session.guestTokens.length; i++) {
        if (!(session.guests[i]?.submitted)) {
          await writeNotification({
            session_id: session.id, side: `guest:${i}`,
            type: 'fabric_reminder', title: 'Fabric session expiring soon', message: notifMessage,
            action_url: `/fabric/${session.id}?guestToken=${session.guestTokens[i]}`,
          }).catch(() => { /* non-fatal */ });
        }
      }
    }

    const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'fabric_reminder', sessionId: session.id, title: sessionLabel, missingSide, hoursRemaining }),
      }).catch(() => { /* non-fatal */ });
    }

    session.reminded = true;
    if (now > session.submissionDeadline) await removeFromActiveIndex(session.id);
    await saveSession(session);
    reminded++;
  }

  json(res, 200, { reminded, checked: sessions.length });
}

// ── POST /api/fabric/expire ───────────────────────────────────────────────────

async function handleExpire(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') { json(res, 405, { error: 'Method not allowed' }); return; }
  if (!cronAuthed(req)) { json(res, 401, { error: 'Unauthorized' }); return; }

  const sessions = await getActiveSessions();
  const now = Date.now();
  let expired = 0;

  for (const session of sessions) {
    if (session.submissionDeadline >= now) continue;
    if (session.synthesis.status === 'complete') continue;

    session.synthesis.status = 'complete';
    session.synthesis.output = 'This session expired \u2014 one or both parties did not submit within the deadline.';

    const label = session.title ?? session.flowSlug;
    const expireMsg = `${label} session expired without both sides submitting.`;

    await writeNotification({
      session_id: session.id, side: 'host',
      type: 'session_expired', title: 'Fabric session expired', message: expireMsg,
      action_url: `/fabric/${session.id}?hostToken=${session.hostToken}`,
    }).catch(() => { /* non-fatal */ });

    for (let i = 0; i < session.guestTokens.length; i++) {
      await writeNotification({
        session_id: session.id, side: `guest:${i}`,
        type: 'session_expired', title: 'Fabric session expired', message: expireMsg,
        action_url: `/fabric/${session.id}?guestToken=${session.guestTokens[i]}`,
      }).catch(() => { /* non-fatal */ });
    }

    await removeFromActiveIndex(session.id);
    await saveSession(session);
    expired++;
  }

  json(res, 200, { expired });
}

// ── GET /api/fabric/:sessionId ────────────────────────────────────────────────

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string> },
  res: ServerResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const sessionId = req.query?.sessionId;

  // Cron routes — literal segment matches
  if (sessionId === 'remind') { await handleRemind(req, res); return; }
  if (sessionId === 'expire') { await handleExpire(req, res); return; }

  // Normal session lookup
  if (req.method !== 'GET') { json(res, 405, { error: 'Method not allowed' }); return; }

  if (!sessionId) { json(res, 400, { error: 'sessionId is required' }); return; }

  const session = await getSession(sessionId);
  if (!session) { json(res, 404, { error: 'Session not found or expired' }); return; }

  json(res, 200, publicView(session));
}
