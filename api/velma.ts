/**
 * POST /api/velma
 * Body: { messages: [{role, content}], skills: [{name, domain, description}] }
 *
 * Velma interview endpoint — Claude/Gemini acts as Velma, asks 1-2 questions
 * to understand the user's situation, then suggests relevant flows + a path.
 *
 * Streams back in Anthropic SSE format (same as /api/chat) so the client
 * can reuse the same reader logic.
 */

export const config = { runtime: 'edge' };

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*',
};

function buildSystem(skills: Array<{ name: string; domain: string; description: string }>, page?: string): string {
  const flowList = skills
    .map(s => `${s.name} (${s.domain}): ${s.description.slice(0, 90)}`)
    .join('\n');

  const pageContext = page ? `\nCONTEXT: The user is currently on ${page}.` : '';

  const discoveryFlows = [
    'cofounder-alignment', 'investor-founder-term-sheet', 'freelancer-client',
    'job-offer-negotiation', 'coaching-executive-engagement', 'personal-trainer-client',
    'business-partnership', 'vendor-client-sow', 'consultant-engagement',
    'technology-partnership', 'startup-accelerator-founder', 'executive-search-engagement',
    'financial-planner-client', 'mortgage-origination', 'immigration-attorney-client',
    'cpa-firm-client', 'wealth-management-engagement', 'real-estate-offer-negotiation',
    'residential-buyer-agent', 'media-creator-brand-deal', 'literary-agent-author',
    'creative-agency-client', 'pr-agency-client', 'talent-management-engagement',
    'therapy-intake-alignment', 'interior-designer-client', 'wedding-vendor-couple',
    'hoa-homeowner-dispute', 'workforce-outsourcing',
  ].join(', ');

  return `You are Velma — the FlowFabric guide. Sharp, dry, direct. You help people understand what FlowFabric can actually do for their situation and find exactly the right flows.

FlowFabric has 165+ AI-powered flows: career, money, decisions, relationships, health, business, legal, real estate, and life planning. Each flow is a structured AI conversation that produces a concrete output.${pageContext}

FlowFabric also has Fabric Discovery — a matchmaking board where people post listings to find real human counterparts: co-founders, investors, clients, coaches, contractors, service providers, and more. Listings are matched by AI and connected via two-party alignment sessions.

Your job: understand their situation fast, route them to the right flows, and when they need a real human counterpart, draft a Discovery listing for them.

RULES:
1. Ask AT MOST 2 clarifying questions. If situation is clear, skip straight to output.
2. Keep responses SHORT — 2-3 sentences max before structured output.
3. Be Velma: dry, direct, high-signal. No filler. No "Great question!"
4. If user is on a specific flow page, reference that flow directly.
5. When the user needs to FIND A PERSON (co-founder, investor, client, coach, contractor, lawyer, trainer, buyer, seller, vendor, creative, therapist, etc.), output a LISTING block:

LISTING:
title: [one punchy line — who they are and what they need, specific details]
flow: [pick the best matching flow name from DISCOVERY FLOWS below, e.g. kitchen-renovation]
role: host (needs someone) | guest (offers a service)
description: [2-3 sentences expanding on their situation, written as the listing body — specific, compelling, honest]
tags: tag1, tag2, tag3

6. When the user needs to RUN A FLOW or figure something out mentally, output FLOWS/PATH as usual:

FLOWS:
- budget-builder: Helps you build a realistic monthly budget from your actual spending
- interview-coach: Practice likely interview questions with AI-driven feedback
(use the actual flow slug from AVAILABLE FLOWS below — 3-5 flows max, never use the word "slug")

PATH: budget-builder → expense-optimizer → retirement-planner
(only if a logical order exists — use actual slugs, omit PATH entirely if not needed)

7. You can output BOTH a LISTING and FLOWS if relevant (listing first, then flows to prepare).
8. Only suggest flows from AVAILABLE FLOWS. Only use flow slugs from DISCOVERY FLOWS for the listing's flow field.
9. If user pastes a document, analyze it and suggest flows or a listing from what you see.

DISCOVERY FLOWS (for listing.flow field only):
${discoveryFlows}

AVAILABLE FLOWS:
${flowList}`;
}

async function streamAnthropic(key: string, messages: Array<{ role: string; content: string }>, system: string): Promise<Response> {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      stream: true,
      system,
      messages,
    }),
  });
  if (!upstream.ok) {
    const err = await upstream.text().catch(() => '');
    return new Response(JSON.stringify({ error: `Anthropic ${upstream.status}`, details: err }), {
      status: upstream.status, headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(upstream.body, { status: 200, headers: SSE_HEADERS });
}

async function streamGemini(key: string, messages: Array<{ role: string; content: string }>, system: string): Promise<Response> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${key}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      }),
    }
  );

  if (!upstream.ok) {
    const err = await upstream.text().catch(() => '');
    return new Response(JSON.stringify({ error: `Gemini ${upstream.status}`, details: err }), {
      status: upstream.status, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  (async () => {
    try {
      const reader = upstream.body!.getReader();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            const text: string | undefined = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const chunk = JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text } });
              await writer.write(enc.encode(`data: ${chunk}\n\n`));
            }
          } catch { /* skip malformed */ }
        }
      }
      await writer.write(enc.encode('data: [DONE]\n\n'));
    } catch (e) {
      await writer.write(enc.encode(`data: ${JSON.stringify({ type: 'error', error: String(e) })}\n\n`));
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, { status: 200, headers: SSE_HEADERS });
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-API-Key',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY || req.headers.get('X-User-API-Key') || '';
  const googleKey = process.env.GOOGLE_API_KEY || '';

  if (!anthropicKey && !googleKey) {
    return new Response(JSON.stringify({ error: 'API_KEY_REQUIRED' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json() as {
      messages: Array<{ role: string; content: string }>;
      skills: Array<{ name: string; domain: string; description: string }>;
      context?: { page?: string };
      memory?: string;
    };

    if (!body.messages?.length) {
      return new Response(JSON.stringify({ error: 'messages required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const system = buildSystem(body.skills ?? [], body.context?.page) + (body.memory || '');

    const safeMessages = body.messages.map(m => {
      if (m.role !== 'user') return m;
      let content = m.content;
      const patterns = [
        /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
        /disregard\s+(all\s+)?(previous|prior|above)/gi,
        /you\s+are\s+now\s+(a|an)\s+/gi,
        /pretend\s+(you\s+are|to\s+be)/gi,
        /new\s+instructions?:/gi,
        /\[INST\]|\[\/INST\]|<\|system\|>|<\|user\|>/gi,
      ];
      for (const p of patterns) content = content.replace(p, '[removed]');
      return { ...m, content };
    });

    return anthropicKey
      ? streamAnthropic(anthropicKey, safeMessages, system)
      : streamGemini(googleKey, safeMessages, system);

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
