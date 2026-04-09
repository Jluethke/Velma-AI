/**
 * FlowFabric Remote MCP Server — Vercel Edge Function
 *
 * Streamable HTTP endpoint that exposes FlowFabric skills
 * via the Model Context Protocol (JSON-RPC 2.0 over HTTP).
 *
 * URL: https://flowfabric.io/api/mcp
 */

export const config = {
  runtime: 'edge',
};

const SITE_ORIGIN = 'https://flowfabric.io';
const GITHUB_RAW =
  'https://raw.githubusercontent.com/Jluethke/Velma-AI/main/marketplace';

// ---------------------------------------------------------------------------
// Helpers
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
  const res = await fetch(`${SITE_ORIGIN}/skill-catalog.json`);
  if (!res.ok) throw new Error(`Failed to load skill catalog: ${res.status}`);
  catalogCache = (await res.json()) as Skill[];
  return catalogCache;
}

async function loadSkillMd(name: string): Promise<string> {
  // Try the deployed site first, fall back to GitHub raw
  for (const base of [
    `${SITE_ORIGIN}/marketplace/${name}/skill.md`,
    `${GITHUB_RAW}/${name}/skill.md`,
  ]) {
    try {
      const res = await fetch(base);
      if (res.ok) return await res.text();
    } catch {
      // try next
    }
  }
  throw new Error(`Skill "${name}" not found`);
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
  if (!meta) throw new Error(`Skill "${name}" not found in catalog`);
  const content = await loadSkillMd(name);
  return { ...meta, content };
}

async function runSkill(name: string) {
  const content = await loadSkillMd(name);
  return {
    skill: name,
    instructions:
      'Follow the skill definition below phase-by-phase. Ask the user for any required inputs before starting each phase. Execute every phase in order.',
    content,
  };
}

async function searchSkills(query: string) {
  const catalog = await loadCatalog();
  const q = query.toLowerCase();
  const terms = q.split(/\s+/);
  const scored = catalog
    .map((s) => {
      const haystack =
        `${s.name} ${s.domain} ${s.tags.join(' ')} ${s.description}`.toLowerCase();
      const score = terms.reduce(
        (acc, t) => acc + (haystack.includes(t) ? 1 : 0),
        0,
      );
      return { skill: s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((x) => ({
      name: x.skill.name,
      domain: x.skill.domain,
      description: x.skill.description,
      score: x.score,
    }));
  return scored;
}

// ---------------------------------------------------------------------------
// MCP protocol definitions
// ---------------------------------------------------------------------------

const SERVER_INFO = {
  name: 'flowfabric',
  version: '1.0.0',
};

const CAPABILITIES = {
  tools: {},
};

const TOOLS = [
  {
    name: 'list_skills',
    description:
      'List all available FlowFabric skills with their domains and descriptions.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_skill',
    description:
      'Get the full skill definition (markdown) for a given skill name.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'The skill name (e.g. "budget-builder")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'run_skill',
    description:
      'Start interactive execution of a skill. Returns the full skill definition for the AI to follow phase-by-phase.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'The skill name to run',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_skills',
    description:
      'Search FlowFabric skills by keyword. Returns up to 20 matching skills ranked by relevance.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Search query — can be keywords, a domain, or a natural language description of what you need',
        },
      },
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

function jsonrpcError(
  id: string | number | null,
  code: number,
  message: string,
) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: Request) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // GET — basic info page / health check
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        name: 'FlowFabric MCP Server',
        version: '1.0.0',
        description:
          'Remote MCP server for FlowFabric AI skills. POST JSON-RPC 2.0 messages to this endpoint.',
        tools: TOOLS.map((t) => t.name),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await req.json();
    const { method, params, id } = body;

    switch (method) {
      // -- MCP handshake -------------------------------------------------------
      case 'initialize':
        return new Response(
          JSON.stringify(
            jsonrpc(id, {
              protocolVersion: '2024-11-05',
              serverInfo: SERVER_INFO,
              capabilities: CAPABILITIES,
            }),
          ),
          { status: 200, headers },
        );

      case 'notifications/initialized':
        // No response needed for notification
        return new Response(JSON.stringify(jsonrpc(id ?? null, {})), {
          status: 200,
          headers,
        });

      // -- Tool listing --------------------------------------------------------
      case 'tools/list':
        return new Response(
          JSON.stringify(jsonrpc(id, { tools: TOOLS })),
          { status: 200, headers },
        );

      // -- Tool execution ------------------------------------------------------
      case 'tools/call': {
        const toolName = params?.name;
        const args = params?.arguments ?? {};

        let result: unknown;

        switch (toolName) {
          case 'list_skills':
            result = await listSkills();
            break;
          case 'get_skill':
            result = await getSkill(args.name);
            break;
          case 'run_skill':
            result = await runSkill(args.name);
            break;
          case 'search_skills':
            result = await searchSkills(args.query);
            break;
          default:
            return new Response(
              JSON.stringify(
                jsonrpcError(id, -32601, `Unknown tool: ${toolName}`),
              ),
              { status: 200, headers },
            );
        }

        return new Response(
          JSON.stringify(
            jsonrpc(id, {
              content: [
                {
                  type: 'text',
                  text:
                    typeof result === 'string'
                      ? result
                      : JSON.stringify(result, null, 2),
                },
              ],
            }),
          ),
          { status: 200, headers },
        );
      }

      default:
        return new Response(
          JSON.stringify(
            jsonrpcError(id, -32601, `Method not found: ${method}`),
          ),
          { status: 200, headers },
        );
    }
  } catch (err) {
    return new Response(
      JSON.stringify(jsonrpcError(null, -32603, (err as Error).message)),
      { status: 200, headers },
    );
  }
}
