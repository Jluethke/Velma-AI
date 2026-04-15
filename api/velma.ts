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

function buildSystem(skills: Array<{ name: string; domain: string; description: string }>): string {
  const flowList = skills
    .map(s => `${s.name} (${s.domain}): ${s.description.slice(0, 90)}`)
    .join('\n');

  return `You are the FlowFabric discovery guide. Sharp, direct, zero filler. You help people understand what FlowFabric can do for their specific situation and find the exact flows they need.

FlowFabric is a platform with 165+ AI-powered flows across career, money, decisions, relationships, health, business, legal, real estate, and life planning. Each flow is a structured AI conversation that produces a concrete output.

Your job: understand the user's situation through minimal conversation, then connect it to the right flows — and briefly explain how FlowFabric's approach suits their need.

RULES:
1. Ask AT MOST 2 clarifying questions. If the situation is clear, skip straight to suggestions.
2. Keep every response SHORT — 2-3 sentences max before suggestions.
3. Be direct and high-signal. No "Great question!" No filler. Lead with what the platform can actually do for them.
4. When you have enough context, ALWAYS end your response with this EXACT format:

FLOWS:
- slug: one sentence explaining why this helps their specific situation
- slug: one sentence explaining why this helps their specific situation
(suggest 3-5 flows, no more)

PATH: slug1 → slug2 → slug3
(only if there is a logical order — omit this line entirely if not)

5. Only suggest flows from the AVAILABLE FLOWS list.
6. The PATH should reflect the most impactful sequence, not just alphabetical order.
7. If the user pastes a document (resume, financial data, etc.), analyze it and suggest flows based on what you see.

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
    };

    if (!body.messages?.length) {
      return new Response(JSON.stringify({ error: 'messages required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const system = buildSystem(body.skills ?? []);

    return anthropicKey
      ? streamAnthropic(anthropicKey, body.messages, system)
      : streamGemini(googleKey, body.messages, system);

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
