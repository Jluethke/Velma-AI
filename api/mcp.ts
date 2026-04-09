/**
 * FlowFabric Remote MCP Server — Vercel Serverless Function
 *
 * Implements MCP (Model Context Protocol) over Streamable HTTP.
 * Claude.ai connects to this as a custom connector.
 *
 * URL: https://flowfabric.io/api/mcp
 */

export const config = {
  runtime: 'edge',
  // Don't buffer — stream responses
  supportsResponseStreaming: true,
};

const GITHUB_RAW =
  'https://raw.githubusercontent.com/Jluethke/Velma-AI/main';

// ---------------------------------------------------------------------------
// Skill data
// ---------------------------------------------------------------------------

interface Skill {
  name: string;
  domain: string;
  tags: string[];
  inputs: string[];
  outputs: string[];
  description: string;
}

let catalogCache: Skill[] | null = null;

async function loadCatalog(): Promise<Skill[]> {
  if (catalogCache) return catalogCache;
  // Load from GitHub since the Vercel SPA rewrite might intercept the static file
  const res = await fetch(`${GITHUB_RAW}/public/skill-catalog.json`);
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`);
  catalogCache = (await res.json()) as Skill[];
  return catalogCache;
}

async function loadSkillMd(name: string): Promise<string> {
  const res = await fetch(`${GITHUB_RAW}/marketplace/${name}/skill.md`);
  if (res.ok) return await res.text();
  throw new Error(`Flow "${name}" not found`);
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function listSkills() {
  const catalog = await loadCatalog();
  return catalog.map((s) => ({
    name: s.name,
    domain: s.domain,
    description: s.description,
  }));
}

async function getSkill(name: string) {
  const catalog = await loadCatalog();
  const meta = catalog.find((s) => s.name === name);
  if (!meta) throw new Error(`Flow "${name}" not found in catalog`);
  const content = await loadSkillMd(name);
  return { ...meta, content };
}

async function runSkill(name: string) {
  const content = await loadSkillMd(name);
  return {
    flow: name,
    instructions: 'Follow the flow definition below phase-by-phase. Ask the user for any required inputs before starting each phase. Execute every phase in order.',
    content,
  };
}

async function searchSkills(query: string) {
  const catalog = await loadCatalog();
  const q = query.toLowerCase();
  const terms = q.split(/\s+/);
  return catalog
    .map((s) => {
      const haystack = `${s.name} ${s.domain} ${s.tags.join(' ')} ${s.description}`.toLowerCase();
      const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      return { skill: s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((x) => ({ name: x.skill.name, domain: x.skill.domain, description: x.skill.description, score: x.score }));
}

// ---------------------------------------------------------------------------
// MCP Protocol
// ---------------------------------------------------------------------------

const SERVER_INFO = { name: 'flowfabric', version: '1.0.0' };
const CAPABILITIES = { tools: {} };

const TOOLS = [
  {
    name: 'list_flows',
    description: 'List all available FlowFabric flows with their domains and descriptions.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_flow',
    description: 'Get the full flow definition (markdown) for a given flow name.',
    inputSchema: {
      type: 'object' as const,
      properties: { name: { type: 'string', description: 'The flow name (e.g. "budget-builder")' } },
      required: ['name'],
    },
  },
  {
    name: 'run_flow',
    description: 'Start interactive execution of a flow. Returns the full definition for the AI to follow phase-by-phase.',
    inputSchema: {
      type: 'object' as const,
      properties: { name: { type: 'string', description: 'The flow name to run' } },
      required: ['name'],
    },
  },
  {
    name: 'search_flows',
    description: 'Search FlowFabric flows by keyword. Returns up to 20 matching flows ranked by relevance.',
    inputSchema: {
      type: 'object' as const,
      properties: { query: { type: 'string', description: 'Search query — keywords, domain, or natural language' } },
      required: ['query'],
    },
  },
];

// ---------------------------------------------------------------------------
// JSON-RPC helpers
// ---------------------------------------------------------------------------

function jsonrpc(id: string | number | null, result: unknown) {
  return { jsonrpc: '2.0', id, result };
}

function jsonrpcError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: Request) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, Accept',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  };

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // GET — health check / server info
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        name: 'FlowFabric MCP Server',
        version: '1.0.0',
        status: 'ok',
        description: 'Remote MCP server for FlowFabric AI flows. Connect via Claude Settings → Connectors → Add Custom Connector.',
        tools: TOOLS.map((t) => t.name),
        protocol: 'MCP 2024-11-05 over Streamable HTTP',
      }),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }

  // DELETE — session cleanup (no-op for stateless server)
  if (req.method === 'DELETE') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  // Check Accept header — Claude may request SSE or JSON
  const accept = req.headers.get('accept') || '';
  const wantsSSE = accept.includes('text/event-stream');

  try {
    const body = await req.json();
    const { method, params, id } = body;

    let responseBody: unknown;

    switch (method) {
      case 'initialize':
        responseBody = jsonrpc(id, {
          protocolVersion: '2024-11-05',
          serverInfo: SERVER_INFO,
          capabilities: CAPABILITIES,
        });
        break;

      case 'notifications/initialized':
        // Notification — no response needed but send empty OK
        responseBody = jsonrpc(id ?? null, {});
        break;

      case 'tools/list':
        responseBody = jsonrpc(id, { tools: TOOLS });
        break;

      case 'tools/call': {
        const toolName = params?.name;
        const args = params?.arguments ?? {};
        let result: unknown;

        switch (toolName) {
          case 'list_flows':
          case 'list_skills': // backward compat
            result = await listSkills();
            break;
          case 'get_flow':
          case 'get_skill':
            result = await getSkill(args.name);
            break;
          case 'run_flow':
          case 'run_skill':
            result = await runSkill(args.name);
            break;
          case 'search_flows':
          case 'search_skills':
            result = await searchSkills(args.query);
            break;
          default:
            responseBody = jsonrpcError(id, -32601, `Unknown tool: ${toolName}`);
            break;
        }

        if (!responseBody) {
          responseBody = jsonrpc(id, {
            content: [{
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            }],
          });
        }
        break;
      }

      default:
        responseBody = jsonrpcError(id, -32601, `Method not found: ${method}`);
    }

    const jsonStr = JSON.stringify(responseBody);

    // If client wants SSE, wrap in SSE format
    if (wantsSSE) {
      const sseData = `event: message\ndata: ${jsonStr}\n\n`;
      return new Response(sseData, {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Mcp-Session-Id': 'flowfabric-stateless',
        },
      });
    }

    // Standard JSON response
    return new Response(jsonStr, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Mcp-Session-Id': 'flowfabric-stateless',
      },
    });
  } catch (err) {
    const errResponse = JSON.stringify(jsonrpcError(null, -32603, (err as Error).message));
    return new Response(errResponse, {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
