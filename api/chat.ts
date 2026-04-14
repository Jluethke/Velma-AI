/**
 * FlowFabric AI Runtime — Vercel edge function
 *
 * Provider priority:
 *   1. ANTHROPIC_API_KEY (server env)  → Claude Sonnet — best quality
 *   2. X-User-API-Key (request header) → Claude Sonnet — user's own key
 *   3. GOOGLE_API_KEY  (server env)    → Gemini 2.0 Flash — free tier, zero cost
 *
 * Gemini responses are translated to Anthropic SSE format so the frontend
 * doesn't need to know which provider is running.
 */

export const config = { runtime: 'edge' };

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*',
};

// ── Gemini streaming → Anthropic SSE translation ──────────────────────────────

async function streamGemini(
  googleKey: string,
  messages: Array<{ role: string; content: string }>,
  system: string
): Promise<Response> {
  // Flatten multi-turn into a single user message (flows are always single-turn)
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n\n');

  const geminiBody = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
  };

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${googleKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    }
  );

  if (!upstream.ok) {
    const err = await upstream.text().catch(() => '');
    return new Response(JSON.stringify({ error: `Gemini error ${upstream.status}`, details: err }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Pipe Gemini SSE → Anthropic SSE format
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
            const text: string | undefined =
              parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const chunk = JSON.stringify({
                type: 'content_block_delta',
                delta: { type: 'text_delta', text },
              });
              await writer.write(enc.encode(`data: ${chunk}\n\n`));
            }
          } catch { /* skip malformed */ }
        }
      }

      await writer.write(enc.encode('data: [DONE]\n\n'));
    } catch (e) {
      const errChunk = JSON.stringify({ type: 'error', error: String(e) });
      await writer.write(enc.encode(`data: ${errChunk}\n\n`));
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, { status: 200, headers: SSE_HEADERS });
}

// ── Anthropic streaming (pass-through) ────────────────────────────────────────

async function streamAnthropic(
  anthropicKey: string,
  messages: Array<{ role: string; content: string }>,
  system: string,
  skillName: string
): Promise<Response> {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      stream: true,
      system: system || `You are running a FlowFabric skill called "${skillName}". Follow the skill definition precisely, executing each phase step by step.`,
      messages,
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text().catch(() => '');
    return new Response(
      JSON.stringify({ error: `Anthropic API error: ${upstream.status}`, details: err }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(upstream.body, { status: 200, headers: SSE_HEADERS });
}

// ── Handler ───────────────────────────────────────────────────────────────────

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
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Resolve which provider to use
  const anthropicKey =
    process.env.ANTHROPIC_API_KEY || req.headers.get('X-User-API-Key') || '';
  const googleKey = process.env.GOOGLE_API_KEY || '';

  if (!anthropicKey && !googleKey) {
    return new Response(JSON.stringify({ error: 'API_KEY_REQUIRED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { messages, system, skill_name } = body as {
      messages: Array<{ role: string; content: string }>;
      system?: string;
      skill_name?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resolvedSystem =
      system ||
      `You are running a FlowFabric skill called "${skill_name || 'unknown'}". Follow the skill definition precisely, executing each phase step by step. Show your work clearly.`;

    // Prefer Anthropic (Claude) when available; fall back to Gemini (free)
    if (anthropicKey) {
      return streamAnthropic(anthropicKey, messages, resolvedSystem, skill_name || 'unknown');
    } else {
      return streamGemini(googleKey, messages, resolvedSystem);
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
