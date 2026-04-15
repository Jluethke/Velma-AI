/**
 * POST /api/discovery/infer
 * Body: { text: string }
 *
 * Claude Haiku infers the best flow + role from a free-text description.
 * Returns { flowSlug, role, title, description, tags } ready to pre-fill the form.
 */

import type { IncomingMessage, ServerResponse } from 'http';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const KNOWN_FLOWS = [
  'freelancer-client', 'job-offer-negotiation', 'cofounder-alignment',
  'investor-founder-term-sheet', 'business-partnership', 'real-estate-offer-negotiation',
  'vendor-client-sow', 'consultant-engagement', 'financial-planner-client',
  'coaching-executive-engagement', 'media-creator-brand-deal', 'startup-accelerator-founder',
  'school-district-vendor', 'interior-designer-client', 'immigration-attorney-client',
  'literary-agent-author', 'personal-trainer-client', 'therapy-intake-alignment',
  'wedding-vendor-couple', 'mortgage-origination', 'technology-partnership',
  'audit-engagement', 'property-management-contract', 'insurance-agency-client',
  'creative-agency-client', 'talent-management-engagement', 'executive-search-engagement',
  'pr-agency-client', 'nonprofit-grant-alignment', 'residential-buyer-agent',
  'recording-studio-artist', 'cpa-firm-client', 'sports-team-player-contract',
  'clinical-trial-site-agreement', 'veterinary-practice-client', 'architect-contractor-handoff',
  'hoa-homeowner-dispute', 'wealth-management-engagement', 'data-partnership-agreement',
  'government-grant-alignment', 'international-export-distributor', 'workforce-outsourcing',
];

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') { json(res, 405, { error: 'Method not allowed' }); return; }

  const body = (req.body ?? {}) as { text?: string };
  if (!body.text?.trim()) { json(res, 400, { error: 'text is required' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  const prompt = `You are helping a user post a listing on Fabric Discovery — a platform where two parties align using structured AI sessions.

The user wrote: "${body.text.trim()}"

Available flow slugs (pick the single best match):
${KNOWN_FLOWS.join(', ')}

Determine:
1. flowSlug — the single best matching flow from the list above (or a descriptive kebab-case slug if none fit)
2. role — "host" (the one initiating/seeking) or "guest" (the one providing/offering)
3. title — a concise 6-10 word listing title
4. description — a 2-3 sentence polished version of what the user wrote, suitable for a listing
5. tags — 3-5 relevant keyword tags as an array

Return ONLY valid JSON, no markdown:
{
  "flowSlug": "...",
  "role": "host" | "guest",
  "title": "...",
  "description": "...",
  "tags": ["...", "..."]
}`;

  try {
    let text = '';

    if (apiKey) {
      // Anthropic path
      const resp = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          stream: false,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!resp.ok) throw new Error(`Anthropic ${resp.status}`);
      const data = await resp.json() as { content: Array<{ type: string; text: string }> };
      text = data.content.find(b => b.type === 'text')?.text ?? '{}';
    } else {
      // Gemini fallback
      const googleKey = process.env.GOOGLE_API_KEY;
      if (!googleKey) { json(res, 500, { error: 'No AI API key configured' }); return; }
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleKey}`;
      const resp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
        }),
      });
      if (!resp.ok) throw new Error(`Gemini ${resp.status}`);
      const data = await resp.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
      text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    }

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    const inferred = JSON.parse(text) as {
      flowSlug: string;
      role: 'host' | 'guest';
      title: string;
      description: string;
      tags: string[];
    };

    json(res, 200, {
      flowSlug: inferred.flowSlug ?? '',
      role: inferred.role === 'guest' ? 'guest' : 'host',
      title: inferred.title ?? '',
      description: inferred.description ?? body.text,
      tags: Array.isArray(inferred.tags) ? inferred.tags : [],
    });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}
