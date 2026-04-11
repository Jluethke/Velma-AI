/**
 * POST /api/fabric/:sessionId/prompt
 * ====================================
 * Returns the assembled synthesis prompt for client-side execution.
 * Authenticated by hostToken. Used when the host runs synthesis locally
 * via claude-code-proxy (npx claude-code-proxy).
 *
 * Body: { hostToken: string }
 * Returns: { systemPrompt: string, userPrompt: string, model: string }
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getSession, sanitizeForPrompt } from '../_store.js';

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

  const body = (req.body ?? {}) as { hostToken?: string };
  if (!body.hostToken || body.hostToken !== session.hostToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid hostToken' }));
    return;
  }

  const allGuestsSubmitted =
    session.guests.filter(g => g?.submitted).length === session.maxGuests;

  if (!session.host.submitted || !allGuestsSubmitted) {
    res.writeHead(422, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'All sides must submit before synthesis' }));
    return;
  }

  if (session.synthesis.status === 'complete') {
    res.writeHead(409, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Synthesis already complete' }));
    return;
  }

  const label = session.title ?? session.flowSlug;

  const systemPrompt = `You are a neutral mediator facilitating a structured alignment session called "${label}".
You have received private submissions from both parties. Your role is to:
1. Find genuine common ground
2. Identify gaps and disagreements clearly
3. Weigh the pros and cons for EACH party on contested points
4. Suggest fair, concrete middle-ground positions with reasoning
5. Be neutral — do not advocate for either party

IMPORTANT: Do not reveal one party's raw answers to the other. Synthesise the positions, not the words.

Format your output with clear sections:
✓ Points of agreement
→ Gaps to bridge (with a concrete suggestion for each)
⚖ Trade-offs (what each party gains and gives up in the suggested middle ground)`;

  const hostData = sanitizeForPrompt(JSON.stringify(session.host.data, null, 2));

  const guestSections = session.guests.map((g, i) => {
    const safe = sanitizeForPrompt(JSON.stringify(g.data, null, 2));
    return `Party B${session.guests.length > 1 ? ` (candidate ${i + 1})` : ''} submission:\n${safe}`;
  }).join('\n\n');

  const userPrompt = `Session: ${label}

Party A (host) submission:
${hostData}

${guestSections}

Synthesise both sides as a neutral mediator. Be specific and actionable.`;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    systemPrompt,
    userPrompt,
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
  }));
}
