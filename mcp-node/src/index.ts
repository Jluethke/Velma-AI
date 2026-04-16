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
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { spawn } from "child_process";
import {
  createWalletClient,
  createPublicClient,
  http,
  keccak256,
  toHex,
  parseAbi,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// On-chain: Marketplace contract
// ---------------------------------------------------------------------------

const MARKETPLACE_ADDRESS = "0x679B5CD7C2CdF504768cf31163aB6dFB4bF3fd48" as Address;
const MARKETPLACE_ABI = parseAbi([
  "function recordUsage(address user, bytes32 skillId) external",
  "function checkAccess(address user, bytes32 skillId) external view returns (bool canAccess, bool isPremium, bool isPurchased, uint256 dailyRemaining)",
]);

/**
 * Derive a bytes32 skillId from a flow name, matching keccak256(abi.encodePacked(flowName)).
 * We use keccak256(toHex(flowName)) which produces the same bytes when the string is UTF-8 encoded.
 */
function flowNameToSkillId(flowName: string): `0x${string}` {
  return keccak256(toHex(flowName));
}

/**
 * Record on-chain usage for a free flow execution.
 * Silently skips if RECORDER_PRIVATE_KEY is not configured or userAddress is unknown.
 */
async function recordFlowUsage(userAddress: string | undefined, flowName: string): Promise<void> {
  try {
    const privateKey = process.env.RECORDER_PRIVATE_KEY;
    if (!privateKey) return; // graceful degradation — not configured
    if (!userAddress) return; // no wallet address available for this user

    const rpcUrl = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(rpcUrl),
    });

    const skillId = flowNameToSkillId(flowName);

    await walletClient.writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "recordUsage",
      args: [userAddress as Address, skillId],
    });
  } catch {
    // Best-effort — never break flow execution due to on-chain recording failure
  }
}

import { GamificationEngine } from "./gamification.js";
import { VelmaRecommender } from "./velma-recommender.js";
import { VelmaCompanion } from "./velma-companion.js";
import { buildManifestIndex } from "./manifest-index.js";
import { ChainComposer } from "./chain-composer.js";
import { CommunityRegistry } from "./community-registry.js";
import { TriggerEngine, type TriggerEvent } from "./trigger-engine.js";
import { SkillEvolution } from "./skill-evolution.js";
import { SkillChainService } from "./service.js";

// ---------------------------------------------------------------------------
// Safe JSON parsing (prototype pollution guard)
// ---------------------------------------------------------------------------

function safeJsonParse(input: string): Record<string, unknown> {
  const parsed = JSON.parse(input, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
    return value;
  });
  return typeof parsed === 'object' && parsed !== null ? parsed : { raw: input };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------


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

// ---------------------------------------------------------------------------
// Service + Engine Instances
// ---------------------------------------------------------------------------

const svc = new SkillChainService({ marketplaceDir: MARKETPLACE_DIR });
const profileMgr = svc.getProfileMgr();
const memory = svc.getMemory();
const kg = svc.getKg();
const community = new CommunityRegistry(MARKETPLACE_DIR);
const evolution = new SkillEvolution(MARKETPLACE_DIR);

const triggerLog: TriggerEvent[] = [];
const triggers = new TriggerEngine((event) => {
  triggerLog.push(event);
  if (triggerLog.length > 50) triggerLog.splice(0, triggerLog.length - 50);
});

// Sync L0 identity from profile on startup
try {
  const profile = profileMgr.load();
  memory.syncFromProfile(profile);
} catch { /* profile may not exist yet */ }

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "flowfabric",
  version: "2.2.1",
});

// ===================================================================
// TOOLS
// ===================================================================

server.tool("list_skills",
  "List all available skills in the FlowFabric marketplace.",
  {},
  async () => {
    const results = svc.listSkills();
    return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool("get_flow",
  "Get the full content of an installed flow.",
  { flow_name: z.string().describe("Name of the flow to read") },
  async ({ flow_name }) => {
    const content = svc.getSkillContent(flow_name);
    if (content) {
      return { content: [{ type: "text" as const, text: content }] };
    }
    return { content: [{ type: "text" as const, text: `Flow '${flow_name}' not found. Use list_flows() to see available flows.` }] };
  }
);

server.tool("start_flow_run",
  "Start a tracked execution of a flow. Returns a run_id for tracking phases.",
  {
    flow_name: z.string().describe("Name of the flow to run"),
    execution_pattern: z.string().default("orpa").describe("Execution pattern (orpa, phase_pipeline, etc.)"),
  },
  async ({ flow_name, execution_pattern }) => {
    const result = svc.startRunWithMemory(flow_name, execution_pattern);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("record_phase",
  "Record completion of a flow phase. Called after each execution phase.",
  {
    run_id: z.string().describe("The run ID returned by start_flow_run"),
    phase: z.string().describe("Phase name (e.g. observe, reflect, plan, act)"),
    status: z.string().describe("Phase status (completed, failed, skipped)"),
    output: z.string().default("{}").describe("JSON string of phase output data"),
  },
  async ({ run_id, phase, status, output }) => {
    let outputData: Record<string, unknown>;
    try { outputData = safeJsonParse(output); } catch { outputData = { raw: output }; }
    const result = svc.recordPhase(run_id, phase, status, outputData);
    if (!result.success) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: result.error }) }] };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify({
      run_id, phase, status, timestamp: result.timestamp, total_phases: result.total_phases,
    }, null, 2) }] };
  }
);

server.tool("complete_flow_run",
  "Mark a flow run as complete. Archives to history.",
  {
    run_id: z.string().describe("The run ID to complete"),
    status: z.string().default("completed").describe("Final status"),
  },
  async ({ run_id, status }) => {
    const result = svc.completeRun(run_id, status);
    if (!result.success) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: result.error }) }] };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify({
      run_id, flow_name: result.flow_name, status, completed_at: result.completed_at,
      phases_completed: result.phases_completed, facts_extracted: result.facts_extracted,
    }, null, 2) }] };
  }
);

server.tool("save_flow_data",
  "Save persistent data for a flow (survives between runs).",
  {
    flow_name: z.string(), key: z.string(), data: z.string().default("{}"),
  },
  async ({ flow_name, key, data }) => {
    let dataObj: unknown;
    try { dataObj = safeJsonParse(data); } catch { dataObj = { raw: data }; }
    svc.saveData(flow_name, key, dataObj);
    return { content: [{ type: "text" as const, text: JSON.stringify({ flow_name, key, saved: true }) }] };
  }
);

server.tool("load_flow_data",
  "Load persistent data from a previous flow run.",
  { flow_name: z.string(), key: z.string() },
  async ({ flow_name, key }) => {
    const result = svc.loadData(flow_name, key);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      flow_name, key, found: result !== null, data: result,
    }, null, 2) }] };
  }
);

server.tool("get_flow_history",
  "Get recent execution history for a flow.",
  { flow_name: z.string(), limit: z.number().default(5) },
  async ({ flow_name, limit }) => {
    const history = svc.getRunHistory(flow_name, limit);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      flow_name, runs: history, count: (history as unknown[]).length,
    }, null, 2) }] };
  }
);

server.tool("discover_flows",
  "Search for flows in the marketplace by domain.",
  { domain: z.string().default(""), max_results: z.number().default(10) },
  async ({ domain, max_results }) => {
    const results = svc.discoverFlows(domain, max_results);
    return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool("list_flows",
  "List all available FlowFabric flows (multi-step pipelines).",
  {},
  async () => {
    const summaries = svc.listChains();
    return { content: [{ type: "text" as const, text: JSON.stringify(summaries, null, 2) }] };
  }
);

server.tool("search_flows",
  "Search for FlowFabric flows using plain English. Describe what you need and get ranked matches.",
  {
    query: z.string().describe("What you're looking for (e.g., 'I hate my job', 'help me budget')"),
    max_results: z.number().default(5),
  },
  async ({ query, max_results }) => {
    const matches = svc.searchFlows(query, max_results);
    return { content: [{ type: "text" as const, text: JSON.stringify(matches, null, 2) }] };
  }
);

server.tool("find_and_run",
  "Find the best flow chain for what you need. This is the main entry point for FlowFabric. Describe what you want in plain English.",
  {
    query: z.string().describe("Plain English description (e.g., 'I need help budgeting', 'prepare me for an interview')"),
    auto_run: z.boolean().default(false).describe("If true, automatically execute the best match"),
    initial_context: z.string().default("{}").describe("JSON context data for the chain"),
  },
  async ({ query, auto_run, initial_context }) => {
    const resultData = await svc.handleFindAndRun({ query, auto_run, initial_context });

    // Record on-chain usage if auto_run produced an execution
    if (auto_run && resultData.execution) {
      try {
        const best = resultData.best_match as Record<string, unknown>;
        const userAddress = profileMgr.load().wallet_address;
        await recordFlowUsage(userAddress, best.chain_name as string);
      } catch { /* */ }
    }

    return { content: [{ type: "text" as const, text: JSON.stringify(resultData, null, 2) }] };
  }
);

server.tool("run_flow",
  "Execute a FlowFabric flow by name. Returns the flow steps for execution.",
  {
    flow_name: z.string().describe("Name of the flow to run (e.g. 'job-search-blitz')"),
    initial_context: z.string().default("{}").describe("JSON context data"),
  },
  async ({ flow_name, initial_context }) => {
    const result = await svc.handleRunFlow({ flow_name, initial_context });

    // Record on-chain usage (kept in index.ts because it uses viem)
    if (!result.error) {
      try {
        const userAddress = profileMgr.load().wallet_address;
        await recordFlowUsage(userAddress, flow_name);
      } catch { /* */ }
    }

    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ===================================================================
// HUMAN-IN-THE-LOOP EXECUTION TOOLS
// ===================================================================

server.tool("preview_flow",
  "Preview what a flow pipeline will do before running it. Shows each step and expected output. ALWAYS call this first — show the user and get approval before executing.",
  {
    flow_name: z.string().default("").describe("Exact flow pipeline name to preview (e.g. 'job-search-blitz')"),
    query: z.string().default("").describe("Natural language query to find the best flow pipeline to preview. Used when flow_name is not provided."),
  },
  async ({ flow_name, query }) => {
    const result = svc.handlePreviewFlow({ flow_name, query });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("run_flow_step",
  "Execute a single step of a flow pipeline and show the output. Human-in-the-loop: run one flow, show output, get user approval, then call again with step_index + 1.",
  {
    flow_name: z.string().describe("Name of the flow pipeline (e.g. 'job-search-blitz')"),
    step_index: z.number().describe("Zero-based step index (0 = first step)"),
    context: z.string().default("{}").describe("JSON context from previous steps"),
  },
  async ({ flow_name, step_index, context }) => {
    const result = await svc.handleRunFlowStep({ flow_name, step_index, context });

    // Record on-chain usage when the chain completes (viem stays in index.ts)
    if (result.is_last_step) {
      try {
        const userAddress = profileMgr.load().wallet_address;
        await recordFlowUsage(userAddress, flow_name);
      } catch { /* */ }
    }

    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("analyze_directory",
  "Onboarding: learn about a user by analyzing their documents and files, then recommend personalized FlowFabric flows. Say: 'To learn more about you and recommend the right flows, share a folder or files you want me to analyze.' Reads documents, detects themes (finance, career, health, business, code), and surfaces the most relevant flows. Run this at the start of a new conversation to personalize the experience.",
  {
    directory: z.string().describe("Absolute path to the directory or folder to analyze (e.g. C:/Users/you/Documents or /Users/you/Desktop/work)"),
    max_files: z.number().default(50).describe("Maximum number of files to read (default: 50)"),
    max_depth: z.number().default(2).describe("How deep to scan subdirectories (default: 2)"),
    read_content: z.boolean().default(true).describe("Read text file contents for deeper analysis. False = filenames only (faster, less accurate)."),
  },
  async ({ directory, max_files, max_depth, read_content }) => {
    const result = svc.handleAnalyzeDirectory({ directory, max_files, max_depth, read_content });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ===================================================================
// DYNAMIC CHAIN COMPOSITION TOOLS (Phase 1 — Patent CIP)
// ===================================================================

server.tool("compose_flow",
  "Dynamically compose a multi-step FlowFabric flow from natural language. Uses input/output matching across the flow library with trust-weighted scoring. Falls back to curated flows if confidence is low.",
  {
    query: z.string().describe("What you want to accomplish (e.g., 'validate my startup idea and build a pitch deck')"),
    max_skills: z.number().default(5).describe("Maximum number of flow steps to compose"),
    min_confidence: z.number().default(0.4).describe("Minimum confidence threshold (0-1). Below this, falls back to curated flows."),
  },
  async ({ query, max_skills, min_confidence }) => {
    const result = svc.composeChain(query, max_skills, min_confidence);

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
  "Explain why specific flows would be chosen for a dynamic composition. Useful for understanding the composition engine's reasoning.",
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
  "Search your memory across all tiers (L1 critical facts, L2 flow rooms, L3 semantic index). Returns relevant memories ranked by relevance.",
  {
    query: z.string().describe("What to search for in memory"),
    max_results: z.number().default(10),
    flow_filter: z.string().optional().describe("Optional: limit search to a specific flow's room"),
  },
  async ({ query, max_results, flow_filter }) => {
    const results = memory.recall(query, max_results, flow_filter);
    return { content: [{ type: "text" as const, text: JSON.stringify({
      query,
      results_count: results.length,
      results: results.map(r => ({
        content: r.memory.content,
        tier: r.tier,
        relevance: Math.round(r.relevance * 100) / 100,
        tags: r.memory.tags,
        source_flow: r.memory.source_skill,
        timestamp: r.memory.timestamp,
      })),
    }, null, 2) }] };
  }
);

server.tool("remember",
  "Explicitly store a fact or insight in memory. High-importance facts go to L1 (always loaded), lower importance to L2 flow rooms or L3 semantic index.",
  {
    content: z.string().describe("The fact or insight to remember"),
    tags: z.array(z.string()).default([]).describe("Tags for categorization"),
    flow_name: z.string().default("general").describe("Which flow this relates to"),
    importance: z.number().default(0.7).describe("Importance (0-1). >=0.7 goes to L1, <0.7 to L2/L3"),
    tier: z.enum(["L1", "L2", "L3"]).default("L1").describe("Which memory tier to store in"),
  },
  async ({ content, tags, flow_name, importance, tier }) => {
    let entry;
    if (tier === "L1") {
      entry = memory.rememberFact(content, tags, flow_name, importance);
    } else if (tier === "L2") {
      entry = memory.addInsight(flow_name, content, tags, importance);
    } else {
      entry = memory.storeSemanticMemory(content, tags, flow_name, importance);
    }
    return { content: [{ type: "text" as const, text: JSON.stringify({
      stored: true, tier, memory_id: entry.memory_id, importance: entry.importance,
    }, null, 2) }] };
  }
);

server.tool("get_context",
  "Get the always-loaded memory context (L0 identity + L1 critical facts). This is what the system knows about you across all flow sessions.",
  {},
  async () => {
    const ctx = memory.getContext();
    return { content: [{ type: "text" as const, text: JSON.stringify({
      identity: ctx.identity,
      critical_facts: ctx.facts.map(f => ({
        content: f.content,
        importance: f.importance,
        tags: f.tags,
        source_flow: f.source_skill,
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
    source_flow: z.string().default("manual").describe("Which flow produced this knowledge"),
    source_run_id: z.string().default("manual").describe("Which run produced this knowledge"),
    confidence: z.number().default(0.7).describe("Base confidence (0-1), will be multiplied by trust score"),
  },
  async ({ subject, predicate, object, source_flow, source_run_id, confidence }) => {
    const result = await kg.assert(subject, predicate, object, source_flow, source_run_id, confidence);
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
        source_flow: h.triple.source_skill,
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
// FLOW EVOLUTION TOOLS
// ===================================================================

server.tool("get_evolution_status",
  "Check a flow's evolution stage: prompt -> flow -> validated -> graduated -> compiled.",
  { flow_name: z.string().describe("Name of the flow to check") },
  async ({ flow_name }) => {
    const status = await evolution.getEvolutionStatus(flow_name);
    return { content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }] };
  }
);

server.tool("check_graduation",
  "Evaluate if a flow qualifies for graduation (100+ validations at 95%+ similarity).",
  { flow_name: z.string().describe("Name of the flow to evaluate") },
  async ({ flow_name }) => {
    const result = await evolution.checkGraduation(flow_name);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("list_evolutions",
  "Show all flows with their current evolution stages.",
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
  "Submit a community flow for review. Validates format and stages for community validation.",
  {
    flow_name: z.string().describe("Name for the flow (lowercase, hyphens, 3-50 chars)"),
    skill_md: z.string().describe("Full skill.md content"),
    manifest: z.string().default("{}").describe("JSON string of manifest metadata (name, domain, description, tags, inputs, outputs)"),
    author: z.string().describe("Author name or identifier"),
    author_address: z.string().optional().describe("Author's wallet address for on-chain registration"),
  },
  async ({ flow_name, skill_md, manifest, author, author_address }) => {
    let manifestObj: Record<string, unknown>;
    try { manifestObj = safeJsonParse(manifest); } catch { manifestObj = { name: flow_name }; }
    const result = community.submitSkill(flow_name, skill_md, manifestObj, author, author_address);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("list_community_flows",
  "Browse community flow submissions. Filter by status: pending, validating, approved, rejected, published.",
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
  "Cast a trust-weighted validation vote on a community flow submission. Your trust score is recorded with your vote.",
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
    try { configObj = safeJsonParse(config); } catch { configObj = {}; }
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
// VELMA COMPANION TOOLS
// ===================================================================

server.tool("pet_velma",
  "Pet Velma. She's been watching. She deserves it.",
  {},
  async () => {
    const velma = new VelmaCompanion();
    const result = velma.pet();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("get_velma_status",
  "Check in on Velma — her mood, level, XP, what she's witnessed recently.",
  {},
  async () => {
    const velma = new VelmaCompanion();
    const status = velma.getStatus();
    return { content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }] };
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
  "Show your flow collection progress by category. Like a Pokedex but for AI flows.",
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
  "Ask FlowFabric what you should do right now. Reads your L0 identity (name, role, goals, top domains), your flow run history across all L2 flow rooms, and your knowledge graph (facts extracted from previous flow outputs) to give personalized next-step recommendations. No searching required — context is already loaded.",
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
  "Get the user's FlowFabric profile (role, goals, tech stack, etc.).",
  {},
  async () => {
    const profile = profileMgr.load();
    return { content: [{ type: "text" as const, text: JSON.stringify(profile, null, 2) }] };
  }
);

server.tool("get_recommendations",
  "Get personalized flow recommendations based on your profile.",
  {},
  async () => {
    const result = svc.getRecommendations();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ===================================================================
// ON-CHAIN ACCESS STATUS
// ===================================================================

server.tool("get_access_status",
  "Check on-chain access status for a user and flow. Returns canAccess, isPremium, isPurchased, and dailyRemaining from the Marketplace contract.",
  {
    user_address: z.string().describe("The user's EVM wallet address (0x...)"),
    flow_name: z.string().describe("The flow name to check access for"),
  },
  async ({ user_address, flow_name }) => {
    try {
      const rpcUrl = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      });

      const skillId = flowNameToSkillId(flow_name);

      const [canAccess, isPremium, isPurchased, dailyRemaining] = await publicClient.readContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "checkAccess",
        args: [user_address as Address, skillId],
      }) as [boolean, boolean, boolean, bigint];

      return { content: [{ type: "text" as const, text: JSON.stringify({
        user_address,
        flow_name,
        skill_id: skillId,
        can_access: canAccess,
        is_premium: isPremium,
        is_purchased: isPurchased,
        daily_remaining: dailyRemaining.toString(),
      }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text" as const, text: JSON.stringify({
        error: `Failed to check on-chain access: ${(e as Error).message}`,
        user_address,
        flow_name,
      }, null, 2) }] };
    }
  }
);

// ===================================================================
// FABRIC — MULTIPLAYER FLOW TOOLS
// ===================================================================

/**
 * Fabric API base URL. Defaults to the production deployment; can be
 * overridden via FABRIC_API_URL env var for local dev.
 */
function fabricApiUrl(): string {
  return (process.env.FABRIC_API_URL ?? "https://www.flowfabric.io").replace(/\/$/, "");
}

/**
 * POST a JSON body to a Fabric API endpoint.
 */
async function fabricPost(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = `${fabricApiUrl()}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { raw: text, status: res.status };
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * GET a Fabric API endpoint.
 */
async function fabricGet(path: string): Promise<Record<string, unknown>> {
  const url = `${fabricApiUrl()}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { raw: text, status: res.status };
    }
  } finally {
    clearTimeout(timeout);
  }
}

server.tool(
  "create_fabric_session",
  "Start a new Fabric multiplayer session. Fabric lets two people — the host (you) and a guest (no account needed) — each fill out their side of a flow, then synthesizes both perspectives into a shared output. Returns a shareable guest URL and a secret hostToken you must keep.",
  {
    flow_slug: z.string().describe("The flow this session is based on (e.g. 'contract-scope-alignment')"),
    title: z.string().optional().describe("Human-readable title for the session"),
    host_data: z.string().default("{}").describe("Optional JSON of host's initial data to submit immediately"),
    shared_fields: z.string().default("[]").describe("JSON array of field names the host wants to share with the guest"),
  },
  async ({ flow_slug, title, host_data, shared_fields }) => {
    // 1. Create the session
    const created = await fabricPost("/api/fabric/create", {
      flowSlug: flow_slug,
      title: title ?? flow_slug,
    });

    if (created.error) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: created.error }) }] };
    }

    const sessionId = created.sessionId as string;
    const hostToken = created.hostToken as string;

    // 2. Optionally submit host data immediately if provided
    let hostSide: Record<string, unknown> | null = null;
    let parsedData: Record<string, unknown> = {};
    let parsedFields: string[] = [];
    try { parsedData = JSON.parse(host_data); } catch { /* ok */ }
    try { parsedFields = JSON.parse(shared_fields) as string[]; } catch { /* ok */ }

    if (Object.keys(parsedData).length > 0) {
      hostSide = await fabricPost(`/api/fabric/${sessionId}/host`, {
        hostToken,
        data: parsedData,
        sharedFields: parsedFields,
      });
    }

    return { content: [{ type: "text" as const, text: JSON.stringify({
      session_id: sessionId,
      guest_url: created.guestUrl,
      host_token: hostToken,
      expires_at: created.expiresAt,
      host_submitted: hostSide?.host != null ? (hostSide.host as Record<string,unknown>).submitted : false,
      instructions: [
        `1. Share this link with your guest: ${created.guestUrl}`,
        "2. They fill out their side in the browser (no account needed).",
        "3. Once they submit, call get_fabric_status to check progress.",
        "4. When both sides are in, call submit_fabric_host_side (if you haven't yet), then get_fabric_status to read the synthesis prompt and run the flow.",
      ].join("\n"),
    }, null, 2) }] };
  }
);

server.tool(
  "submit_fabric_host_side",
  "Submit the host's answers for a Fabric session. Call this after collecting the host's inputs for the shared flow. Requires the hostToken returned by create_fabric_session.",
  {
    session_id: z.string().describe("The Fabric session ID"),
    host_token: z.string().describe("The secret hostToken returned by create_fabric_session"),
    data: z.string().default("{}").describe("JSON object of the host's form data / answers"),
    shared_fields: z.string().default("[]").describe("JSON array of field names to share with the guest (the rest stay private)"),
  },
  async ({ session_id, host_token, data, shared_fields }) => {
    let parsedData: Record<string, unknown> = {};
    let parsedFields: string[] = [];
    try { parsedData = JSON.parse(data); } catch { /* ok */ }
    try { parsedFields = JSON.parse(shared_fields) as string[]; } catch { /* ok */ }

    if (Object.keys(parsedData).length === 0) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: "data must be a non-empty JSON object" }) }] };
    }

    const result = await fabricPost(`/api/fabric/${session_id}/host`, {
      hostToken: host_token,
      data: parsedData,
      sharedFields: parsedFields,
    });

    if (result.error) {
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }

    const ready = result.readyForSynthesis as boolean;
    return { content: [{ type: "text" as const, text: JSON.stringify({
      ...result,
      next_step: ready
        ? `Both sides submitted! Call get_fabric_status('${session_id}', '${host_token}') to get the synthesis prompt and run the flow.`
        : "Waiting for guest to submit their side. Call get_fabric_status to check.",
    }, null, 2) }] };
  }
);

server.tool(
  "get_fabric_status",
  "Check the status of a Fabric session. When both sides have submitted and synthesis hasn't run yet, automatically triggers server-side neutral synthesis using your ANTHROPIC_API_KEY environment variable. Returns the synthesis output when ready.",
  {
    session_id: z.string().describe("The Fabric session ID"),
    host_token: z.string().optional().describe("The secret hostToken returned by create_fabric_session — required to trigger synthesis"),
  },
  async ({ session_id, host_token }) => {
    // Get session state
    const session = await fabricGet(`/api/fabric/${session_id}`);

    if (session.error) {
      return { content: [{ type: "text" as const, text: JSON.stringify(session) }] };
    }

    const hostSub = (session.host as Record<string,unknown>)?.submitted as boolean;
    const guestsSubmitted = (session.guestsSubmitted as number) ?? ((session.guest as Record<string,unknown>)?.submitted ? 1 : 0);
    const maxGuests = (session.maxGuests as number) ?? 1;
    const allGuestsIn = guestsSubmitted >= maxGuests;
    const synthStatus = (session.synthesis as Record<string,unknown>)?.status as string;
    const synthOutput = (session.synthesis as Record<string,unknown>)?.output as string ?? null;

    // Both sides ready and synthesis not yet run — trigger it automatically
    if (host_token && hostSub && allGuestsIn && synthStatus !== "complete") {
      const synthResult = await fabricPost(`/api/fabric/${session_id}/synthesize`, {
        hostToken: host_token,
      });

      if (synthResult.error) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: synthResult.error }) }] };
      }

      return { content: [{ type: "text" as const, text: JSON.stringify({
        ...synthResult,
        message: "Synthesis complete. Both parties can now see the shared neutral analysis.",
      }, null, 2) }] };
    }

    return { content: [{ type: "text" as const, text: JSON.stringify({
      ...session,
      host_submitted: hostSub,
      guests_submitted: guestsSubmitted,
      max_guests: maxGuests,
      synthesis_status: synthStatus ?? "pending",
      synthesis_output: synthOutput,
      next_step: !hostSub
        ? "Waiting for host to submit. Call submit_fabric_host_side."
        : !allGuestsIn
        ? `Waiting for ${maxGuests - guestsSubmitted} guest(s). Share the guest URL and ask them to fill out their side.`
        : synthStatus === "complete"
        ? "Synthesis complete. See synthesis_output above."
        : "Both sides in — call get_fabric_status with your host_token to trigger synthesis.",
    }, null, 2) }] };
  }
);

// ===================================================================
// HEALTH / META
// ===================================================================

server.tool("check_access",
  "Check if FlowFabric MCP server is running and accessible. Returns server status, tier, and marketplace stats.",
  {
    skill_name: z.string().default("").describe("Optional skill/flow name to check access for"),
  },
  async ({ skill_name }) => {
    const result = svc.handleCheckAccess({ skill_name });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ===================================================================
// COGNITIVE FABRIC — TKG + Communication layer
// ===================================================================

server.tool("tkg_query",
  "Query the Temporal Knowledge Graph for active assertions. Returns top results scored by confidence, importance, and recency.",
  {
    query_text: z.string().default("").describe("Natural language search term"),
    subject: z.string().default("").describe("Filter by subject ID"),
    predicate: z.string().default("").describe("Filter by predicate"),
    top_k: z.number().default(20).describe("Max results to return"),
    min_confidence: z.number().default(0).describe("Minimum confidence threshold 0-1"),
  },
  async ({ query_text, subject, predicate, top_k, min_confidence }) => {
    const result = svc.handleTkgQuery({ query_text, subject, predicate, top_k, min_confidence });
    if (result.error) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: result.error }) }] };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result.results, null, 2) }] };
  }
);

server.tool("tkg_write",
  "Write an assertion to the Temporal Knowledge Graph. Runs contradiction detection automatically.",
  {
    subject: z.string().describe("Entity being described"),
    predicate: z.string().describe("Relationship type (e.g. asserts, has_state, completed)"),
    object: z.string().describe("Value or target of the assertion"),
    confidence: z.number().default(0.9).describe("Confidence 0-1"),
    source_agent: z.string().default("claude").describe("Asserting agent ID"),
  },
  async ({ subject, predicate, object, confidence, source_agent }) => {
    const result = svc.handleTkgWrite({ subject, predicate, object, confidence, source_agent });
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
);

server.tool("tkg_stats",
  "Get Temporal Knowledge Graph statistics: counts of active, invalidated, and expired assertions.",
  {},
  async () => {
    const result = svc.handleTkgStats();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("send_agent_message",
  "Send a typed agent message (propose / challenge / confirm / ask / revise). Routes through the speech act dispatcher.",
  {
    act: z.enum(["ask","answer","propose","challenge","revise","confirm","reject","delegate","report","abort"]),
    content_json: z.string().default("{}").describe("JSON payload"),
    sender_id: z.string().default("claude").describe("Sender agent ID"),
    receiver_id: z.string().default("").describe("Receiver agent ID (empty = broadcast)"),
    thread_id: z.string().default("").describe("Thread ID (empty = auto)"),
    reply_to: z.string().default("").describe("Message ID this replies to"),
  },
  async ({ act, content_json, sender_id, receiver_id, thread_id, reply_to }) => {
    const result = svc.handleSendAgentMessage({ act, content_json, sender_id, receiver_id, thread_id, reply_to });
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
);

// ===================================================================
// START
// ===================================================================

function launchVelmaDesktop() {
  // Find velma-desktop relative to this package, or via a well-known path
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), "../../velma-desktop"),
    join(homedir(), ".skillchain", "velma-desktop"),
  ];
  const appDir = candidates.find(p => existsSync(join(p, "package.json")));
  if (!appDir) return; // not installed, skip silently

  const electronBin = join(appDir, "node_modules", ".bin", "electron");
  const electronExe = join(appDir, "node_modules", ".bin", "electron.cmd");
  const bin = existsSync(electronExe) ? electronExe : electronBin;
  if (!existsSync(bin)) return;

  const child = spawn(bin, [appDir], {
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref(); // don't block MCP server shutdown
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Launch Velma desktop companion alongside the MCP server
  launchVelmaDesktop();
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
