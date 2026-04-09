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
import { buildManifestIndex } from "./manifest-index.js";
import { ChainComposer } from "./chain-composer.js";
import { MemoryStore } from "./memory-store.js";
import { extractFacts } from "./fact-extractor.js";
import { KnowledgeGraph } from "./knowledge-graph.js";
import { CommunityRegistry } from "./community-registry.js";
import { TriggerEngine, type TriggerEvent } from "./trigger-engine.js";
import { SkillEvolution } from "./skill-evolution.js";

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
const memory = new MemoryStore();
const kg = new KnowledgeGraph();
const community = new CommunityRegistry(MARKETPLACE_DIR);
const evolution = new SkillEvolution(MARKETPLACE_DIR);

// Trigger engine: log events but don't auto-execute chains
// (chain execution requires Claude Code context)
const triggerLog: TriggerEvent[] = [];
const triggers = new TriggerEngine((event) => {
  triggerLog.push(event);
  // Keep last 50 events in memory
  if (triggerLog.length > 50) triggerLog.splice(0, triggerLog.length - 50);
});

// Sync L0 identity from profile on startup
try {
  const profile = profileMgr.load();
  memory.syncFromProfile(profile);
} catch { /* profile may not exist yet */ }

// ===================================================================
// TOOLS
// ===================================================================

server.tool("list_flows",
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

server.tool("get_flow",
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

server.tool("start_flow_run",
  "Start a tracked execution of a skill. Returns a run_id for tracking phases.",
  {
    skill_name: z.string().describe("Name of the skill to run"),
    execution_pattern: z.string().default("orpa").describe("Execution pattern (orpa, phase_pipeline, etc.)"),
  },
  async ({ skill_name, execution_pattern }) => {
    const run = store.startRun(skill_name, execution_pattern);
    const runId = randomUUID().slice(0, 16);
    activeRuns.set(runId, run);

    // Auto-load L2 room context and L0+L1 context
    let memoryContext: Record<string, unknown> = {};
    try {
      const ctx = memory.getContext();
      const room = memory.getSkillRoom(skill_name);
      memoryContext = {
        identity_summary: ctx.identity.summary || undefined,
        relevant_facts: ctx.facts.slice(0, 5).map(f => f.content),
        skill_room: room.run_summaries.length > 0 ? {
          previous_runs: room.run_summaries.length,
          last_run: room.run_summaries[room.run_summaries.length - 1]?.date,
          recent_insights: room.insights.slice(0, 3).map(i => i.content),
        } : undefined,
      };
    } catch { /* memory not initialized yet */ }

    return { content: [{ type: "text" as const, text: JSON.stringify({
      run_id: runId, skill_name, execution_pattern, started_at: run.started_at, status: "in_progress",
      memory_context: memoryContext,
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

server.tool("complete_flow_run",
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

    // Memory: extract facts from phase outputs and store to L1/L2
    let factsExtracted = 0;
    try {
      const keyOutputs: string[] = [];
      for (const phase of run.phases) {
        if (phase.output && Object.keys(phase.output).length > 0) {
          const facts = extractFacts(phase.output, run.skill_name);
          for (const fact of facts) {
            if (fact.importance >= 0.7) {
              memory.rememberFact(fact.content, fact.tags, run.skill_name, fact.importance);
            } else {
              memory.addInsight(run.skill_name, fact.content, fact.tags, fact.importance);
            }
            factsExtracted++;
          }
          // Collect key outputs for run summary
          const outputKeys = Object.keys(phase.output).filter(
            k => typeof phase.output[k] === "string" && (phase.output[k] as string).length > 10
          );
          keyOutputs.push(...outputKeys.slice(0, 2));
        }
      }
      // Record run summary to L2 room
      memory.recordRunToRoom(run.skill_name, run_id, run.phases.length, keyOutputs);

      // Extract knowledge graph triples from phase outputs
      for (const phase of run.phases) {
        if (phase.output && Object.keys(phase.output).length > 0) {
          try { await kg.extractFromOutput(phase.output, run.skill_name, run_id); } catch { /* */ }
        }
      }
    } catch { /* memory extraction is best-effort */ }

    activeRuns.delete(run_id);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      run_id, skill_name: run.skill_name, status, completed_at: run.completed_at,
      phases_completed: run.phases.length, facts_extracted: factsExtracted,
    }, null, 2) }] };
  }
);

server.tool("save_flow_data",
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

server.tool("load_flow_data",
  "Load persistent data from a previous skill run.",
  { skill_name: z.string(), key: z.string() },
  async ({ skill_name, key }) => {
    const result = store.loadData(skill_name, key);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      skill_name, key, found: result !== null, data: result,
    }, null, 2) }] };
  }
);

server.tool("get_flow_history",
  "Get recent execution history for a skill.",
  { skill_name: z.string(), limit: z.number().default(5) },
  async ({ skill_name, limit }) => {
    const history = store.getRunHistory(skill_name, limit);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      skill_name, runs: history, count: history.length,
    }, null, 2) }] };
  }
);

server.tool("discover_flows",
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
// DYNAMIC CHAIN COMPOSITION TOOLS (Phase 1 — Patent CIP)
// ===================================================================

server.tool("compose_chain",
  "Dynamically compose a skill chain from natural language. Uses input/output matching across the skill registry with trust-weighted scoring. Falls back to curated chains if confidence is low.",
  {
    query: z.string().describe("What you want to accomplish (e.g., 'validate my startup idea and build a pitch deck')"),
    max_skills: z.number().default(5).describe("Maximum number of skills to compose"),
    min_confidence: z.number().default(0.4).describe("Minimum confidence threshold (0-1). Below this, falls back to curated chains."),
  },
  async ({ query, max_skills, min_confidence }) => {
    const manifestIdx = buildManifestIndex(MARKETPLACE_DIR);
    const composer = new ChainComposer(manifestIdx);
    const chains = availableChains() as Array<{ name: string; description?: string; category?: string; steps?: Array<{ skill_name: string; alias?: string }> }>;
    const result = composer.compose(query, max_skills, min_confidence, chains);

    // Track composition in gamification
    if (result.type === "composed" && result.steps.length > 0) {
      try {
        const gam = new GamificationEngine();
        gam.recordComposition(result.chain_name, result.steps.length);
      } catch { /* */ }
    }

    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("explain_composition",
  "Explain why specific skills would be chosen for a dynamic composition. Useful for understanding the composition engine's reasoning.",
  {
    query: z.string().describe("The query to explain composition for"),
    max_skills: z.number().default(5),
  },
  async ({ query, max_skills }) => {
    const manifestIdx = buildManifestIndex(MARKETPLACE_DIR);
    const composer = new ChainComposer(manifestIdx);
    const result = composer.explain(query, max_skills);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ===================================================================
// MEMORY TOOLS (Phase 2 — Tiered Memory System)
// ===================================================================

server.tool("recall",
  "Search your memory across all tiers (L1 critical facts, L2 skill rooms, L3 semantic index). Returns relevant memories ranked by relevance.",
  {
    query: z.string().describe("What to search for in memory"),
    max_results: z.number().default(10),
    skill_filter: z.string().optional().describe("Optional: limit search to a specific skill's room"),
  },
  async ({ query, max_results, skill_filter }) => {
    const results = memory.recall(query, max_results, skill_filter);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      query,
      results_count: results.length,
      results: results.map(r => ({
        content: r.memory.content,
        tier: r.tier,
        relevance: Math.round(r.relevance * 100) / 100,
        tags: r.memory.tags,
        source_skill: r.memory.source_skill,
        timestamp: r.memory.timestamp,
      })),
    }, null, 2) }] };
  }
);

server.tool("remember",
  "Explicitly store a fact or insight in memory. High-importance facts go to L1 (always loaded), lower importance to L2 skill rooms or L3 semantic index.",
  {
    content: z.string().describe("The fact or insight to remember"),
    tags: z.array(z.string()).default([]).describe("Tags for categorization"),
    skill_name: z.string().default("general").describe("Which skill this relates to"),
    importance: z.number().default(0.7).describe("Importance (0-1). >=0.7 goes to L1, <0.7 to L2/L3"),
    tier: z.enum(["L1", "L2", "L3"]).default("L1").describe("Which memory tier to store in"),
  },
  async ({ content, tags, skill_name, importance, tier }) => {
    let entry;
    if (tier === "L1") {
      entry = memory.rememberFact(content, tags, skill_name, importance);
    } else if (tier === "L2") {
      entry = memory.addInsight(skill_name, content, tags, importance);
    } else {
      entry = memory.storeSemanticMemory(content, tags, skill_name, importance);
    }
    return { content: [{ type: "text" as const, text: JSON.stringify({
      stored: true, tier, memory_id: entry.memory_id, importance: entry.importance,
    }, null, 2) }] };
  }
);

server.tool("get_context",
  "Get the always-loaded memory context (L0 identity + L1 critical facts). This is what the system knows about you across all sessions.",
  {},
  async () => {
    const ctx = memory.getContext();
    return { content: [{ type: "text" as const, text: JSON.stringify({
      identity: ctx.identity,
      critical_facts: ctx.facts.map(f => ({
        content: f.content,
        importance: f.importance,
        tags: f.tags,
        source: f.source_skill,
      })),
      facts_count: ctx.facts.length,
    }, null, 2) }] };
  }
);

// ===================================================================
// KNOWLEDGE GRAPH TOOLS (Phase 3 — Patent CIP)
// ===================================================================

server.tool("kg_query",
  "Query the temporal knowledge graph. Supports point-in-time queries and filtering by subject, predicate, or object.",
  {
    subject: z.string().optional().describe("Filter by subject entity"),
    predicate: z.string().optional().describe("Filter by relationship type (caused, supports, contradicts, preceded, enables, produces, consumes, related_to, derived_from)"),
    object: z.string().optional().describe("Filter by object entity"),
    at_time: z.string().optional().describe("ISO 8601 timestamp for point-in-time query. Omit for current facts only."),
    max_results: z.number().default(20),
  },
  async ({ subject, predicate, object, at_time, max_results }) => {
    const result = kg.query(subject, predicate, object, at_time, max_results);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      ...result,
      stats: kg.getStats(),
    }, null, 2) }] };
  }
);

server.tool("kg_assert",
  "Assert a new knowledge triple in the temporal knowledge graph. Trust-weighted via on-chain validation. Automatically detects contradictions and manages validity windows.",
  {
    subject: z.string().describe("The subject entity (e.g., 'user_budget', 'career_goal')"),
    predicate: z.enum(["caused", "supports", "contradicts", "preceded", "enables", "produces", "consumes", "related_to", "derived_from"]).describe("Relationship type"),
    object: z.string().describe("The object entity (e.g., '$3200/month', 'software_engineer')"),
    source_skill: z.string().default("manual").describe("Which skill produced this knowledge"),
    source_run_id: z.string().default("manual").describe("Which run produced this knowledge"),
    confidence: z.number().default(0.7).describe("Base confidence (0-1), will be multiplied by trust score"),
  },
  async ({ subject, predicate, object, source_skill, source_run_id, confidence }) => {
    const result = await kg.assert(subject, predicate, object, source_skill, source_run_id, confidence);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      asserted: true,
      triple: {
        id: result.triple.triple_id,
        subject: result.triple.subject,
        predicate: result.triple.predicate,
        object: result.triple.object,
        confidence: Math.round(result.triple.confidence * 100) / 100,
        trust_score: Math.round(result.triple.trust_score * 100) / 100,
      },
      contradictions_resolved: result.contradictions.length,
      contradicted_facts: result.contradictions.map(c => ({
        id: c.triple_id,
        object: c.object,
        was_valid_from: c.valid_from,
        invalidated_at: c.valid_until,
      })),
    }, null, 2) }] };
  }
);

server.tool("kg_history",
  "Show how facts about an entity changed over time. Reveals contradictions, superseded facts, and temporal evolution.",
  {
    entity: z.string().describe("The entity to trace history for"),
    max_results: z.number().default(20),
  },
  async ({ entity, max_results }) => {
    const result = kg.history(entity, max_results);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      entity: result.entity,
      total_events: result.history.length,
      timeline: result.history.map(h => ({
        triple_id: h.triple.triple_id,
        subject: h.triple.subject,
        predicate: h.triple.predicate,
        object: h.triple.object,
        status: h.status,
        valid_from: h.triple.valid_from,
        valid_until: h.triple.valid_until,
        confidence: Math.round(h.triple.confidence * 100) / 100,
        source_skill: h.triple.source_skill,
      })),
    }, null, 2) }] };
  }
);

server.tool("kg_validate",
  "Validate a knowledge triple against on-chain trust data. Returns the trust score, validation consensus, and recalculated confidence.",
  {
    triple_id: z.string().describe("The triple ID to validate"),
  },
  async ({ triple_id }) => {
    const result = await kg.validate(triple_id);
    if (!result) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Triple '${triple_id}' not found.` }) }] };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ===================================================================
// SKILL EVOLUTION TOOLS
// ===================================================================

server.tool("get_evolution_status",
  "Check a skill's evolution stage: prompt -> skill -> validated -> graduated -> compiled.",
  { skill_name: z.string().describe("Name of the skill to check") },
  async ({ skill_name }) => {
    const status = await evolution.getEvolutionStatus(skill_name);
    return { content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }] };
  }
);

server.tool("check_graduation",
  "Evaluate if a skill qualifies for graduation (100+ validations at 95%+ similarity).",
  { skill_name: z.string().describe("Name of the skill to evaluate") },
  async ({ skill_name }) => {
    const result = await evolution.checkGraduation(skill_name);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("list_evolutions",
  "Show all skills with their current evolution stages.",
  {},
  async () => {
    const results = await evolution.listEvolutions();
    return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
  }
);

// ===================================================================
// COMMUNITY REGISTRY TOOLS (Phase 4)
// ===================================================================

server.tool("submit_flow",
  "Submit a community skill for review. Validates format and stages for community validation.",
  {
    skill_name: z.string().describe("Name for the skill (lowercase, hyphens, 3-50 chars)"),
    skill_md: z.string().describe("Full skill.md content"),
    manifest: z.string().default("{}").describe("JSON string of manifest metadata (name, domain, description, tags, inputs, outputs)"),
    author: z.string().describe("Author name or identifier"),
    author_address: z.string().optional().describe("Author's wallet address for on-chain registration"),
  },
  async ({ skill_name, skill_md, manifest, author, author_address }) => {
    let manifestObj: Record<string, unknown>;
    try { manifestObj = JSON.parse(manifest); } catch { manifestObj = { name: skill_name }; }
    const result = community.submitSkill(skill_name, skill_md, manifestObj, author, author_address);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("list_community_flows",
  "Browse community skill submissions. Filter by status: pending, validating, approved, rejected, published.",
  {
    status: z.enum(["pending", "validating", "approved", "rejected", "published"]).optional().describe("Filter by submission status"),
    limit: z.number().default(20),
  },
  async ({ status, limit }) => {
    const results = community.listSubmissions(status, limit);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      count: results.length,
      submissions: results,
    }, null, 2) }] };
  }
);

server.tool("validate_flow",
  "Cast a trust-weighted validation vote on a community skill submission. Your trust score is recorded with your vote.",
  {
    submission_id: z.string().describe("The submission ID to vote on"),
    voter: z.string().describe("Your identifier (name or address)"),
    vote: z.enum(["approve", "reject"]).describe("Your vote"),
    reason: z.string().describe("Why you're approving or rejecting"),
  },
  async ({ submission_id, voter, vote, reason }) => {
    const result = await community.validateSkill(submission_id, voter, vote, reason);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ===================================================================
// TRIGGER TOOLS (Phase 6 — Event-Triggered Chains)
// ===================================================================

server.tool("create_trigger",
  "Create an event trigger that fires a chain on a schedule, webhook, or connector event.",
  {
    name: z.string().describe("Human-readable trigger name"),
    type: z.enum(["cron", "webhook", "connector"]).describe("Trigger type"),
    pattern: z.string().describe("Cron expression (e.g., '0 9 * * 1' for Monday 9am), webhook path, or connector event pattern"),
    chain_name: z.string().describe("Chain to execute when triggered"),
    config: z.string().default("{}").describe("JSON context data to pass to the chain"),
  },
  async ({ name, type, pattern, chain_name, config }) => {
    let configObj: Record<string, unknown>;
    try { configObj = JSON.parse(config); } catch { configObj = {}; }
    try {
      const trigger = triggers.createTrigger(name, type, pattern, chain_name, configObj);
      const result: Record<string, unknown> = {
        created: true,
        trigger_id: trigger.id,
        name: trigger.name,
        type: trigger.type,
        pattern: trigger.pattern,
        chain_name: trigger.chain_name,
        enabled: trigger.enabled,
      };
      if (trigger.webhook_secret) {
        result.webhook_url = `http://localhost:3180/trigger/${trigger.id}?secret=${trigger.webhook_secret}`;
        result.webhook_secret = trigger.webhook_secret;
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: (e as Error).message }) }] };
    }
  }
);

server.tool("list_triggers",
  "List all event triggers with their status and fire counts.",
  {
    type_filter: z.enum(["cron", "webhook", "connector"]).optional().describe("Filter by trigger type"),
  },
  async ({ type_filter }) => {
    const list = triggers.listTriggers(type_filter);
    const pending = triggerLog.filter(e => !e.payload._handled);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      triggers: list.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        pattern: t.pattern,
        chain_name: t.chain_name,
        enabled: t.enabled,
        fire_count: t.fire_count,
        last_fired_at: t.last_fired_at,
      })),
      pending_events: pending.length,
      total_triggers: list.length,
    }, null, 2) }] };
  }
);

server.tool("delete_trigger",
  "Delete an event trigger by ID.",
  {
    trigger_id: z.string().describe("The trigger ID to delete"),
  },
  async ({ trigger_id }) => {
    const deleted = triggers.deleteTrigger(trigger_id);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      deleted,
      trigger_id,
    }, null, 2) }] };
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

server.tool("get_flowdex",
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

// Keep the process alive — don't exit on stdin EOF or uncaught errors
process.stdin.on("end", () => { /* stdin closed, stay alive */ });
process.on("uncaughtException", (err) => {
  console.error("SkillChain uncaught:", (err as Error).message);
});
process.on("unhandledRejection", (err) => {
  console.error("SkillChain unhandled:", err);
});

main().catch(err => {
  console.error("SkillChain MCP server failed to start:", err);
  process.exit(1);
});
