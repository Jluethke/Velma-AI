/**
 * POST /api/discovery/source
 * ===========================
 * Generates a ready-to-paste Claude prompt for external sourcing
 * via Vibe Prospecting tools. Uses Claude Haiku to generate search
 * terms, then builds a full openInClaude URL.
 *
 * Body: { listingId: string }
 *
 * Returns:
 *   { listingId, searchTerms, claudePrompt, openInClaude }
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getListing } from './_db.js';

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function generateSearchTerms(
  flowSlug: string,
  description: string,
  oppositeRole: string,
  apiKey: string
): Promise<string[]> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `Given this listing for ${flowSlug}: '${description}', generate 3-5 specific search terms to find the ideal ${oppositeRole} counterpart. Return JSON array of strings only.`,
          },
        ],
      }),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    const text = data.content?.find(b => b.type === 'text')?.text ?? '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const parsed: unknown = JSON.parse(match[0]);
    if (Array.isArray(parsed) && parsed.every(s => typeof s === 'string')) {
      return parsed as string[];
    }
    return [];
  } catch {
    return [];
  }
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  const body = (req.body ?? {}) as { listingId?: string };
  const { listingId } = body;

  if (!listingId) {
    json(res, 400, { error: 'listingId is required' });
    return;
  }

  const listing = await getListing(listingId).catch(() => null);
  if (!listing) {
    json(res, 404, { error: 'Listing not found' });
    return;
  }

  const oppositeRole = listing.role === 'host' ? 'guest' : 'host';

  const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
  let searchTerms: string[] = [];

  if (apiKey) {
    searchTerms = await generateSearchTerms(
      listing.flow_slug,
      listing.description,
      oppositeRole,
      apiKey
    );
  }

  if (searchTerms.length === 0) {
    searchTerms = [listing.flow_slug, ...listing.tags.slice(0, 3)];
  }

  const audienceLabel =
    oppositeRole === 'host' ? 'professionals/businesses/individuals' : 'professionals/businesses/individuals';

  const claudePrompt = `I need to find external matches for a Fabric Discovery listing.

Listing: ${listing.title}
I am the ${listing.role} looking for a ${oppositeRole} for: ${listing.flow_slug}
Description: ${listing.description}
Market/Location: ${listing.market ?? 'not specified'}
Tags: ${listing.tags.join(', ')}

Please:
1. Use the Vibe Prospecting tools (match-prospects or enrich-prospects) to find the best-fit ${audienceLabel} who could be the ${oppositeRole} in this ${listing.flow_slug} session.
2. Search for: ${searchTerms.join(', ')}
3. Enrich the top 5 results.
4. For each enriched result, call POST /api/discovery/listings with this JSON body:
   {
     "wallet_address": "0x0000000000000000000000000000000000000000",
     "flow_slug": "${listing.flow_slug}",
     "role": "${oppositeRole}",
     "title": "[prospect's name/company + brief role]",
     "description": "[their background and why they fit]",
     "market": "[their location/market]",
     "tags": [relevant tags],
     "status": "active",
     "sourced_externally": true
   }

Return a summary of who you found and what listings were created on the board.`;

  const openInClaude = `https://claude.ai/new?q=${encodeURIComponent(claudePrompt.slice(0, 2000))}`;

  json(res, 200, {
    listingId,
    searchTerms,
    claudePrompt,
    openInClaude,
  });
}
