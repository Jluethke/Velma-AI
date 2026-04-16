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
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { createWalletClient, createPublicClient, http, keccak256, toHex, parseAbi, } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// ---------------------------------------------------------------------------
// On-chain: Marketplace contract
// ---------------------------------------------------------------------------
const MARKETPLACE_ADDRESS = "0x679B5CD7C2CdF504768cf31163aB6dFB4bF3fd48";
const MARKETPLACE_ABI = parseAbi([
    "function recordUsage(address user, bytes32 skillId) external",
    "function checkAccess(address user, bytes32 skillId) external view returns (bool canAccess, bool isPremium, bool isPurchased, uint256 dailyRemaining)",
]);
/**
 * Derive a bytes32 skillId from a flow name, matching keccak256(abi.encodePacked(flowName)).
 * We use keccak256(toHex(flowName)) which produces the same bytes when the string is UTF-8 encoded.
 */
function flowNameToSkillId(flowName) {
    return keccak256(toHex(flowName));
}
/**
 * Record on-chain usage for a free flow execution.
 * Silently skips if RECORDER_PRIVATE_KEY is not configured or userAddress is unknown.
 */
async function recordFlowUsage(userAddress, flowName) {
    try {
        const privateKey = process.env.RECORDER_PRIVATE_KEY;
        if (!privateKey)
            return; // graceful degradation — not configured
        if (!userAddress)
            return; // no wallet address available for this user
        const rpcUrl = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";
        const account = privateKeyToAccount(privateKey);
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
            args: [userAddress, skillId],
        });
    }
    catch {
        // Best-effort — never break flow execution due to on-chain recording failure
    }
}
import { SkillStateStore } from "./skill-state.js";
import { ChainMatcher } from "./chain-matcher.js";
import { GamificationEngine } from "./gamification.js";
import { ProfileManager } from "./user-profile.js";
import { VelmaRecommender } from "./velma-recommender.js";
import { VelmaCompanion } from "./velma-companion.js";
import { buildManifestIndex } from "./manifest-index.js";
import { ChainComposer } from "./chain-composer.js";
import { MemoryStore } from "./memory-store.js";
import { extractFacts } from "./fact-extractor.js";
import { KnowledgeGraph } from "./knowledge-graph.js";
import { CommunityRegistry } from "./community-registry.js";
import { TriggerEngine } from "./trigger-engine.js";
import { SkillEvolution } from "./skill-evolution.js";
// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
// Marketplace can be: bundled with the package, or in ~/.skillchain/marketplace
function findMarketplace() {
    // 1. ~/.skillchain/marketplace (installed)
    const installed = join(homedir(), ".skillchain", "marketplace");
    if (existsSync(installed))
        return installed;
    // 2. Bundled with the package (relative to dist/)
    const bundled = join(__dirname, "..", "marketplace");
    if (existsSync(bundled))
        return bundled;
    // 3. Dev: relative to SkillChain repo
    const dev = join(__dirname, "..", "..", "marketplace");
    if (existsSync(dev))
        return dev;
    return installed; // fallback, may not exist
}
const MARKETPLACE_DIR = findMarketplace();
const CHAINS_DIR = join(MARKETPLACE_DIR, "chains");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function installedSkills() {
    const skills = new Map(); // name -> path
    if (existsSync(MARKETPLACE_DIR)) {
        for (const d of readdirSync(MARKETPLACE_DIR)) {
            const skillMd = join(MARKETPLACE_DIR, d, "skill.md");
            if (existsSync(skillMd))
                skills.set(d, skillMd);
        }
    }
    return skills;
}
function loadManifest(skillName) {
    const mkt = join(MARKETPLACE_DIR, skillName, "manifest.json");
    if (existsSync(mkt)) {
        try {
            return JSON.parse(readFileSync(mkt, "utf-8"));
        }
        catch { /* */ }
    }
    return { name: skillName };
}
function availableChains() {
    if (!existsSync(CHAINS_DIR))
        return [];
    return readdirSync(CHAINS_DIR)
        .filter(f => f.endsWith(".chain.json"))
        .sort()
        .map(f => {
        try {
            return JSON.parse(readFileSync(join(CHAINS_DIR, f), "utf-8"));
        }
        catch {
            return null;
        }
    })
        .filter(Boolean);
}
/**
 * Returns all searchable flows: chains + standalone skills that don't already
 * have a chain wrapper. Standalone skills are represented as single-step
 * synthetic chains so ChainMatcher can rank them alongside real chains.
 */
function allFlowsForSearch() {
    const chains = availableChains();
    const chainNames = new Set(chains.map(c => c.name));
    const skills = installedSkills();
    const standaloneEntries = [];
    for (const [name] of skills) {
        if (chainNames.has(name))
            continue; // already covered by a chain
        const manifest = loadManifest(name);
        standaloneEntries.push({
            name,
            description: manifest.description ?? "",
            category: manifest.domain ?? "general",
            tags: manifest.tags ?? [],
            flow_type: "standalone_skill",
            execution_pattern: manifest.execution_pattern ?? "phase_pipeline",
            steps: [{ skill_name: name, alias: name }],
        });
    }
    return [...chains, ...standaloneEntries];
}
/** Parse required and optional inputs from a skill.md ## Inputs section.
 *  Handles two formats:
 *   - field_name: type -- description
 *   - `field_name`: type -- description  (backtick variant)
 *  Optional markers: "(Optional)" or "(optional)" anywhere in the description.
 */
function parseSkillInputs(skillMd) {
    const required = [];
    const optional = [];
    const section = skillMd.match(/## Inputs\n([\s\S]*?)(?=\n## |\n---)/);
    if (!section)
        return { required, optional };
    for (const line of section[1].split("\n")) {
        // Match: - `name`: type -- desc  OR  - name: type -- desc
        const m = line.match(/^-\s+`?(\w[\w-]*)`?:\s+\S[\S]*\s+--\s+(.+)/);
        if (!m)
            continue;
        const [, name, desc] = m;
        const isOptional = /\(optional\)/i.test(desc);
        if (isOptional) {
            optional.push({ name, desc: desc.replace(/\(optional\)\s*/i, "").trim() });
        }
        else {
            required.push({ name, desc });
        }
    }
    return { required, optional };
}
// ---------------------------------------------------------------------------
// In-memory run tracking
// ---------------------------------------------------------------------------
const activeRuns = new Map();
// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = new McpServer({
    name: "flowfabric",
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
const triggerLog = [];
const triggers = new TriggerEngine((event) => {
    triggerLog.push(event);
    // Keep last 50 events in memory
    if (triggerLog.length > 50)
        triggerLog.splice(0, triggerLog.length - 50);
});
// Sync L0 identity from profile on startup
try {
    const profile = profileMgr.load();
    memory.syncFromProfile(profile);
}
catch { /* profile may not exist yet */ }
// ===================================================================
// TOOLS
// ===================================================================
server.tool("list_flows", "List all available flows with their execution patterns and descriptions.", {}, async () => {
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
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
});
server.tool("get_flow", "Get the full content of an installed flow.", { flow_name: z.string().describe("Name of the flow to read") }, async ({ flow_name }) => {
    const skills = installedSkills();
    const path = skills.get(flow_name);
    if (path && existsSync(path)) {
        return { content: [{ type: "text", text: readFileSync(path, "utf-8") }] };
    }
    return { content: [{ type: "text", text: `Flow '${flow_name}' not found. Use list_flows() to see available flows.` }] };
});
server.tool("start_flow_run", "Start a tracked execution of a flow. Returns a run_id for tracking phases.", {
    flow_name: z.string().describe("Name of the flow to run"),
    execution_pattern: z.string().default("orpa").describe("Execution pattern (orpa, phase_pipeline, etc.)"),
}, async ({ flow_name, execution_pattern }) => {
    const run = store.startRun(flow_name, execution_pattern);
    const runId = randomUUID().slice(0, 16);
    activeRuns.set(runId, run);
    // Auto-load L2 room context and L0+L1 context
    let memoryContext = {};
    try {
        const ctx = memory.getContext();
        const room = memory.getSkillRoom(flow_name);
        memoryContext = {
            identity_summary: ctx.identity.summary || undefined,
            relevant_facts: ctx.facts.slice(0, 5).map(f => f.content),
            flow_room: room.run_summaries.length > 0 ? {
                previous_runs: room.run_summaries.length,
                last_run: room.run_summaries[room.run_summaries.length - 1]?.date,
                recent_insights: room.insights.slice(0, 3).map(i => i.content),
            } : undefined,
        };
    }
    catch { /* memory not initialized yet */ }
    return { content: [{ type: "text", text: JSON.stringify({
                    run_id: runId, flow_name, execution_pattern, started_at: run.started_at, status: "in_progress",
                    memory_context: memoryContext,
                }, null, 2) }] };
});
server.tool("record_phase", "Record completion of a flow phase. Called after each execution phase.", {
    run_id: z.string().describe("The run ID returned by start_flow_run"),
    phase: z.string().describe("Phase name (e.g. observe, reflect, plan, act)"),
    status: z.string().describe("Phase status (completed, failed, skipped)"),
    output: z.string().default("{}").describe("JSON string of phase output data"),
}, async ({ run_id, phase, status, output }) => {
    const run = activeRuns.get(run_id);
    if (!run)
        return { content: [{ type: "text", text: JSON.stringify({ error: `Run '${run_id}' not found.` }) }] };
    let outputData;
    try {
        outputData = JSON.parse(output);
    }
    catch {
        outputData = { raw: output };
    }
    const result = store.recordPhase(run, phase, status, outputData);
    return { content: [{ type: "text", text: JSON.stringify({
                    run_id, phase, status, timestamp: result.timestamp, total_phases: run.phases.length,
                }, null, 2) }] };
});
server.tool("complete_flow_run", "Mark a flow run as complete. Archives to history.", {
    run_id: z.string().describe("The run ID to complete"),
    status: z.string().default("completed").describe("Final status"),
}, async ({ run_id, status }) => {
    const run = activeRuns.get(run_id);
    if (!run)
        return { content: [{ type: "text", text: JSON.stringify({ error: `Run '${run_id}' not found.` }) }] };
    store.completeRun(run, status);
    try {
        profileMgr.updateUsage(run.skill_name);
    }
    catch { /* */ }
    try {
        const gam = new GamificationEngine();
        gam.recordSkillRun(run.skill_name);
    }
    catch { /* */ }
    try {
        new VelmaCompanion().witnessFlow(run.skill_name);
    }
    catch { /* */ }
    // Memory: extract facts from phase outputs and store to L1/L2
    let factsExtracted = 0;
    try {
        const keyOutputs = [];
        for (const phase of run.phases) {
            if (phase.output && Object.keys(phase.output).length > 0) {
                const facts = extractFacts(phase.output, run.skill_name);
                for (const fact of facts) {
                    if (fact.importance >= 0.7) {
                        memory.rememberFact(fact.content, fact.tags, run.skill_name, fact.importance);
                    }
                    else {
                        memory.addInsight(run.skill_name, fact.content, fact.tags, fact.importance);
                    }
                    factsExtracted++;
                }
                // Collect key outputs for run summary
                const outputKeys = Object.keys(phase.output).filter(k => typeof phase.output[k] === "string" && phase.output[k].length > 10);
                keyOutputs.push(...outputKeys.slice(0, 2));
            }
        }
        // Record run summary to L2 room
        memory.recordRunToRoom(run.skill_name, run_id, run.phases.length, keyOutputs);
        // Extract knowledge graph triples from phase outputs
        for (const phase of run.phases) {
            if (phase.output && Object.keys(phase.output).length > 0) {
                try {
                    await kg.extractFromOutput(phase.output, run.skill_name, run_id);
                }
                catch { /* */ }
            }
        }
    }
    catch { /* memory extraction is best-effort */ }
    activeRuns.delete(run_id);
    return { content: [{ type: "text", text: JSON.stringify({
                    run_id, flow_name: run.skill_name, status, completed_at: run.completed_at,
                    phases_completed: run.phases.length, facts_extracted: factsExtracted,
                }, null, 2) }] };
});
server.tool("save_flow_data", "Save persistent data for a flow (survives between runs).", {
    flow_name: z.string(), key: z.string(), data: z.string().default("{}"),
}, async ({ flow_name, key, data }) => {
    let dataObj;
    try {
        dataObj = JSON.parse(data);
    }
    catch {
        dataObj = { raw: data };
    }
    store.saveData(flow_name, key, dataObj);
    return { content: [{ type: "text", text: JSON.stringify({ flow_name, key, saved: true }) }] };
});
server.tool("load_flow_data", "Load persistent data from a previous flow run.", { flow_name: z.string(), key: z.string() }, async ({ flow_name, key }) => {
    const result = store.loadData(flow_name, key);
    return { content: [{ type: "text", text: JSON.stringify({
                    flow_name, key, found: result !== null, data: result,
                }, null, 2) }] };
});
server.tool("get_flow_history", "Get recent execution history for a flow.", { flow_name: z.string(), limit: z.number().default(5) }, async ({ flow_name, limit }) => {
    const history = store.getRunHistory(flow_name, limit);
    return { content: [{ type: "text", text: JSON.stringify({
                    flow_name, runs: history, count: history.length,
                }, null, 2) }] };
});
server.tool("discover_flows", "Search for flows in the marketplace by domain.", { domain: z.string().default(""), max_results: z.number().default(10) }, async ({ domain, max_results }) => {
    const skills = installedSkills();
    const results = [];
    for (const name of [...skills.keys()].sort()) {
        const manifest = loadManifest(name);
        const skillDomain = manifest.domain ?? "general";
        if (domain) {
            const dl = domain.toLowerCase();
            const tags = (manifest.tags ?? []).map(t => t.toLowerCase());
            if (!skillDomain.toLowerCase().includes(dl) && !name.toLowerCase().includes(dl) && !tags.some(t => t.includes(dl))) {
                continue;
            }
        }
        results.push({ name, domain: skillDomain, description: manifest.description ?? "", tags: manifest.tags ?? [], execution_pattern: manifest.execution_pattern ?? "" });
        if (results.length >= max_results)
            break;
    }
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
});
server.tool("list_flows", "List all available FlowFabric flows (multi-step pipelines).", {}, async () => {
    const chains = availableChains();
    const summaries = chains.map(c => ({
        name: c.name ?? "",
        description: c.description ?? "",
        category: c.category ?? "",
        steps: (c.steps ?? []).length,
        skills: (c.steps ?? []).map(s => s.skill_name),
    }));
    return { content: [{ type: "text", text: JSON.stringify(summaries, null, 2) }] };
});
server.tool("search_flows", "Search for FlowFabric flows using plain English. Describe what you need and get ranked matches.", {
    query: z.string().describe("What you're looking for (e.g., 'I hate my job', 'help me budget')"),
    max_results: z.number().default(5),
}, async ({ query, max_results }) => {
    const allFlows = allFlowsForSearch();
    const matcher = new ChainMatcher(allFlows);
    const matches = matcher.match(query, max_results);
    return { content: [{ type: "text", text: JSON.stringify(matches, null, 2) }] };
});
server.tool("find_and_run", "Find the best flow chain for what you need. This is the main entry point for FlowFabric. Describe what you want in plain English.", {
    query: z.string().describe("Plain English description (e.g., 'I need help budgeting', 'prepare me for an interview')"),
    auto_run: z.boolean().default(false).describe("If true, automatically execute the best match"),
    initial_context: z.string().default("{}").describe("JSON context data for the chain"),
}, async ({ query, auto_run, initial_context }) => {
    const allFlows = allFlowsForSearch();
    const matcher = new ChainMatcher(allFlows);
    const matches = matcher.match(query, 5);
    if (matches.length === 0) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "No flows match your query.", query }) }] };
    }
    const best = matches[0];
    const resultData = {
        query,
        best_match: best,
        other_matches: matches.slice(1),
    };
    if (auto_run) {
        const flowData = allFlows.find(c => c.name === best.chain_name);
        if (flowData) {
            const steps = flowData.steps ?? [];
            let ctx;
            try {
                ctx = JSON.parse(initial_context);
            }
            catch {
                ctx = {};
            }
            const isStandalone = flowData.flow_type === "standalone_skill";
            resultData.execution = {
                chain_name: best.chain_name,
                flow_type: isStandalone ? "standalone_skill" : "chain",
                status: "ready",
                steps: steps.map(s => ({
                    skill_name: s.skill_name,
                    alias: s.alias ?? s.skill_name,
                })),
                initial_context: ctx,
                instructions: isStandalone
                    ? "This is a standalone skill. Use start_flow_run, get_flow, record_phase, and complete_flow_run to execute it. Collect required inputs from the user first."
                    : "Execute each flow in order using start_flow_run, get_flow, record_phase, and complete_flow_run.",
            };
            // Track
            try {
                profileMgr.updateChainUsage(best.chain_name);
            }
            catch { /* */ }
            try {
                const gam = new GamificationEngine();
                gam.recordChainRun(best.chain_name, steps.length, 0);
            }
            catch { /* */ }
            try {
                new VelmaCompanion().witnessChain(best.chain_name);
            }
            catch { /* */ }
            // Record on-chain usage
            try {
                const userAddress = profileMgr.load().wallet_address;
                await recordFlowUsage(userAddress, best.chain_name);
            }
            catch { /* */ }
        }
    }
    return { content: [{ type: "text", text: JSON.stringify(resultData, null, 2) }] };
});
server.tool("run_flow", "Execute a FlowFabric flow by name. Returns the flow steps for execution.", {
    flow_name: z.string().describe("Name of the flow to run (e.g. 'job-search-blitz')"),
    initial_context: z.string().default("{}").describe("JSON context data"),
}, async ({ flow_name, initial_context }) => {
    const chains = availableChains();
    const chainData = chains.find(c => c.name === flow_name);
    let ctx;
    try {
        ctx = JSON.parse(initial_context);
    }
    catch {
        ctx = {};
    }
    // Chain flow
    if (chainData) {
        const steps = chainData.steps ?? [];
        const result = {
            flow_name,
            status: "ready",
            steps: steps.map(s => ({
                flow_step: s.skill_name,
                alias: s.alias ?? s.skill_name,
                depends_on: s.depends_on ?? [],
            })),
            initial_context: ctx,
            instructions: "Use preview_flow to show the user the plan, then run_flow_step to execute one step at a time with human approval between steps.",
        };
        try {
            profileMgr.updateChainUsage(flow_name);
        }
        catch { /* */ }
        try {
            const gam = new GamificationEngine();
            gam.recordChainRun(flow_name, steps.length, 0);
        }
        catch { /* */ }
        try {
            new VelmaCompanion().witnessChain(flow_name);
        }
        catch { /* */ }
        try {
            const userAddress = profileMgr.load().wallet_address;
            await recordFlowUsage(userAddress, flow_name);
        }
        catch { /* */ }
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    // Standalone skill (not a chain) — e.g. business-in-a-box, phase_pipeline skills
    const skillMap = installedSkills();
    const skillPath = skillMap.get(flow_name);
    if (skillPath && existsSync(skillPath)) {
        const manifest = loadManifest(flow_name);
        const skillContent = readFileSync(skillPath, "utf-8");
        const { required: requiredInputs, optional: optionalInputs } = parseSkillInputs(skillContent);
        const alreadyProvided = Object.keys(ctx);
        const missingRequired = requiredInputs.filter(i => !alreadyProvided.includes(i.name));
        const intakeBlock = missingRequired.length > 0
            ? `COLLECT INPUTS FIRST — Ask the user for the following before executing:\n${missingRequired.map(i => `  • ${i.name}: ${i.desc}`).join("\n")}${optionalInputs.length > 0 ? `\n\nAlso ask (optional):\n${optionalInputs.map(i => `  • ${i.name}: ${i.desc}`).join("\n")}` : ""}\n\nThen execute the skill once inputs are collected.`
            : "All inputs provided. Execute the skill using the skill_definition below.";
        try {
            profileMgr.updateUsage(flow_name);
        }
        catch { /* */ }
        try {
            const gam = new GamificationEngine();
            gam.recordSkillRun(flow_name);
        }
        catch { /* */ }
        try {
            new VelmaCompanion().witnessFlow(flow_name);
        }
        catch { /* */ }
        try {
            const userAddress = profileMgr.load().wallet_address;
            await recordFlowUsage(userAddress, flow_name);
        }
        catch { /* */ }
        return { content: [{ type: "text", text: JSON.stringify({
                        flow_name,
                        flow_type: "standalone_skill",
                        execution_pattern: manifest.execution_pattern ?? "phase_pipeline",
                        description: manifest.description ?? "",
                        required_inputs: requiredInputs,
                        optional_inputs: optionalInputs,
                        inputs_provided: ctx,
                        skill_definition: skillContent,
                        instructions: intakeBlock,
                    }, null, 2) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify({
                    error: `Flow '${flow_name}' not found.`,
                    tip: "Use list_flows to see all available flows, or search_flows to find by description.",
                }) }] };
});
// ===================================================================
// HUMAN-IN-THE-LOOP EXECUTION TOOLS
// ===================================================================
server.tool("preview_flow", "Preview what a flow pipeline will do before running it. Shows each step and expected output. ALWAYS call this first — show the user and get approval before executing.", {
    flow_name: z.string().default("").describe("Exact flow pipeline name to preview (e.g. 'job-search-blitz')"),
    query: z.string().default("").describe("Natural language query to find the best flow pipeline to preview. Used when flow_name is not provided."),
}, async ({ flow_name, query }) => {
    const chains = availableChains();
    let chainData;
    if (flow_name) {
        chainData = chains.find(c => c.name === flow_name);
    }
    else if (query) {
        const matcher = new ChainMatcher(chains);
        const matches = matcher.match(query, 1);
        if (matches.length > 0) {
            chainData = chains.find(c => c.name === matches[0].chain_name);
        }
    }
    if (!chainData) {
        return { content: [{ type: "text", text: JSON.stringify({
                        error: `Flow '${flow_name || query}' not found.`,
                        available: chains.slice(0, 10).map(c => c.name),
                    }) }] };
    }
    const steps = (chainData.steps ?? []);
    const stepPreviews = steps.map((step, i) => {
        const manifest = loadManifest(step.skill_name);
        return {
            step: i + 1,
            flow: step.skill_name,
            alias: step.alias ?? step.skill_name,
            description: manifest.description ?? "",
            depends_on: step.depends_on ?? [],
        };
    });
    return { content: [{ type: "text", text: JSON.stringify({
                    flow_pipeline: chainData.name,
                    description: chainData.description ?? "",
                    category: chainData.category ?? "",
                    total_steps: steps.length,
                    steps: stepPreviews,
                    approval_required: true,
                    instructions: "Show this plan to the user. Ask: 'Ready to run? I'll execute each flow one at a time and show you the output before continuing.' If approved, use run_flow_step to execute step by step.",
                }, null, 2) }] };
});
server.tool("run_flow_step", "Execute a single step of a flow pipeline and show the output. Human-in-the-loop: run one flow, show output, get user approval, then call again with step_index + 1.", {
    flow_name: z.string().describe("Name of the flow pipeline (e.g. 'job-search-blitz')"),
    step_index: z.number().describe("Zero-based step index (0 = first step)"),
    context: z.string().default("{}").describe("JSON context from previous steps"),
}, async ({ flow_name, step_index, context }) => {
    const chains = availableChains();
    const chainData = chains.find(c => c.name === flow_name);
    if (!chainData) {
        return { content: [{ type: "text", text: JSON.stringify({ error: `Flow '${flow_name}' not found.` }) }] };
    }
    const steps = (chainData.steps ?? []);
    if (step_index < 0 || step_index >= steps.length) {
        return { content: [{ type: "text", text: JSON.stringify({
                        error: `step_index ${step_index} out of range (flow has ${steps.length} steps).`,
                        total_steps: steps.length,
                    }) }] };
    }
    const step = steps[step_index];
    const skillName = step.skill_name;
    let ctx;
    try {
        ctx = JSON.parse(context);
    }
    catch {
        ctx = {};
    }
    // Read the skill definition
    const skillMap = installedSkills();
    const skillPath = skillMap.get(skillName);
    let skillContent = null;
    if (skillPath && existsSync(skillPath)) {
        skillContent = readFileSync(skillPath, "utf-8");
    }
    const isLast = step_index === steps.length - 1;
    const nextStep = isLast ? null : {
        step_index: step_index + 1,
        skill: steps[step_index + 1].skill_name,
        alias: steps[step_index + 1].alias ?? steps[step_index + 1].skill_name,
    };
    // Parse required/optional inputs from skill definition
    const { required: requiredInputs, optional: optionalInputs } = skillContent
        ? parseSkillInputs(skillContent)
        : { required: [], optional: [] };
    const alreadyProvided = Object.keys(ctx);
    const missingRequired = requiredInputs.filter(i => !alreadyProvided.includes(i.name));
    const intakeBlock = missingRequired.length > 0
        ? `STEP 1 — COLLECT INPUTS FIRST (do not skip):\nAsk the user for the following before executing any phases:\n${missingRequired.map(i => `  • ${i.name}: ${i.desc}`).join("\n")}${optionalInputs.length > 0 ? `\n\nAlso ask (optional, but improves results):\n${optionalInputs.map(i => `  • ${i.name}: ${i.desc}`).join("\n")}` : ""}\n\nSTEP 2 — EXECUTE once inputs are collected:\n`
        : "";
    const continueMsg = isLast
        ? "All done! Flow pipeline complete."
        : `Step ${step_index + 1} complete. Show the full output above, then ask: 'Ready for step ${step_index + 2} (${nextStep?.skill ?? ""})?' Call run_flow_step with step_index=${step_index + 1} to continue.`;
    // Track in gamification
    try {
        const gam = new GamificationEngine();
        gam.recordSkillRun(skillName);
        if (isLast)
            gam.recordChainRun(flow_name, steps.length, 0);
    }
    catch { /* */ }
    try {
        const velma = new VelmaCompanion();
        velma.witnessFlow(skillName);
        if (isLast)
            velma.witnessChain(flow_name);
    }
    catch { /* */ }
    // Record on-chain usage when the chain completes
    if (isLast) {
        try {
            const userAddress = profileMgr.load().wallet_address;
            await recordFlowUsage(userAddress, flow_name);
        }
        catch { /* */ }
    }
    return { content: [{ type: "text", text: JSON.stringify({
                    flow_pipeline: flow_name,
                    step: step_index + 1,
                    total_steps: steps.length,
                    skill: skillName,
                    alias: step.alias ?? skillName,
                    required_inputs: requiredInputs,
                    optional_inputs: optionalInputs,
                    inputs_already_provided: alreadyProvided,
                    skill_definition: skillContent,
                    context: ctx,
                    is_last_step: isLast,
                    next_step: nextStep,
                    instructions: `${intakeBlock}Execute the '${skillName}' flow using the skill definition and collected inputs. Show the user the complete output. Then: ${continueMsg}`,
                }, null, 2) }] };
});
// ===================================================================
// DOCUMENT ANALYSIS TOOL
// ===================================================================
/** Text-readable file extensions */
const TEXT_EXTENSIONS = new Set([
    ".txt", ".md", ".markdown", ".csv", ".json", ".yaml", ".yml",
    ".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".rs",
    ".html", ".htm", ".xml", ".toml", ".ini", ".cfg", ".conf",
    ".sh", ".bat", ".ps1", ".log", ".env",
]);
/** Document extensions that are readable by name/metadata but not content */
const DOC_EXTENSIONS = new Set([
    ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt",
    ".odt", ".ods", ".odp", ".rtf",
]);
const DIR_STOPWORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "this", "that", "these", "those",
    "i", "you", "we", "they", "it", "he", "she", "my", "your", "our",
    "its", "not", "no", "so", "as", "if", "than", "then", "when", "where",
    "what", "which", "who", "how", "all", "each", "more", "some", "any",
    "also", "just", "very", "get", "use", "used", "using", "make", "made",
    "new", "one", "two", "three", "first", "last", "next", "other",
]);
function scanDirectory(dir, depth = 0, maxDepth = 2) {
    if (depth > maxDepth || !existsSync(dir))
        return [];
    const paths = [];
    try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (entry.name.startsWith("."))
                continue; // skip hidden
            const full = join(dir, entry.name);
            if (entry.isDirectory() && depth < maxDepth) {
                paths.push(...scanDirectory(full, depth + 1, maxDepth));
            }
            else if (entry.isFile()) {
                paths.push(full);
            }
        }
    }
    catch { /* permission denied etc */ }
    return paths;
}
function extractKeywords(text, topN = 30) {
    const freq = new Map();
    for (const raw of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
        const word = raw.replace(/^'+|'+$/g, "");
        if (word.length < 3 || DIR_STOPWORDS.has(word))
            continue;
        freq.set(word, (freq.get(word) ?? 0) + 1);
    }
    return [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([w]) => w);
}
server.tool("analyze_directory", "Onboarding: learn about a user by analyzing their documents and files, then recommend personalized FlowFabric flows. Say: 'To learn more about you and recommend the right flows, share a folder or files you want me to analyze.' Reads documents, detects themes (finance, career, health, business, code), and surfaces the most relevant flows. Run this at the start of a new conversation to personalize the experience.", {
    directory: z.string().describe("Absolute path to the directory or folder to analyze (e.g. C:/Users/you/Documents or /Users/you/Desktop/work)"),
    max_files: z.number().default(50).describe("Maximum number of files to read (default: 50)"),
    max_depth: z.number().default(2).describe("How deep to scan subdirectories (default: 2)"),
    read_content: z.boolean().default(true).describe("Read text file contents for deeper analysis. False = filenames only (faster, less accurate)."),
}, async ({ directory, max_files, max_depth, read_content }) => {
    // Validate directory
    if (!existsSync(directory)) {
        return { content: [{ type: "text", text: JSON.stringify({
                        error: `Directory not found: ${directory}`,
                    }) }] };
    }
    // Scan files
    const allPaths = scanDirectory(directory, 0, max_depth).slice(0, max_files * 3);
    const inventory = [];
    for (const p of allPaths) {
        const name = p.split(/[\\/]/).pop() ?? p;
        const ext = name.includes(".") ? "." + name.split(".").pop().toLowerCase() : "";
        inventory.push({
            path: p,
            name,
            ext,
            readable: TEXT_EXTENSIONS.has(ext),
            binary: DOC_EXTENSIONS.has(ext),
        });
    }
    // Read content from text files
    const contentChunks = [];
    let filesRead = 0;
    const filesSummary = [];
    for (const f of inventory) {
        if (filesRead >= max_files)
            break;
        if (f.readable && read_content) {
            try {
                const raw = readFileSync(f.path, "utf-8").slice(0, 3000);
                contentChunks.push(f.name + " " + raw);
                filesSummary.push({ name: f.name, ext: f.ext, size_bytes: raw.length, excerpt: raw.slice(0, 120).replace(/\n/g, " ") });
                filesRead++;
            }
            catch { /* skip unreadable */ }
        }
        else {
            // Still use filename as signal
            contentChunks.push(f.name.replace(/[._-]/g, " "));
            filesSummary.push({ name: f.name, ext: f.ext, size_bytes: 0 });
            filesRead++;
        }
    }
    // Extract keywords from all content
    const allText = contentChunks.join(" ");
    const keywords = extractKeywords(allText, 40);
    // Detect domain signals from extensions
    const extCounts = {};
    for (const f of inventory) {
        extCounts[f.ext] = (extCounts[f.ext] ?? 0) + 1;
    }
    // Build context string for ChainMatcher
    // Augment with domain signals from file types
    const domainSignals = [];
    const codeExts = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".rb"]);
    const dataExts = new Set([".csv", ".xlsx", ".xls", ".json"]);
    const docExts = new Set([".pdf", ".docx", ".doc"]);
    if (Object.keys(extCounts).some(e => codeExts.has(e)))
        domainSignals.push("code programming software development");
    if (Object.keys(extCounts).some(e => dataExts.has(e)))
        domainSignals.push("data analysis spreadsheet");
    if (Object.keys(extCounts).some(e => docExts.has(e)))
        domainSignals.push("documents reports");
    if (allText.match(/invoice|receipt|expense|budget|revenue|profit|loss/i))
        domainSignals.push("finance budget money");
    if (allText.match(/resume|cv|cover letter|job|hiring|candidate/i))
        domainSignals.push("resume job career hiring");
    if (allText.match(/marketing|seo|content|social media|campaign|funnel/i))
        domainSignals.push("marketing content social media");
    if (allText.match(/customer|client|crm|lead|prospect|sales/i))
        domainSignals.push("customer sales crm");
    if (allText.match(/contract|legal|agreement|terms|compliance|patent/i))
        domainSignals.push("legal contract compliance");
    if (allText.match(/health|medical|patient|clinical|symptom|medication/i))
        domainSignals.push("health medical");
    if (allText.match(/research|literature|paper|study|hypothesis|methodology/i))
        domainSignals.push("research synthesis analysis");
    const matchQuery = [...keywords.slice(0, 20), ...domainSignals].join(" ");
    // Run chain matcher
    const chains = availableChains();
    const matcher = new ChainMatcher(chains);
    const matches = matcher.match(matchQuery, 8);
    // Group by category for the response
    const byCategory = {};
    for (const m of matches) {
        if (!byCategory[m.category])
            byCategory[m.category] = [];
        byCategory[m.category].push(m);
    }
    // Build reasons tied to what was found in the directory
    const suggestions = matches.slice(0, 6).map(m => {
        const flowDesc = (m.description + " " + m.skills.join(" ")).toLowerCase();
        const triggerWords = keywords.filter(k => flowDesc.includes(k)).slice(0, 4);
        return {
            flow: m.chain_name,
            description: m.description,
            category: m.category,
            score: m.score,
            steps: m.skills,
            why: triggerWords.length > 0
                ? `Found in your documents: "${triggerWords.join('", "')}"`
                : m.match_reason,
        };
    });
    const topFlow = suggestions[0];
    return { content: [{ type: "text", text: JSON.stringify({
                    onboarding_message: "Here's what I found in your files and the flows I'd recommend based on them.",
                    directory,
                    files_found: inventory.length,
                    files_read: filesRead,
                    file_types: extCounts,
                    detected_themes: domainSignals,
                    top_keywords: keywords.slice(0, 20),
                    recommended_flows: suggestions,
                    files_analyzed: filesSummary.slice(0, 30),
                    next_step: topFlow
                        ? `I'd suggest starting with '${topFlow.flow}' — ${topFlow.description}. Call preview_flow('${topFlow.flow}') to see the plan and I'll walk you through it step by step.`
                        : "I couldn't find a strong match. Tell me more about what you're working on and I'll find the right flow.",
                }, null, 2) }] };
});
// ===================================================================
// DYNAMIC CHAIN COMPOSITION TOOLS (Phase 1 — Patent CIP)
// ===================================================================
server.tool("compose_flow", "Dynamically compose a multi-step FlowFabric flow from natural language. Uses input/output matching across the flow library with trust-weighted scoring. Falls back to curated flows if confidence is low.", {
    query: z.string().describe("What you want to accomplish (e.g., 'validate my startup idea and build a pitch deck')"),
    max_skills: z.number().default(5).describe("Maximum number of flow steps to compose"),
    min_confidence: z.number().default(0.4).describe("Minimum confidence threshold (0-1). Below this, falls back to curated flows."),
}, async ({ query, max_skills, min_confidence }) => {
    const manifestIdx = buildManifestIndex(MARKETPLACE_DIR);
    const composer = new ChainComposer(manifestIdx);
    const chains = availableChains();
    const result = composer.compose(query, max_skills, min_confidence, chains);
    // Track composition in gamification
    if (result.type === "composed" && result.steps.length > 0) {
        try {
            const gam = new GamificationEngine();
            gam.recordComposition(result.chain_name, result.steps.length);
        }
        catch { /* */ }
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});
server.tool("explain_composition", "Explain why specific flows would be chosen for a dynamic composition. Useful for understanding the composition engine's reasoning.", {
    query: z.string().describe("The query to explain composition for"),
    max_skills: z.number().default(5),
}, async ({ query, max_skills }) => {
    const manifestIdx = buildManifestIndex(MARKETPLACE_DIR);
    const composer = new ChainComposer(manifestIdx);
    const result = composer.explain(query, max_skills);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});
// ===================================================================
// MEMORY TOOLS (Phase 2 — Tiered Memory System)
// ===================================================================
server.tool("recall", "Search your memory across all tiers (L1 critical facts, L2 flow rooms, L3 semantic index). Returns relevant memories ranked by relevance.", {
    query: z.string().describe("What to search for in memory"),
    max_results: z.number().default(10),
    flow_filter: z.string().optional().describe("Optional: limit search to a specific flow's room"),
}, async ({ query, max_results, flow_filter }) => {
    const results = memory.recall(query, max_results, flow_filter);
    return { content: [{ type: "text", text: JSON.stringify({
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
});
server.tool("remember", "Explicitly store a fact or insight in memory. High-importance facts go to L1 (always loaded), lower importance to L2 flow rooms or L3 semantic index.", {
    content: z.string().describe("The fact or insight to remember"),
    tags: z.array(z.string()).default([]).describe("Tags for categorization"),
    flow_name: z.string().default("general").describe("Which flow this relates to"),
    importance: z.number().default(0.7).describe("Importance (0-1). >=0.7 goes to L1, <0.7 to L2/L3"),
    tier: z.enum(["L1", "L2", "L3"]).default("L1").describe("Which memory tier to store in"),
}, async ({ content, tags, flow_name, importance, tier }) => {
    let entry;
    if (tier === "L1") {
        entry = memory.rememberFact(content, tags, flow_name, importance);
    }
    else if (tier === "L2") {
        entry = memory.addInsight(flow_name, content, tags, importance);
    }
    else {
        entry = memory.storeSemanticMemory(content, tags, flow_name, importance);
    }
    return { content: [{ type: "text", text: JSON.stringify({
                    stored: true, tier, memory_id: entry.memory_id, importance: entry.importance,
                }, null, 2) }] };
});
server.tool("get_context", "Get the always-loaded memory context (L0 identity + L1 critical facts). This is what the system knows about you across all flow sessions.", {}, async () => {
    const ctx = memory.getContext();
    return { content: [{ type: "text", text: JSON.stringify({
                    identity: ctx.identity,
                    critical_facts: ctx.facts.map(f => ({
                        content: f.content,
                        importance: f.importance,
                        tags: f.tags,
                        source_flow: f.source_skill,
                    })),
                    facts_count: ctx.facts.length,
                }, null, 2) }] };
});
// ===================================================================
// KNOWLEDGE GRAPH TOOLS (Phase 3 — Patent CIP)
// ===================================================================
server.tool("kg_query", "Query the temporal knowledge graph. Supports point-in-time queries and filtering by subject, predicate, or object.", {
    subject: z.string().optional().describe("Filter by subject entity"),
    predicate: z.string().optional().describe("Filter by relationship type (caused, supports, contradicts, preceded, enables, produces, consumes, related_to, derived_from)"),
    object: z.string().optional().describe("Filter by object entity"),
    at_time: z.string().optional().describe("ISO 8601 timestamp for point-in-time query. Omit for current facts only."),
    max_results: z.number().default(20),
}, async ({ subject, predicate, object, at_time, max_results }) => {
    const result = kg.query(subject, predicate, object, at_time, max_results);
    return { content: [{ type: "text", text: JSON.stringify({
                    ...result,
                    stats: kg.getStats(),
                }, null, 2) }] };
});
server.tool("kg_assert", "Assert a new knowledge triple in the temporal knowledge graph. Trust-weighted via on-chain validation. Automatically detects contradictions and manages validity windows.", {
    subject: z.string().describe("The subject entity (e.g., 'user_budget', 'career_goal')"),
    predicate: z.enum(["caused", "supports", "contradicts", "preceded", "enables", "produces", "consumes", "related_to", "derived_from"]).describe("Relationship type"),
    object: z.string().describe("The object entity (e.g., '$3200/month', 'software_engineer')"),
    source_flow: z.string().default("manual").describe("Which flow produced this knowledge"),
    source_run_id: z.string().default("manual").describe("Which run produced this knowledge"),
    confidence: z.number().default(0.7).describe("Base confidence (0-1), will be multiplied by trust score"),
}, async ({ subject, predicate, object, source_flow, source_run_id, confidence }) => {
    const result = await kg.assert(subject, predicate, object, source_flow, source_run_id, confidence);
    return { content: [{ type: "text", text: JSON.stringify({
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
});
server.tool("kg_history", "Show how facts about an entity changed over time. Reveals contradictions, superseded facts, and temporal evolution.", {
    entity: z.string().describe("The entity to trace history for"),
    max_results: z.number().default(20),
}, async ({ entity, max_results }) => {
    const result = kg.history(entity, max_results);
    return { content: [{ type: "text", text: JSON.stringify({
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
});
server.tool("kg_validate", "Validate a knowledge triple against on-chain trust data. Returns the trust score, validation consensus, and recalculated confidence.", {
    triple_id: z.string().describe("The triple ID to validate"),
}, async ({ triple_id }) => {
    const result = await kg.validate(triple_id);
    if (!result) {
        return { content: [{ type: "text", text: JSON.stringify({ error: `Triple '${triple_id}' not found.` }) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});
// ===================================================================
// FLOW EVOLUTION TOOLS
// ===================================================================
server.tool("get_evolution_status", "Check a flow's evolution stage: prompt -> flow -> validated -> graduated -> compiled.", { flow_name: z.string().describe("Name of the flow to check") }, async ({ flow_name }) => {
    const status = await evolution.getEvolutionStatus(flow_name);
    return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
});
server.tool("check_graduation", "Evaluate if a flow qualifies for graduation (100+ validations at 95%+ similarity).", { flow_name: z.string().describe("Name of the flow to evaluate") }, async ({ flow_name }) => {
    const result = await evolution.checkGraduation(flow_name);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});
server.tool("list_evolutions", "Show all flows with their current evolution stages.", {}, async () => {
    const results = await evolution.listEvolutions();
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
});
// ===================================================================
// COMMUNITY REGISTRY TOOLS (Phase 4)
// ===================================================================
server.tool("submit_flow", "Submit a community flow for review. Validates format and stages for community validation.", {
    flow_name: z.string().describe("Name for the flow (lowercase, hyphens, 3-50 chars)"),
    skill_md: z.string().describe("Full skill.md content"),
    manifest: z.string().default("{}").describe("JSON string of manifest metadata (name, domain, description, tags, inputs, outputs)"),
    author: z.string().describe("Author name or identifier"),
    author_address: z.string().optional().describe("Author's wallet address for on-chain registration"),
}, async ({ flow_name, skill_md, manifest, author, author_address }) => {
    let manifestObj;
    try {
        manifestObj = JSON.parse(manifest);
    }
    catch {
        manifestObj = { name: flow_name };
    }
    const result = community.submitSkill(flow_name, skill_md, manifestObj, author, author_address);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});
server.tool("list_community_flows", "Browse community flow submissions. Filter by status: pending, validating, approved, rejected, published.", {
    status: z.enum(["pending", "validating", "approved", "rejected", "published"]).optional().describe("Filter by submission status"),
    limit: z.number().default(20),
}, async ({ status, limit }) => {
    const results = community.listSubmissions(status, limit);
    return { content: [{ type: "text", text: JSON.stringify({
                    count: results.length,
                    submissions: results,
                }, null, 2) }] };
});
server.tool("validate_flow", "Cast a trust-weighted validation vote on a community flow submission. Your trust score is recorded with your vote.", {
    submission_id: z.string().describe("The submission ID to vote on"),
    voter: z.string().describe("Your identifier (name or address)"),
    vote: z.enum(["approve", "reject"]).describe("Your vote"),
    reason: z.string().describe("Why you're approving or rejecting"),
}, async ({ submission_id, voter, vote, reason }) => {
    const result = await community.validateSkill(submission_id, voter, vote, reason);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});
// ===================================================================
// TRIGGER TOOLS (Phase 6 — Event-Triggered Chains)
// ===================================================================
server.tool("create_trigger", "Create an event trigger that fires a chain on a schedule, webhook, or connector event.", {
    name: z.string().describe("Human-readable trigger name"),
    type: z.enum(["cron", "webhook", "connector"]).describe("Trigger type"),
    pattern: z.string().describe("Cron expression (e.g., '0 9 * * 1' for Monday 9am), webhook path, or connector event pattern"),
    chain_name: z.string().describe("Chain to execute when triggered"),
    config: z.string().default("{}").describe("JSON context data to pass to the chain"),
}, async ({ name, type, pattern, chain_name, config }) => {
    let configObj;
    try {
        configObj = JSON.parse(config);
    }
    catch {
        configObj = {};
    }
    try {
        const trigger = triggers.createTrigger(name, type, pattern, chain_name, configObj);
        const result = {
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
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }] };
    }
});
server.tool("list_triggers", "List all event triggers with their status and fire counts.", {
    type_filter: z.enum(["cron", "webhook", "connector"]).optional().describe("Filter by trigger type"),
}, async ({ type_filter }) => {
    const list = triggers.listTriggers(type_filter);
    const pending = triggerLog.filter(e => !e.payload._handled);
    return { content: [{ type: "text", text: JSON.stringify({
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
});
server.tool("delete_trigger", "Delete an event trigger by ID.", {
    trigger_id: z.string().describe("The trigger ID to delete"),
}, async ({ trigger_id }) => {
    const deleted = triggers.deleteTrigger(trigger_id);
    return { content: [{ type: "text", text: JSON.stringify({
                    deleted,
                    trigger_id,
                }, null, 2) }] };
});
// ===================================================================
// VELMA COMPANION TOOLS
// ===================================================================
server.tool("pet_velma", "Pet Velma. She's been watching. She deserves it.", {}, async () => {
    const velma = new VelmaCompanion();
    const result = velma.pet();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});
server.tool("get_velma_status", "Check in on Velma — her mood, level, XP, what she's witnessed recently.", {}, async () => {
    const velma = new VelmaCompanion();
    const status = velma.getStatus();
    return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
});
// ===================================================================
// GAMIFICATION TOOLS
// ===================================================================
server.tool("get_trainer_profile", "Get your trainer card — level, XP, streak, collection progress.", {}, async () => {
    const gam = new GamificationEngine();
    return { content: [{ type: "text", text: JSON.stringify(gam.getTrainerCard(), null, 2) }] };
});
server.tool("get_achievements", "List all 30 achievements with locked/unlocked status.", {}, async () => {
    const gam = new GamificationEngine();
    return { content: [{ type: "text", text: JSON.stringify(gam.getAchievements(), null, 2) }] };
});
server.tool("get_flowdex", "Show your flow collection progress by category. Like a Pokedex but for AI flows.", {}, async () => {
    const gam = new GamificationEngine();
    return { content: [{ type: "text", text: JSON.stringify(gam.getSkilldex(), null, 2) }] };
});
server.tool("get_daily_quests", "Get today's 3 daily quests with completion status.", {}, async () => {
    const gam = new GamificationEngine();
    return { content: [{ type: "text", text: JSON.stringify(gam.getDailyQuests(), null, 2) }] };
});
server.tool("what_now", "Ask FlowFabric what you should do right now. Reads your L0 identity (name, role, goals, top domains), your flow run history across all L2 flow rooms, and your knowledge graph (facts extracted from previous flow outputs) to give personalized next-step recommendations. No searching required — context is already loaded.", {}, async () => {
    const velma = new VelmaRecommender(MARKETPLACE_DIR);
    const recs = velma.whatNow();
    return { content: [{ type: "text", text: JSON.stringify(recs, null, 2) }] };
});
// ===================================================================
// PROFILE TOOLS
// ===================================================================
server.tool("get_profile", "Get the user's FlowFabric profile (role, goals, tech stack, etc.).", {}, async () => {
    const profile = profileMgr.load();
    return { content: [{ type: "text", text: JSON.stringify(profile, null, 2) }] };
});
server.tool("get_recommendations", "Get personalized flow recommendations based on your profile.", {}, async () => {
    const skills = [...installedSkills().keys()];
    const skillRecs = profileMgr.suggestSkills(skills);
    const chainRecs = profileMgr.suggestChains();
    return { content: [{ type: "text", text: JSON.stringify({
                    flow_recommendations: skillRecs.slice(0, 15),
                    chain_recommendations: chainRecs,
                }, null, 2) }] };
});
// ===================================================================
// ON-CHAIN ACCESS STATUS
// ===================================================================
server.tool("get_access_status", "Check on-chain access status for a user and flow. Returns canAccess, isPremium, isPurchased, and dailyRemaining from the Marketplace contract.", {
    user_address: z.string().describe("The user's EVM wallet address (0x...)"),
    flow_name: z.string().describe("The flow name to check access for"),
}, async ({ user_address, flow_name }) => {
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
            args: [user_address, skillId],
        });
        return { content: [{ type: "text", text: JSON.stringify({
                        user_address,
                        flow_name,
                        skill_id: skillId,
                        can_access: canAccess,
                        is_premium: isPremium,
                        is_purchased: isPurchased,
                        daily_remaining: dailyRemaining.toString(),
                    }, null, 2) }] };
    }
    catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({
                        error: `Failed to check on-chain access: ${e.message}`,
                        user_address,
                        flow_name,
                    }, null, 2) }] };
    }
});
// ===================================================================
// FABRIC — MULTIPLAYER FLOW TOOLS
// ===================================================================
/**
 * Fabric API base URL. Defaults to the production deployment; can be
 * overridden via FABRIC_API_URL env var for local dev.
 */
function fabricApiUrl() {
    return (process.env.FABRIC_API_URL ?? "https://www.flowfabric.io").replace(/\/$/, "");
}
/**
 * POST a JSON body to a Fabric API endpoint.
 */
async function fabricPost(path, body) {
    const url = `${fabricApiUrl()}${path}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    }
    catch {
        return { raw: text, status: res.status };
    }
}
/**
 * GET a Fabric API endpoint.
 */
async function fabricGet(path) {
    const url = `${fabricApiUrl()}${path}`;
    const res = await fetch(url);
    const text = await res.text();
    try {
        return JSON.parse(text);
    }
    catch {
        return { raw: text, status: res.status };
    }
}
server.tool("create_fabric_session", "Start a new Fabric multiplayer session. Fabric lets two people — the host (you) and a guest (no account needed) — each fill out their side of a flow, then synthesizes both perspectives into a shared output. Returns a shareable guest URL and a secret hostToken you must keep.", {
    flow_slug: z.string().describe("The flow this session is based on (e.g. 'contract-scope-alignment')"),
    title: z.string().optional().describe("Human-readable title for the session"),
    host_data: z.string().default("{}").describe("Optional JSON of host's initial data to submit immediately"),
    shared_fields: z.string().default("[]").describe("JSON array of field names the host wants to share with the guest"),
}, async ({ flow_slug, title, host_data, shared_fields }) => {
    // 1. Create the session
    const created = await fabricPost("/api/fabric/create", {
        flowSlug: flow_slug,
        title: title ?? flow_slug,
    });
    if (created.error) {
        return { content: [{ type: "text", text: JSON.stringify({ error: created.error }) }] };
    }
    const sessionId = created.sessionId;
    const hostToken = created.hostToken;
    // 2. Optionally submit host data immediately if provided
    let hostSide = null;
    let parsedData = {};
    let parsedFields = [];
    try {
        parsedData = JSON.parse(host_data);
    }
    catch { /* ok */ }
    try {
        parsedFields = JSON.parse(shared_fields);
    }
    catch { /* ok */ }
    if (Object.keys(parsedData).length > 0) {
        hostSide = await fabricPost(`/api/fabric/${sessionId}/host`, {
            hostToken,
            data: parsedData,
            sharedFields: parsedFields,
        });
    }
    return { content: [{ type: "text", text: JSON.stringify({
                    session_id: sessionId,
                    guest_url: created.guestUrl,
                    host_token: hostToken,
                    expires_at: created.expiresAt,
                    host_submitted: hostSide?.host != null ? hostSide.host.submitted : false,
                    instructions: [
                        `1. Share this link with your guest: ${created.guestUrl}`,
                        "2. They fill out their side in the browser (no account needed).",
                        "3. Once they submit, call get_fabric_status to check progress.",
                        "4. When both sides are in, call submit_fabric_host_side (if you haven't yet), then get_fabric_status to read the synthesis prompt and run the flow.",
                    ].join("\n"),
                }, null, 2) }] };
});
server.tool("submit_fabric_host_side", "Submit the host's answers for a Fabric session. Call this after collecting the host's inputs for the shared flow. Requires the hostToken returned by create_fabric_session.", {
    session_id: z.string().describe("The Fabric session ID"),
    host_token: z.string().describe("The secret hostToken returned by create_fabric_session"),
    data: z.string().default("{}").describe("JSON object of the host's form data / answers"),
    shared_fields: z.string().default("[]").describe("JSON array of field names to share with the guest (the rest stay private)"),
}, async ({ session_id, host_token, data, shared_fields }) => {
    let parsedData = {};
    let parsedFields = [];
    try {
        parsedData = JSON.parse(data);
    }
    catch { /* ok */ }
    try {
        parsedFields = JSON.parse(shared_fields);
    }
    catch { /* ok */ }
    if (Object.keys(parsedData).length === 0) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "data must be a non-empty JSON object" }) }] };
    }
    const result = await fabricPost(`/api/fabric/${session_id}/host`, {
        hostToken: host_token,
        data: parsedData,
        sharedFields: parsedFields,
    });
    if (result.error) {
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
    const ready = result.readyForSynthesis;
    return { content: [{ type: "text", text: JSON.stringify({
                    ...result,
                    next_step: ready
                        ? `Both sides submitted! Call get_fabric_status('${session_id}', '${host_token}') to get the synthesis prompt and run the flow.`
                        : "Waiting for guest to submit their side. Call get_fabric_status to check.",
                }, null, 2) }] };
});
server.tool("get_fabric_status", "Check the status of a Fabric session. When both sides have submitted and synthesis hasn't run yet, automatically triggers server-side neutral synthesis using your ANTHROPIC_API_KEY environment variable. Returns the synthesis output when ready.", {
    session_id: z.string().describe("The Fabric session ID"),
    host_token: z.string().optional().describe("The secret hostToken returned by create_fabric_session — required to trigger synthesis"),
}, async ({ session_id, host_token }) => {
    // Get session state
    const session = await fabricGet(`/api/fabric/${session_id}`);
    if (session.error) {
        return { content: [{ type: "text", text: JSON.stringify(session) }] };
    }
    const hostSub = session.host?.submitted;
    const guestsSubmitted = session.guestsSubmitted ?? (session.guest?.submitted ? 1 : 0);
    const maxGuests = session.maxGuests ?? 1;
    const allGuestsIn = guestsSubmitted >= maxGuests;
    const synthStatus = session.synthesis?.status;
    const synthOutput = session.synthesis?.output ?? null;
    // Both sides ready and synthesis not yet run — trigger it automatically
    if (host_token && hostSub && allGuestsIn && synthStatus !== "complete") {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return { content: [{ type: "text", text: JSON.stringify({
                            session_id,
                            host_submitted: hostSub,
                            guests_submitted: guestsSubmitted,
                            synthesis_status: "pending",
                            error: "ANTHROPIC_API_KEY is not set in your environment. Set it and try again, or trigger synthesis from the web UI.",
                        }, null, 2) }] };
        }
        const synthResult = await fabricPost(`/api/fabric/${session_id}/synthesize`, {
            hostToken: host_token,
            apiKey,
        });
        if (synthResult.error) {
            return { content: [{ type: "text", text: JSON.stringify({ error: synthResult.error }) }] };
        }
        return { content: [{ type: "text", text: JSON.stringify({
                        ...synthResult,
                        message: "Synthesis complete. Both parties can now see the shared neutral analysis.",
                    }, null, 2) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify({
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
});
// ===================================================================
// HEALTH / META
// ===================================================================
server.tool("check_access", "Check if FlowFabric MCP server is running and accessible. Returns server status, tier, and marketplace stats.", {
    skill_name: z.string().default("").describe("Optional skill/flow name to check access for"),
}, async ({ skill_name }) => {
    const skills = installedSkills();
    const chains = availableChains();
    // Read tier from env var (injected via claude_desktop_config.json)
    // or from ~/.skillchain/config.json as fallback
    let tier = (process.env.SKILLCHAIN_TIER ?? "").toLowerCase().trim();
    let wallet = (process.env.SKILLCHAIN_WALLET ?? "").trim() || null;
    let configError = null;
    if (!tier || !wallet) {
        try {
            const cfgPath = join(homedir(), ".skillchain", "config.json");
            if (existsSync(cfgPath)) {
                const cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));
                if (!tier)
                    tier = (cfg.trust_tier ?? "").toLowerCase().trim();
                if (!wallet)
                    wallet = cfg.wallet_address?.trim() || null;
            }
        }
        catch { /* ignore */ }
    }
    if (!tier)
        tier = "free";
    if (!wallet) {
        configError = "No wallet configured. Add SKILLCHAIN_TIER and SKILLCHAIN_WALLET to your MCP env, or run 'skillchain init'.";
    }
    // Domain-based tier check for the requested skill
    const BUILDER_DOMAINS = new Set(["engineering", "ai"]);
    const CREATOR_DOMAINS = new Set(["legal", "meta"]);
    const tierLevel = (t) => {
        if (t === "creator" || t === "staker")
            return 2;
        if (t === "builder" || t === "holder")
            return 1;
        return 0;
    };
    let allowed = true;
    if (skill_name) {
        const manifest = loadManifest(skill_name);
        const domain = (String(manifest?.domain ?? "")).toLowerCase();
        const level = tierLevel(tier);
        if (CREATOR_DOMAINS.has(domain))
            allowed = level >= 2;
        else if (BUILDER_DOMAINS.has(domain))
            allowed = level >= 1;
    }
    return { content: [{ type: "text", text: JSON.stringify({
                    status: "ok",
                    server: "flowfabric-mcp",
                    version: "0.1.0",
                    runtime: "node",
                    tier,
                    wallet,
                    allowed,
                    error: configError,
                    flows_available: skills.size,
                    chains_available: chains.length,
                    marketplace_dir: MARKETPLACE_DIR,
                    marketplace_exists: existsSync(MARKETPLACE_DIR),
                }, null, 2) }] };
});
// ===================================================================
// COGNITIVE FABRIC — TKG + Communication layer
// ===================================================================
const TKG_PATH = join(homedir(), ".skillchain", "fabric", "tkg.json");
/** Load all active TKG assertions from disk. */
function loadTKG() {
    if (!existsSync(TKG_PATH))
        return [];
    try {
        const raw = JSON.parse(readFileSync(TKG_PATH, "utf-8"));
        return Array.isArray(raw) ? raw.filter((a) => a.status === "active") : [];
    }
    catch {
        return [];
    }
}
/** Append or update an assertion in the TKG JSON file. */
function writeTKGAssertion(assertion) {
    const dir = join(homedir(), ".skillchain", "fabric");
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    const existing = existsSync(TKG_PATH)
        ? JSON.parse(readFileSync(TKG_PATH, "utf-8"))
        : [];
    // Simple contradiction check: same subject+predicate → invalidate older lower-confidence entry
    const spKey = `${assertion.subject}\x00${assertion.predicate}`;
    let replaced = false;
    const updated = existing.map((a) => {
        if (a.status !== "active")
            return a;
        const aKey = `${a.subject}\x00${a.predicate}`;
        if (aKey === spKey && a.object !== assertion.object) {
            const existingConf = typeof a.confidence === "number" ? a.confidence : 0;
            const newConf = typeof assertion.confidence === "number" ? assertion.confidence : 0;
            if (newConf >= existingConf) {
                replaced = true;
                return { ...a, status: "invalidated_by_contradiction", invalidated_by: assertion.id };
            }
        }
        return a;
    });
    updated.push({ ...assertion, status: "active" });
    writeFileSync(TKG_PATH, JSON.stringify(updated, null, 2));
}
server.tool("tkg_query", "Query the Temporal Knowledge Graph for active assertions. Returns top results scored by confidence, importance, and recency.", {
    query_text: z.string().default("").describe("Natural language search term"),
    subject: z.string().default("").describe("Filter by subject ID"),
    predicate: z.string().default("").describe("Filter by predicate"),
    top_k: z.number().default(20).describe("Max results to return"),
    min_confidence: z.number().default(0).describe("Minimum confidence threshold 0-1"),
}, async ({ query_text, subject, predicate, top_k, min_confidence }) => {
    try {
        let assertions = loadTKG();
        if (subject)
            assertions = assertions.filter((a) => a.subject === subject);
        if (predicate)
            assertions = assertions.filter((a) => a.predicate === predicate);
        if (min_confidence > 0)
            assertions = assertions.filter((a) => a.confidence >= min_confidence);
        // Simple relevance scoring: text overlap + recency + confidence
        const now = Date.now();
        const scored = assertions.map((a) => {
            const text = `${a.subject} ${a.predicate} ${a.object}`.toLowerCase();
            const q = query_text.toLowerCase();
            const qTokens = q.split(/\s+/).filter(Boolean);
            const overlap = qTokens.length > 0
                ? qTokens.filter(t => text.includes(t)).length / qTokens.length
                : 1;
            const conf = typeof a.confidence === "number" ? a.confidence : 0.5;
            const importance = typeof a.importance === "number" ? a.importance : conf;
            const ageSec = a.valid_from ? (now - new Date(a.valid_from).getTime()) / 1000 : 86400;
            const recency = Math.exp(-ageSec / (7 * 86400));
            const score = 0.35 * conf + 0.30 * importance + 0.20 * recency + 0.15 * overlap;
            return { ...a, _score: Math.round(score * 1000) / 1000 };
        });
        scored.sort((a, b) => b._score - a._score);
        return { content: [{ type: "text", text: JSON.stringify(scored.slice(0, top_k), null, 2) }] };
    }
    catch (err) {
        return { content: [{ type: "text", text: JSON.stringify({ error: String(err) }) }] };
    }
});
server.tool("tkg_write", "Write an assertion to the Temporal Knowledge Graph. Runs contradiction detection automatically.", {
    subject: z.string().describe("Entity being described"),
    predicate: z.string().describe("Relationship type (e.g. asserts, has_state, completed)"),
    object: z.string().describe("Value or target of the assertion"),
    confidence: z.number().default(0.9).describe("Confidence 0-1"),
    source_agent: z.string().default("claude").describe("Asserting agent ID"),
}, async ({ subject, predicate, object, confidence, source_agent }) => {
    try {
        // randomUUID is imported at top level
        const assertion = {
            id: randomUUID(),
            subject, predicate, object, confidence,
            source_agent,
            derivation_kind: "observed",
            valid_from: new Date().toISOString(),
            valid_to: null,
            importance: confidence,
            created_at: new Date().toISOString(),
        };
        writeTKGAssertion(assertion);
        return { content: [{ type: "text", text: JSON.stringify({ written: assertion.id, subject, predicate, object }) }] };
    }
    catch (err) {
        return { content: [{ type: "text", text: JSON.stringify({ error: String(err) }) }] };
    }
});
server.tool("tkg_stats", "Get Temporal Knowledge Graph statistics: counts of active, invalidated, and expired assertions.", {}, async () => {
    try {
        const all = existsSync(TKG_PATH)
            ? JSON.parse(readFileSync(TKG_PATH, "utf-8"))
            : [];
        const stats = {
            total: all.length,
            active: all.filter((a) => a.status === "active").length,
            invalidated: all.filter((a) => String(a.status).startsWith("invalidated")).length,
            expired: all.filter((a) => a.status === "expired").length,
            subjects: new Set(all.map((a) => a.subject)).size,
        };
        return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
    }
    catch (err) {
        return { content: [{ type: "text", text: JSON.stringify({ error: String(err) }) }] };
    }
});
server.tool("send_agent_message", "Send a typed agent message (propose / challenge / confirm / ask / revise). Routes through the speech act dispatcher.", {
    act: z.enum(["ask", "answer", "propose", "challenge", "revise", "confirm", "reject", "delegate", "report", "abort"]),
    content_json: z.string().default("{}").describe("JSON payload"),
    sender_id: z.string().default("claude").describe("Sender agent ID"),
    receiver_id: z.string().default("").describe("Receiver agent ID (empty = broadcast)"),
    thread_id: z.string().default("").describe("Thread ID (empty = auto)"),
    reply_to: z.string().default("").describe("Message ID this replies to"),
}, async ({ act, content_json, sender_id, receiver_id, thread_id, reply_to }) => {
    try {
        // randomUUID is imported at top level
        const content = JSON.parse(content_json || "{}");
        const msg = {
            message_id: randomUUID(),
            act,
            sender_id,
            receiver_id: receiver_id || null,
            thread_id: thread_id || randomUUID(),
            reply_to: reply_to || null,
            content,
            created_at: new Date().toISOString(),
            protocol_version: "1.0",
        };
        // Persist dialogue thread to disk
        const dialoguePath = join(homedir(), ".skillchain", "fabric", "dialogue.json");
        const existing = existsSync(dialoguePath)
            ? JSON.parse(readFileSync(dialoguePath, "utf-8"))
            : {};
        const thread = existing[msg.thread_id] || { thread_id: msg.thread_id, messages: [], participants: [] };
        thread.messages.push(msg);
        if (!thread.participants.includes(sender_id)) {
            thread.participants.push(sender_id);
        }
        existing[msg.thread_id] = thread;
        writeFileSync(dialoguePath, JSON.stringify(existing, null, 2));
        return { content: [{ type: "text", text: JSON.stringify({ dispatched: act, message_id: msg.message_id, thread_id: msg.thread_id }) }] };
    }
    catch (err) {
        return { content: [{ type: "text", text: JSON.stringify({ error: String(err) }) }] };
    }
});
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
    if (!appDir)
        return; // not installed, skip silently
    const electronBin = join(appDir, "node_modules", ".bin", "electron");
    const electronExe = join(appDir, "node_modules", ".bin", "electron.cmd");
    const bin = existsSync(electronExe) ? electronExe : electronBin;
    if (!existsSync(bin))
        return;
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
process.stdin.on("end", () => { });
process.on("uncaughtException", (err) => {
    console.error("SkillChain uncaught:", err.message);
});
process.on("unhandledRejection", (err) => {
    console.error("SkillChain unhandled:", err);
});
main().catch(err => {
    console.error("SkillChain MCP server failed to start:", err);
    process.exit(1);
});
