/**
 * FlowFabric AI Runtime — Vercel serverless function
 * Proxies requests to the Anthropic API with streaming.
 *
 * Set ANTHROPIC_API_KEY in Vercel environment variables.
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Server key takes priority; fall back to user-supplied key from browser
  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers.get('X-User-API-Key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API_KEY_REQUIRED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { messages, system, skill_name } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Anthropic API with streaming
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        stream: true,
        system: system || `You are running a FlowFabric skill called "${skill_name || 'unknown'}". Follow the skill definition precisely, executing each phase step by step. Show your work clearly. Ask for any required inputs before starting.`,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: error }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream the response back to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
