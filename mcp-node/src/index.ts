#!/usr/bin/env node
/**
 * SkillChain MCP Server (Node.js)
 * ================================
 * Zero-dependency MCP server for Claude Code.
 * Serves skills, chains, gamification, and Velma recommendations.
 *
 * Start with: node dist/index.js
 * Or: npx skillchain-mcp
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { SkillStateStore, type SkillRun } from "./skill-state.js";
import { ChainMatcher } from "./chain-matcher.js";
import { GamificationEngine } from "./gamification.js";
import { ProfileManager } from "./user-profile.js";
import { VelmaRecommender } from "./velma-recommender.js";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SKILLS_DIR_CLAUDE = join(homedir(), ".claude", "skills");
const SKILLS_DIR_SC = join(homedir(), ".skillchain", "skills");

// Marketplace can be: bundled with the package, or in ~/.skillchain/marketplace
function findMarketplace(): string {
  // 1. ~/.skillchain/marketplace (installed)
  const installed = join(homedir(), ".skillchain", "marketplace");
  if (existsSync(installed)) return installed;
  // 2. Bundled with the package (relative to dist/)
  const bundled = join(__dirname, "..", "marketplace");
  if (existsSync(bundled)) return bundled;
  // 3. Dev: relative to SkillChain repo
  const dev = join(__dirname, "..", "..", "marketplace");
  if (existsSync(dev)) return dev;
  return installed; // fallback, may not exist
}

const MARKETPLACE_DIR = findMarketplace();
const CHAINS_DIR = join(MARKETPLACE_DIR, "chains");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function installedSkills(): Map<string, string> {
  const skills = new Map<string, string>(); // name -> path
  for (const dir of [SKILLS_DIR_CLAUDE, SKILLS_DIR_SC]) {
    if (existsSync(dir)) {
      for (const f of readdirSync(dir)) {
        if (f.endsWith(".md")) skills.set(f.replace(/\.md$/, ""), join(dir, f));
      }
    }
  }
  if (existsSync(MARKETPLACE_DIR)) {
    for (const d of readdirSync(MARKETPLACE_DIR)) {
      const skillMd = join(MARKETPLACE_DIR, d, "skill.md");
      if (existsSync(skillMd)) skills.set(d, skillMd);
    }
  }
  return skills;
}

function loadManifest(skillName: string): Record<string, unknown> {
  const mkt = join(MARKETPLACE_DIR, skillName, "manifest.json");
  if (existsSync(mkt)) {
    try { return JSON.parse(readFileSync(mkt, "utf-8")); } catch { /* */ }
  }
  return { name: skillName };
}

function availableChains(): Array<Record<string, unknown>> {
  if (!existsSync(CHAINS_DIR)) return [];
  return readdirSync(CHAINS_DIR)
    .filter(f => f.endsWith(".chain.json"))
    .sort()
    .map(f => {
      try { return JSON.parse(readFileSync(join(CHAINS_DIR, f), "utf-8")); }
      catch { return null; }
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// In-memory run tracking
// ---------------------------------------------------------------------------

const activeRuns = new Map<string, SkillRun>();

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "skillchain",
  version: "0.1.0",
});

const store = new SkillStateStore();
const profileMgr = new ProfileManager();

// ===================================================================
// TOOLS
// ===================================================================

server.tool("list_skills",
  "List all installed skills with their execution patterns and descriptions.",
  {},
  async () => {
    const skills = installedSkills();
    const results = [...skills.keys()].sort().map(name => {
      const manifest = loadManifest(name);
      return {
        name,
        domain: manifest.domain ?? "general",
        execution_pattern: manifest.execution_pattern ?? "",
        description: manifest.description ?? "",
        tags: manifest.tags ?? [],
      };
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool("get_skill",
  "Get the full content of an installed skill.",
  { skill_name: z.string().describe("Name of the skill to read") },
  async ({ skill_name }) => {
    const skills = installedSkills();
    const path = skills.get(skill_name);
    if (path && existsSync(path)) {
      return { content: [{ type: "text" as const, text: readFileSync(path, "utf-8") }] };
    }
    return { content: [{ type: "text" as const, text: `Skill '${skill_name}' not found. Use list_skills() to see available skills.` }] };
  }
);

server.tool("start_skill_run",
  "Start a tracked execution of a skill. Returns a run_id for tracking phases.",
  {
    skill_name: z.string().describe("Name of the skill to run"),
    execution_pattern: z.string().default("orpa").describe("Execution pattern (orpa, phase_pipeline, etc.)"),
  },
  async ({ skill_name, execution_pattern }) => {
    const run = store.startRun(skill_name, execution_pattern);
    const runId = randomUUID().slice(0, 16);
    activeRuns.set(runId, run);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      run_id: runId, skill_name, execution_pattern, started_at: run.started_at, status: "in_progress",
    }, null, 2) }] };
  }
);

server.tool("record_phase",
  "Record completion of a skill phase. Called after each execution phase.",
  {
    run_id: z.string().describe("The run ID returned by start_skill_run"),
    phase: z.string().describe("Phase name (e.g. observe, reflect, plan, act)"),
    status: z.string().describe("Phase status (completed, failed, skipped)"),
    output: z.string().default("{}").describe("JSON string of phase output data"),
  },
  async ({ run_id, phase, status, output }) => {
    const run = activeRuns.get(run_id);
    if (!run) return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Run '${run_id}' not found.` }) }] };
    let outputData: Record<string, unknown>;
    try { outputData = JSON.parse(output); } catch { outputData = { raw: output }; }
    const result = store.recordPhase(run, phase, status, outputData);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      run_id, phase, status, timestamp: result.timestamp, total_phases: run.phases.length,
    }, null, 2) }] };
  }
);

server.tool("complete_skill_run",
  "Mark a skill run as complete. Archives to history.",
  {
    run_id: z.string().describe("The run ID to complete"),
    status: z.string().default("completed").describe("Final status"),
  },
  async ({ run_id, status }) => {
    const run = activeRuns.get(run_id);
    if (!run) return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Run '${run_id}' not found.` }) }] };
    store.completeRun(run, status);
    try { profileMgr.updateUsage(run.skill_name); } catch { /* */ }
    try {
      const gam = new GamificationEngine();
      gam.recordSkillRun(run.skill_name);
    } catch { /* */ }
    activeRuns.delete(run_id);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      run_id, skill_name: run.skill_name, status, completed_at: run.completed_at, phases_completed: run.phases.length,
    }, null, 2) }] };
  }
);

server.tool("save_skill_data",
  "Save persistent data for a skill (survives between runs).",
  {
    skill_name: z.string(), key: z.string(), data: z.string().default("{}"),
  },
  async ({ skill_name, key, data }) => {
    let dataObj: unknown;
    try { dataObj = JSON.parse(data); } catch { dataObj = { raw: data }; }
    store.saveData(skill_name, key, dataObj);
    return { content: [{ type: "text" as const, text: JSON.stringify({ skill_name, key, saved: true }) }] };
  }
);

server.tool("load_skill_data",
  "Load persistent data from a previous skill run.",
  { skill_name: z.string(), key: z.string() },
  async ({ skill_name, key }) => {
    const result = store.loadData(skill_name, key);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      skill_name, key, found: result !== null, data: result,
    }, null, 2) }] };
  }
);

server.tool("get_skill_history",
  "Get recent execution history for a skill.",
  { skill_name: z.string(), limit: z.number().default(5) },
  async ({ skill_name, limit }) => {
    const history = store.getRunHistory(skill_name, limit);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      skill_name, runs: history, count: history.length,
    }, null, 2) }] };
  }
);

server.tool("discover_skills",
  "Search for skills in the marketplace by domain.",
  { domain: z.string().default(""), max_results: z.number().default(10) },
  async ({ domain, max_results }) => {
    const skills = installedSkills();
    const results: Array<Record<string, unknown>> = [];
    for (const name of [...skills.keys()].sort()) {
      const manifest = loadManifest(name);
      const skillDomain = (manifest.domain as string) ?? "general";
      if (domain) {
        const dl = domain.toLowerCase();
        const tags = ((manifest.tags as string[]) ?? []).map(t => t.toLowerCase());
        if (!skillDomain.toLowerCase().includes(dl) && !name.toLowerCase().includes(dl) && !tags.some(t => t.includes(dl))) {
          continue;
        }
      }
      results.push({ name, domain: skillDomain, description: manifest.description ?? "", tags: manifest.tags ?? [], execution_pattern: manifest.execution_pattern ?? "" });
      if (results.length >= max_results) break;
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool("list_chains",
  "List all available pre-built skill chains.",
  {},
  async () => {
    const chains = availableChains();
    const summaries = chains.map(c => ({
      name: c.name ?? "",
      description: c.description ?? "",
      category: c.category ?? "",
      steps: ((c.steps as unknown[]) ?? []).length,
      skills: ((c.steps as Array<Record<string, string>>) ?? []).map(s => s.skill_name),
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(summaries, null, 2) }] };
  }
);

server.tool("search_chains",
  "Search for skill chains using plain English. Describe what you need and get ranked matches.",
  {
    query: z.string().describe("What you're looking for (e.g., 'I hate my job', 'help me budget')"),
    max_results: z.number().default(5),
  },
  async ({ query, max_results }) => {
    const chains = availableChains();
    const matcher = new ChainMatcher(chains as Array<{ name: string; description?: string; category?: string; steps?: Array<{ skill_name: string; alias?: string }> }>);
    const matches = matcher.match(query, max_results);
    return { content: [{ type: "text" as const, text: JSON.stringify(matches, null, 2) }] };
  }
);

server.tool("find_and_run",
  "Find the best skill chain for what you need. This is the main entry point for SkillChain. Describe what you want in plain English.",
  {
    query: z.string().describe("Plain English description (e.g., 'I need help budgeting', 'prepare me for an interview')"),
    auto_run: z.boolean().default(false).describe("If true, automatically execute the best match"),
    initial_context: z.string().default("{}").describe("JSON context data for the chain"),
  },
  async ({ query, auto_run, initial_context }) => {
    const chains = availableChains();
    const matcher = new ChainMatcher(chains as Array<{ name: string; description?: string; category?: string; steps?: Array<{ skill_name: string; alias?: string }> }>);
    const matches = matcher.match(query, 5);

    if (matches.length === 0) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: "No chains match your query.", query }) }] };
    }

    const best = matches[0];
    const resultData: Record<string, unknown> = {
      query,
      best_match: best,
      other_matches: matches.slice(1),
    };

    if (auto_run) {
      // Find chain and execute (simplified — returns steps for Claude to execute)
      const chainData = chains.find(c => (c as Record<string, unknown>).name === best.chain_name);
      if (chainData) {
        const steps = ((chainData as Record<string, unknown>).steps as Array<Record<string, string>>) ?? [];
        let ctx: Record<string, unknown>;
        try { ctx = JSON.parse(initial_context); } catch { ctx = {}; }
        resultData.execution = {
          chain_name: best.chain_name,
          status: "ready",
          steps: steps.map(s => ({
            skill_name: s.skill_name,
            alias: s.alias ?? s.skill_name,
          })),
          initial_context: ctx,
          instructions: "Execute each skill step in order using start_skill_run, get_skill, record_phase, and complete_skill_run.",
        };

        // Track
        try { profileMgr.updateChainUsage(best.chain_name); } catch { /* */ }
        try {
          const gam = new GamificationEngine();
          gam.recordChainRun(best.chain_name, steps.length, 0);
        } catch { /* */ }
      }
    }

    return { content: [{ type: "text" as const, text: JSON.stringify(resultData, null, 2) }] };
  }
);

server.tool("run_chain",
  "Execute a skill chain by name. Returns the chain steps for execution.",
  {
    chain_name: z.string().describe("Name of the chain to run"),
    initial_context: z.string().default("{}").describe("JSON context data"),
  },
  async ({ chain_name, initial_context }) => {
    const chains = availableChains();
    const chainData = chains.find(c => (c as Record<string, unknown>).name === chain_name);
    if (!chainData) return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Chain '${chain_name}' not found.` }) }] };

    let ctx: Record<string, unknown>;
    try { ctx = JSON.parse(initial_context); } catch { ctx = {}; }

    const steps = ((chainData as Record<string, unknown>).steps as Array<Record<string, string>>) ?? [];
    const result = {
      chain_name,
      status: "ready",
      steps: steps.map(s => ({
        skill_name: s.skill_name,
        alias: s.alias ?? s.skill_name,
        depends_on: (s as Record<string, unknown>).depends_on ?? [],
      })),
      initial_context: ctx,
      instructions: "Execute each skill step using: get_skill → start_skill_run → record_phase (per phase) → complete_skill_run. Pass outputs between dependent steps.",
    };

    try { profileMgr.updateChainUsage(chain_name); } catch { /* */ }
    try {
      const gam = new GamificationEngine();
      gam.recordChainRun(chain_name, steps.length, 0);
    } catch { /* */ }

    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ===================================================================
// GAMIFICATION TOOLS
// ===================================================================

server.tool("get_trainer_profile",
  "Get your trainer card — level, XP, streak, collection progress.",
  {},
  async () => {
    const gam = new GamificationEngine();
    return { content: [{ type: "text" as const, text: JSON.stringify(gam.getTrainerCard(), null, 2) }] };
  }
);

server.tool("get_achievements",
  "List all 30 achievements with locked/unlocked status.",
  {},
  async () => {
    const gam = new GamificationEngine();
    return { content: [{ type: "text" as const, text: JSON.stringify(gam.getAchievements(), null, 2) }] };
  }
);

server.tool("get_skilldex",
  "Show your skill collection progress by category. Like a Pokedex but for AI skills.",
  {},
  async () => {
    const gam = new GamificationEngine();
    return { content: [{ type: "text" as const, text: JSON.stringify(gam.getSkilldex(), null, 2) }] };
  }
);

server.tool("get_daily_quests",
  "Get today's 3 daily quests with completion status.",
  {},
  async () => {
    const gam = new GamificationEngine();
    return { content: [{ type: "text" as const, text: JSON.stringify(gam.getDailyQuests(), null, 2) }] };
  }
);

server.tool("what_now",
  "Ask Velma what you should do right now. Velma observes your state, history, streaks, time of day, and tells you the chain you need. No searching. Velma just knows.",
  {},
  async () => {
    const velma = new VelmaRecommender(MARKETPLACE_DIR);
    const recs = velma.whatNow();
    return { content: [{ type: "text" as const, text: JSON.stringify(recs, null, 2) }] };
  }
);

// ===================================================================
// PROFILE TOOLS
// ===================================================================

server.tool("get_profile",
  "Get the user's SkillChain profile (role, goals, tech stack, etc.).",
  {},
  async () => {
    const profile = profileMgr.load();
    return { content: [{ type: "text" as const, text: JSON.stringify(profile, null, 2) }] };
  }
);

server.tool("get_recommendations",
  "Get personalized skill and chain recommendations based on your profile.",
  {},
  async () => {
    const skills = [...installedSkills().keys()];
    const skillRecs = profileMgr.suggestSkills(skills);
    const chainRecs = profileMgr.suggestChains();
    return { content: [{ type: "text" as const, text: JSON.stringify({
      skill_recommendations: skillRecs.slice(0, 15),
      chain_recommendations: chainRecs,
    }, null, 2) }] };
  }
);

// ===================================================================
// HEALTH / META
// ===================================================================

server.tool("check_access",
  "Check if SkillChain MCP server is running and accessible. Returns server status and marketplace stats.",
  {},
  async () => {
    const skills = installedSkills();
    const chains = availableChains();
    return { content: [{ type: "text" as const, text: JSON.stringify({
      status: "ok",
      server: "skillchain-mcp",
      version: "0.1.0",
      runtime: "node",
      skills_available: skills.size,
      chains_available: chains.length,
      marketplace_dir: MARKETPLACE_DIR,
      marketplace_exists: existsSync(MARKETPLACE_DIR),
    }, null, 2) }] };
  }
);

// ===================================================================
// START
// ===================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error("SkillChain MCP server failed to start:", err);
  process.exit(1);
});
