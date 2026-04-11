/**
 * Fabric Discovery — AI Match Engine
 * =====================================
 * Scores a source listing against up to 20 candidates in a single
 * non-streaming Anthropic call. Returns ranked matches with score + intro.
 */

import type { DiscoveryListing } from './_db.js';

export interface MatchScore {
  candidateId: string;
  score: number;       // 0.0 – 10.0
  reasoning: string;
  introText: string;   // personalized intro paragraph shown to both parties
}

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const BATCH_SIZE = 20;

export async function scoreMatches(
  source: DiscoveryListing,
  candidates: DiscoveryListing[]
): Promise<MatchScore[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  if (candidates.length === 0) return [];

  const allScores: MatchScore[] = [];

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const scores = await scoreBatch(source, batch, apiKey);
    allScores.push(...scores);
  }

  // Filter low scores and sort descending
  return allScores
    .filter(s => s.score >= 3.0)
    .sort((a, b) => b.score - a.score);
}

async function scoreBatch(
  source: DiscoveryListing,
  candidates: DiscoveryListing[],
  apiKey: string
): Promise<MatchScore[]> {
  const candidateList = candidates.map((c, idx) => `
Candidate ${idx + 1} (id: ${c.id}):
  Role: ${c.role}
  Title: ${c.title}
  Description: ${c.description}
  Market: ${c.market ?? 'not specified'}
  Tags: ${c.tags.join(', ') || 'none'}`).join('\n');

  const prompt = `You are a match-scoring engine for Fabric Discovery — a platform that connects two parties for structured AI-facilitated alignment sessions.

SOURCE LISTING (id: ${source.id}):
  Flow: ${source.flow_slug}
  Role: ${source.role}
  Title: ${source.title}
  Description: ${source.description}
  Market: ${source.market ?? 'not specified'}
  Tags: ${source.tags.join(', ') || 'none'}

CANDIDATE LISTINGS (all are ${source.role === 'host' ? 'guest' : 'host'} role for the same flow):
${candidateList}

For each candidate, output a JSON array of match objects. Score each candidate 0.0–10.0 based on:
- Alignment of goals, needs, and what each party is offering
- Complementary context (market, scale, timing)
- Specificity match — vague vs specific descriptions
- Red flags: mismatched expectations, conflicting constraints

Return ONLY a JSON array, no markdown, no explanation outside the JSON:
[
  {
    "candidateId": "<uuid>",
    "score": <number 0.0-10.0>,
    "reasoning": "<1-2 sentences explaining the score>",
    "introText": "<2-3 sentence warm intro paragraph written to both parties explaining why this match was made and what they have in common>"
  }
]`;

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      stream: false,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic API error: ${res.status} ${text}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content.find(b => b.type === 'text')?.text ?? '[]';

  try {
    const parsed = JSON.parse(text) as Array<{
      candidateId: string;
      score: number;
      reasoning: string;
      introText: string;
    }>;
    return parsed.map(p => ({
      candidateId: p.candidateId,
      score: Math.max(0, Math.min(10, Number(p.score))),
      reasoning: p.reasoning ?? '',
      introText: p.introText ?? '',
    }));
  } catch {
    // If Claude returned malformed JSON, skip this batch
    return [];
  }
}
