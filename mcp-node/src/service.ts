/**
 * Service Layer — shared business logic for MCP tools, Discord bot, and webhooks.
 * ================================================================================
 * Extracts core operations from index.ts so they can be reused across interfaces.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";

import { SkillStateStore, type SkillRun } from "./skill-state.js";
import { ChainMatcher, type ChainMatch } from "./chain-matcher.js";
import { GamificationEngine } from "./gamification.js";
import { ProfileManager } from "./user-profile.js";
import { VelmaRecommender } from "./velma-recommender.js";
import { VelmaCompanion } from "./velma-companion.js";
import { buildManifestIndex } from "./manifest-index.js";
import { ChainComposer, type ComposedChain } from "./chain-composer.js";
import { MemoryStore } from "./memory-store.js";
import { KnowledgeGraph } from "./knowledge-graph.js";
import { extractFacts } from "./fact-extractor.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ServiceConfig {
  marketplaceDir: string;
  rpcUrl?: string;
}

export interface SkillInfo {
  name: string;
  domain: string;
  execution_pattern: string;
  description: string;
  tags: string[];
}

export interface ChainInfo {
  name: string;
  description: string;
  category: string;
  steps: number;
  skills: string[];
}

export interface RunInfo {
  run_id: string;
  skill_name: string;
  execution_pattern: string;
  started_at: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJsonParse(input: string): Record<string, unknown> {
  const parsed = JSON.parse(input, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
    return value;
  });
  return typeof parsed === 'object' && parsed !== null ? parsed : { raw: input };
}

/** Parse required and optional inputs from a skill.md ## Inputs section. */
function parseSkillInputs(skillMd: string): { required: Array<{name: string; desc: string}>; optional: Array<{name: string; desc: string}> } {
  const required: Array<{name: string; desc: string}> = [];
  const optional: Array<{name: string; desc: string}> = [];
  const section = skillMd.match(/## Inputs\n([\s\S]*?)(?=\n## |\n---)/);
  if (!section) return { required, optional };
  for (const line of section[1].split("\n")) {
    const m = line.match(/^-\s+`?(\w[\w-]*)`?:\s+\S[\S]*\s+--\s+(.+)/);
    if (!m) continue;
    const [, name, desc] = m;
    const isOptional = /\(optional\)/i.test(desc);
    if (isOptional) {
      optional.push({ name, desc: desc.replace(/\(optional\)\s*/i, "").trim() });
    } else {
      required.push({ name, desc });
    }
  }
  return { required, optional };
}

/** Text-readable file extensions */
const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".markdown", ".csv", ".json", ".yaml", ".yml",
  ".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".rs",
  ".html", ".htm", ".xml", ".toml", ".ini", ".cfg", ".conf",
  ".log",
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

function scanDirectory(dir: string, depth = 0, maxDepth = 2): string[] {
  if (depth > maxDepth || !existsSync(dir)) return [];
  const paths: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory() && depth < maxDepth) {
        paths.push(...scanDirectory(full, depth + 1, maxDepth));
      } else if (entry.isFile()) {
        paths.push(full);
      }
    }
  } catch { /* permission denied etc */ }
  return paths;
}

function extractKeywords(text: string, topN = 30): string[] {
  const freq = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    const word = raw.replace(/^'+|'+$/g, "");
    if (word.length < 3 || DIR_STOPWORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}

// ---------------------------------------------------------------------------
// TKG file helpers
// ---------------------------------------------------------------------------

const TKG_PATH = join(homedir(), ".skillchain", "fabric", "tkg.json");

function loadTKG(): Record<string, unknown>[] {
  if (!existsSync(TKG_PATH)) return [];
  try {
    const raw = JSON.parse(readFileSync(TKG_PATH, "utf-8")) as Record<string, unknown>[];
    return Array.isArray(raw) ? raw.filter((a: Record<string, unknown>) => a.status === "active") : [];
  } catch { return []; }
}

function writeTKGAssertion(assertion: Record<string, unknown>): void {
  const dir = join(homedir(), ".skillchain", "fabric");
  if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
  const existing = existsSync(TKG_PATH)
    ? JSON.parse(readFileSync(TKG_PATH, "utf-8")) as Record<string, unknown>[]
    : [];

  const spKey = `${assertion.subject}\x00${assertion.predicate}`;
  const updated = existing.map((a: Record<string, unknown>) => {
    if (a.status !== "active") return a;
    const aKey = `${a.subject}\x00${a.predicate}`;
    if (aKey === spKey && a.object !== assertion.object) {
      const existingConf = typeof a.confidence === "number" ? a.confidence : 0;
      const newConf = typeof assertion.confidence === "number" ? assertion.confidence : 0;
      if (newConf >= existingConf) {
        return { ...a, status: "invalidated_by_contradiction", invalidated_by: assertion.id };
      }
    }
    return a;
  });

  updated.push({ ...assertion, status: "active" });
  writeFileSync(TKG_PATH, JSON.stringify(updated, null, 2));
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class SkillChainService {
  private store: SkillStateStore;
  private profileMgr: ProfileManager;
  private memory: MemoryStore;
  private kg: KnowledgeGraph;
  private marketplaceDir: string;
  private activeRuns = new Map<string, SkillRun>();

  constructor(config: ServiceConfig) {
    this.marketplaceDir = config.marketplaceDir;
    this.store = new SkillStateStore();
    this.profileMgr = new ProfileManager();
    this.memory = new MemoryStore();
    this.kg = new KnowledgeGraph(undefined, config.rpcUrl);
  }

  // -----------------------------------------------------------------------
  // Skills
  // -----------------------------------------------------------------------

  listSkills(): SkillInfo[] {
    const skills = this.installedSkills();
    return [...skills.keys()].sort().map(name => {
      const manifest = this.loadManifest(name);
      return {
        name,
        domain: (manifest.domain as string) ?? "general",
        execution_pattern: (manifest.execution_pattern as string) ?? "",
        description: (manifest.description as string) ?? "",
        tags: (manifest.tags as string[]) ?? [],
      };
    });
  }

  getSkillContent(skillName: string): string | null {
    const skills = this.installedSkills();
    const path = skills.get(skillName);
    if (path && existsSync(path)) {
      return readFileSync(path, "utf-8");
    }
    return null;
  }

  // -----------------------------------------------------------------------
  // Chains
  // -----------------------------------------------------------------------

  listChains(): ChainInfo[] {
    return this.availableChains().map(c => ({
      name: (c.name as string) ?? "",
      description: (c.description as string) ?? "",
      category: (c.category as string) ?? "",
      steps: ((c.steps as unknown[]) ?? []).length,
      skills: ((c.steps as Array<Record<string, string>>) ?? []).map(s => s.skill_name),
    }));
  }

  searchChains(query: string, maxResults: number = 5): ChainMatch[] {
    const chains = this.availableChains();
    const matcher = new ChainMatcher(
      chains as Array<{ name: string; description?: string; category?: string; steps?: Array<{ skill_name: string; alias?: string }> }>
    );
    return matcher.match(query, maxResults);
  }

  composeChain(query: string, maxSkills: number = 5, minConfidence: number = 0.4): ComposedChain {
    const manifestIdx = buildManifestIndex(this.marketplaceDir);
    const composer = new ChainComposer(manifestIdx);
    const chains = this.availableChains() as Array<{ name: string; description?: string; category?: string; steps?: Array<{ skill_name: string; alias?: string }> }>;
    return composer.compose(query, maxSkills, minConfidence, chains);
  }

  // -----------------------------------------------------------------------
  // Execution
  // -----------------------------------------------------------------------

  startRun(skillName: string, executionPattern: string = "orpa"): RunInfo {
    const run = this.store.startRun(skillName, executionPattern);
    const runId = randomUUID().slice(0, 16);
    this.activeRuns.set(runId, run);
    return {
      run_id: runId,
      skill_name: skillName,
      execution_pattern: executionPattern,
      started_at: run.started_at,
      status: "in_progress",
    };
  }

  completeRun(runId: string, status: string = "completed"): { success: boolean; error?: string; flow_name?: string; completed_at?: string; phases_completed?: number; facts_extracted?: number } {
    const run = this.activeRuns.get(runId);
    if (!run) return { success: false, error: `Run '${runId}' not found` };

    this.store.completeRun(run, status);
    try { this.profileMgr.updateUsage(run.skill_name); } catch { /* */ }
    try { new GamificationEngine().recordSkillRun(run.skill_name); } catch { /* */ }
    try { new VelmaCompanion().witnessFlow(run.skill_name); } catch { /* */ }

    // Memory: extract facts from phase outputs and store to L1/L2
    let factsExtracted = 0;
    try {
      const keyOutputs: string[] = [];
      for (const phase of run.phases) {
        if (phase.output && Object.keys(phase.output).length > 0) {
          const facts = extractFacts(phase.output, run.skill_name);
          for (const fact of facts) {
            if (fact.importance >= 0.7) {
              this.memory.rememberFact(fact.content, fact.tags, run.skill_name, fact.importance);
            } else {
              this.memory.addInsight(run.skill_name, fact.content, fact.tags, fact.importance);
            }
            factsExtracted++;
          }
          const outputKeys = Object.keys(phase.output).filter(
            k => typeof phase.output[k] === "string" && (phase.output[k] as string).length > 10
          );
          keyOutputs.push(...outputKeys.slice(0, 2));
        }
      }
      this.memory.recordRunToRoom(run.skill_name, runId, run.phases.length, keyOutputs);
    } catch { /* memory extraction is best-effort */ }

    // Extract knowledge graph triples from phase outputs (fire-and-forget)
    for (const phase of run.phases) {
      if (phase.output && Object.keys(phase.output).length > 0) {
        try { this.kg.extractFromOutput(phase.output, run.skill_name, runId).catch(() => {}); } catch { /* */ }
      }
    }

    const result = {
      success: true,
      flow_name: run.skill_name,
      completed_at: run.completed_at,
      phases_completed: run.phases.length,
      facts_extracted: factsExtracted,
    };
    this.activeRuns.delete(runId);
    return result;
  }

  // -----------------------------------------------------------------------
  // Data persistence pass-through
  // -----------------------------------------------------------------------

  saveData(flowName: string, key: string, data: unknown): void {
    this.store.saveData(flowName, key, data);
  }

  loadData(flowName: string, key: string): unknown {
    return this.store.loadData(flowName, key);
  }

  getRunHistory(flowName: string, limit: number): unknown[] {
    return this.store.getRunHistory(flowName, limit);
  }

  recordPhase(runId: string, phase: string, status: string, output: Record<string, unknown>): { success: boolean; error?: string; timestamp?: string; total_phases?: number } {
    const run = this.activeRuns.get(runId);
    if (!run) return { success: false, error: `Run '${runId}' not found.` };
    const result = this.store.recordPhase(run, phase, status, output);
    return { success: true, timestamp: result.timestamp, total_phases: run.phases.length };
  }

  startRunWithMemory(flowName: string, executionPattern: string = "orpa"): RunInfo & { memory_context: Record<string, unknown> } {
    const info = this.startRun(flowName, executionPattern);

    let memoryContext: Record<string, unknown> = {};
    try {
      const ctx = this.memory.getContext();
      const room = this.memory.getSkillRoom(flowName);
      memoryContext = {
        identity_summary: ctx.identity.summary || undefined,
        relevant_facts: ctx.facts.slice(0, 5).map(f => f.content),
        flow_room: room.run_summaries.length > 0 ? {
          previous_runs: room.run_summaries.length,
          last_run: room.run_summaries[room.run_summaries.length - 1]?.date,
          recent_insights: room.insights.slice(0, 3).map(i => i.content),
        } : undefined,
      };
    } catch { /* memory not initialized yet */ }

    return { ...info, memory_context: memoryContext };
  }

  // -----------------------------------------------------------------------
  // Find & Run (extraction #2)
  // -----------------------------------------------------------------------

  async handleFindAndRun(params: { query: string; auto_run: boolean; initial_context: string }): Promise<Record<string, unknown>> {
    const allFlows = this.allFlowsForSearch();
    const matcher = new ChainMatcher(allFlows as Array<{ name: string; description?: string; category?: string; steps?: Array<{ skill_name: string; alias?: string }> }>);
    const matches = matcher.match(params.query, 5);

    if (matches.length === 0) {
      return { error: "No flows match your query.", query: params.query };
    }

    const best = matches[0];
    const resultData: Record<string, unknown> = {
      query: params.query,
      best_match: best,
      other_matches: matches.slice(1),
    };

    if (params.auto_run) {
      const flowData = allFlows.find(c => (c as Record<string, unknown>).name === best.chain_name);
      if (flowData) {
        const steps = ((flowData as Record<string, unknown>).steps as Array<Record<string, string>>) ?? [];
        let ctx: Record<string, unknown>;
        try { ctx = safeJsonParse(params.initial_context); } catch { ctx = {}; }
        const isStandalone = (flowData as Record<string, unknown>).flow_type === "standalone_skill";
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

        try { this.profileMgr.updateChainUsage(best.chain_name); } catch { /* */ }
        try {
          const gam = new GamificationEngine();
          gam.recordChainRun(best.chain_name, steps.length, 0);
        } catch { /* */ }
        try { new VelmaCompanion().witnessChain(best.chain_name); } catch { /* */ }
      }
    }

    return resultData;
  }

  // -----------------------------------------------------------------------
  // Run Flow (extraction #3)
  // -----------------------------------------------------------------------

  async handleRunFlow(params: { flow_name: string; initial_context: string }): Promise<Record<string, unknown>> {
    const chains = this.availableChains();
    const chainData = chains.find(c => (c as Record<string, unknown>).name === params.flow_name);

    let ctx: Record<string, unknown>;
    try { ctx = safeJsonParse(params.initial_context); } catch { ctx = {}; }

    // Chain flow
    if (chainData) {
      const steps = ((chainData as Record<string, unknown>).steps as Array<Record<string, string>>) ?? [];
      const result: Record<string, unknown> = {
        flow_name: params.flow_name,
        status: "ready",
        steps: steps.map(s => ({
          flow_step: s.skill_name,
          alias: s.alias ?? s.skill_name,
          depends_on: (s as Record<string, unknown>).depends_on ?? [],
        })),
        initial_context: ctx,
        instructions: "Use preview_flow to show the user the plan, then run_flow_step to execute one step at a time with human approval between steps.",
      };

      try { this.profileMgr.updateChainUsage(params.flow_name); } catch { /* */ }
      try {
        const gam = new GamificationEngine();
        gam.recordChainRun(params.flow_name, steps.length, 0);
      } catch { /* */ }
      try { new VelmaCompanion().witnessChain(params.flow_name); } catch { /* */ }

      return result;
    }

    // Standalone skill
    const skillMap = this.installedSkills();
    const skillPath = skillMap.get(params.flow_name);
    if (skillPath && existsSync(skillPath)) {
      const manifest = this.loadManifest(params.flow_name);
      const skillContent = readFileSync(skillPath, "utf-8");
      const { required: requiredInputs, optional: optionalInputs } = parseSkillInputs(skillContent);
      const alreadyProvided = Object.keys(ctx);
      const missingRequired = requiredInputs.filter(i => !alreadyProvided.includes(i.name));

      const intakeBlock = missingRequired.length > 0
        ? `COLLECT INPUTS FIRST — Ask the user for the following before executing:\n${missingRequired.map(i => `  • ${i.name}: ${i.desc}`).join("\n")}${optionalInputs.length > 0 ? `\n\nAlso ask (optional):\n${optionalInputs.map(i => `  • ${i.name}: ${i.desc}`).join("\n")}` : ""}\n\nThen execute the skill once inputs are collected.`
        : "All inputs provided. Execute the skill using the skill_definition below.";

      try { this.profileMgr.updateUsage(params.flow_name); } catch { /* */ }
      try {
        const gam = new GamificationEngine();
        gam.recordSkillRun(params.flow_name);
      } catch { /* */ }
      try { new VelmaCompanion().witnessFlow(params.flow_name); } catch { /* */ }

      return {
        flow_name: params.flow_name,
        flow_type: "standalone_skill",
        execution_pattern: manifest.execution_pattern ?? "phase_pipeline",
        description: manifest.description ?? "",
        required_inputs: requiredInputs,
        optional_inputs: optionalInputs,
        inputs_provided: ctx,
        skill_definition: skillContent,
        instructions: intakeBlock,
      };
    }

    return {
      error: `Flow '${params.flow_name}' not found.`,
      tip: "Use list_flows to see all available flows, or search_flows to find by description.",
    };
  }

  // -----------------------------------------------------------------------
  // Run Flow Step (extraction #4)
  // -----------------------------------------------------------------------

  async handleRunFlowStep(params: { flow_name: string; step_index: number; context: string }): Promise<Record<string, unknown>> {
    type ChainData = Record<string, unknown>;
    type StepData = { skill_name: string; alias?: string; depends_on?: string[] };

    const chains = this.availableChains();
    const chainData = chains.find(c => (c as ChainData).name === params.flow_name) as ChainData | undefined;
    if (!chainData) {
      return { error: `Flow '${params.flow_name}' not found.` };
    }

    const steps = ((chainData.steps as StepData[]) ?? []);
    if (params.step_index < 0 || params.step_index >= steps.length) {
      return {
        error: `step_index ${params.step_index} out of range (flow has ${steps.length} steps).`,
        total_steps: steps.length,
      };
    }

    const step = steps[params.step_index];
    const skillName = step.skill_name;

    let ctx: Record<string, unknown>;
    try { ctx = safeJsonParse(params.context); } catch { ctx = {}; }

    const skillMap = this.installedSkills();
    const skillPath = skillMap.get(skillName);
    let skillContent: string | null = null;
    if (skillPath && existsSync(skillPath)) {
      skillContent = readFileSync(skillPath, "utf-8");
    }

    const isLast = params.step_index === steps.length - 1;
    const nextStep = isLast ? null : {
      step_index: params.step_index + 1,
      skill: steps[params.step_index + 1].skill_name,
      alias: steps[params.step_index + 1].alias ?? steps[params.step_index + 1].skill_name,
    };

    const { required: requiredInputs, optional: optionalInputs } = skillContent
      ? parseSkillInputs(skillContent)
      : { required: [] as Array<{name: string; desc: string}>, optional: [] as Array<{name: string; desc: string}> };

    const alreadyProvided = Object.keys(ctx);
    const missingRequired = requiredInputs.filter(i => !alreadyProvided.includes(i.name));

    const intakeBlock = missingRequired.length > 0
      ? `STEP 1 — COLLECT INPUTS FIRST (do not skip):\nAsk the user for the following before executing any phases:\n${missingRequired.map(i => `  • ${i.name}: ${i.desc}`).join("\n")}${optionalInputs.length > 0 ? `\n\nAlso ask (optional, but improves results):\n${optionalInputs.map(i => `  • ${i.name}: ${i.desc}`).join("\n")}` : ""}\n\nSTEP 2 — EXECUTE once inputs are collected:\n`
      : "";

    const continueMsg = isLast
      ? "All done! Flow pipeline complete."
      : `Step ${params.step_index + 1} complete. Show the full output above, then ask: 'Ready for step ${params.step_index + 2} (${nextStep?.skill ?? ""})?' Call run_flow_step with step_index=${params.step_index + 1} to continue.`;

    // Track in gamification
    try {
      const gam = new GamificationEngine();
      gam.recordSkillRun(skillName);
      if (isLast) gam.recordChainRun(params.flow_name, steps.length, 0);
    } catch { /* */ }
    try {
      const velma = new VelmaCompanion();
      velma.witnessFlow(skillName);
      if (isLast) velma.witnessChain(params.flow_name);
    } catch { /* */ }

    return {
      flow_pipeline: params.flow_name,
      step: params.step_index + 1,
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
    };
  }

  // -----------------------------------------------------------------------
  // Preview Flow (extraction #6)
  // -----------------------------------------------------------------------

  handlePreviewFlow(params: { flow_name: string; query: string }): Record<string, unknown> {
    type ChainData = Record<string, unknown>;
    type StepData = { skill_name: string; alias?: string; depends_on?: string[] };

    const chains = this.availableChains();
    let chainData: ChainData | undefined;

    if (params.flow_name) {
      chainData = chains.find(c => (c as ChainData).name === params.flow_name) as ChainData | undefined;
    } else if (params.query) {
      const matcher = new ChainMatcher(chains as Array<{ name: string; description?: string; category?: string; steps?: StepData[] }>);
      const matches = matcher.match(params.query, 1);
      if (matches.length > 0) {
        chainData = chains.find(c => (c as ChainData).name === matches[0].chain_name) as ChainData | undefined;
      }
    }

    if (!chainData) {
      return {
        error: `Flow '${params.flow_name || params.query}' not found.`,
        available: chains.slice(0, 10).map(c => (c as ChainData).name),
      };
    }

    const steps = ((chainData.steps as StepData[]) ?? []);
    const stepPreviews = steps.map((step, i) => {
      const manifest = this.loadManifest(step.skill_name);
      return {
        step: i + 1,
        flow: step.skill_name,
        alias: step.alias ?? step.skill_name,
        description: (manifest as Record<string, string>).description ?? "",
        depends_on: step.depends_on ?? [],
      };
    });

    return {
      flow_pipeline: chainData.name,
      description: chainData.description ?? "",
      category: chainData.category ?? "",
      total_steps: steps.length,
      steps: stepPreviews,
      approval_required: true,
      instructions: "Show this plan to the user. Ask: 'Ready to run? I'll execute each flow one at a time and show you the output before continuing.' If approved, use run_flow_step to execute step by step.",
    };
  }

  // -----------------------------------------------------------------------
  // Analyze Directory (extraction #1 — largest)
  // -----------------------------------------------------------------------

  handleAnalyzeDirectory(params: { directory: string; max_files: number; max_depth: number; read_content: boolean }): Record<string, unknown> {
    type StepData = { skill_name: string; alias?: string };

    if (!existsSync(params.directory)) {
      return { error: `Directory not found: ${params.directory}` };
    }

    // Scan files
    const allPaths = scanDirectory(params.directory, 0, params.max_depth).slice(0, params.max_files * 3);
    const inventory: Array<{ path: string; name: string; ext: string; readable: boolean; binary: boolean }> = [];

    for (const p of allPaths) {
      const name = p.split(/[\\/]/).pop() ?? p;
      const ext = name.includes(".") ? "." + name.split(".").pop()!.toLowerCase() : "";
      inventory.push({
        path: p,
        name,
        ext,
        readable: TEXT_EXTENSIONS.has(ext),
        binary: DOC_EXTENSIONS.has(ext),
      });
    }

    // Read content from text files
    const contentChunks: string[] = [];
    let filesRead = 0;
    const filesSummary: Array<{ name: string; ext: string; size_bytes: number; excerpt?: string }> = [];

    for (const f of inventory) {
      if (filesRead >= params.max_files) break;

      if (f.readable && params.read_content) {
        try {
          const raw = readFileSync(f.path, "utf-8").slice(0, 3000);
          contentChunks.push(f.name + " " + raw);
          filesSummary.push({ name: f.name, ext: f.ext, size_bytes: raw.length, excerpt: raw.slice(0, 120).replace(/\n/g, " ") });
          filesRead++;
        } catch { /* skip unreadable */ }
      } else {
        contentChunks.push(f.name.replace(/[._-]/g, " "));
        filesSummary.push({ name: f.name, ext: f.ext, size_bytes: 0 });
        filesRead++;
      }
    }

    // Extract keywords from all content
    const allText = contentChunks.join(" ");
    const keywords = extractKeywords(allText, 40);

    // Detect domain signals from extensions
    const extCounts: Record<string, number> = {};
    for (const f of inventory) {
      extCounts[f.ext] = (extCounts[f.ext] ?? 0) + 1;
    }

    const domainSignals: string[] = [];
    const codeExts = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".rb"]);
    const dataExts = new Set([".csv", ".xlsx", ".xls", ".json"]);
    const docExts = new Set([".pdf", ".docx", ".doc"]);

    if (Object.keys(extCounts).some(e => codeExts.has(e))) domainSignals.push("code programming software development");
    if (Object.keys(extCounts).some(e => dataExts.has(e))) domainSignals.push("data analysis spreadsheet");
    if (Object.keys(extCounts).some(e => docExts.has(e))) domainSignals.push("documents reports");
    if (allText.match(/invoice|receipt|expense|budget|revenue|profit|loss/i)) domainSignals.push("finance budget money");
    if (allText.match(/resume|cv|cover letter|job|hiring|candidate/i)) domainSignals.push("resume job career hiring");
    if (allText.match(/marketing|seo|content|social media|campaign|funnel/i)) domainSignals.push("marketing content social media");
    if (allText.match(/customer|client|crm|lead|prospect|sales/i)) domainSignals.push("customer sales crm");
    if (allText.match(/contract|legal|agreement|terms|compliance|patent/i)) domainSignals.push("legal contract compliance");
    if (allText.match(/health|medical|patient|clinical|symptom|medication/i)) domainSignals.push("health medical");
    if (allText.match(/research|literature|paper|study|hypothesis|methodology/i)) domainSignals.push("research synthesis analysis");

    const matchQuery = [...keywords.slice(0, 20), ...domainSignals].join(" ");

    // Run chain matcher
    const chains = this.availableChains();
    const matcher = new ChainMatcher(
      chains as Array<{ name: string; description?: string; category?: string; steps?: StepData[] }>
    );
    const matches = matcher.match(matchQuery, 8);

    // Build suggestions tied to what was found
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
    return {
      onboarding_message: "Here's what I found in your files and the flows I'd recommend based on them.",
      directory: params.directory,
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
    };
  }

  // -----------------------------------------------------------------------
  // Check Access (extraction #7)
  // -----------------------------------------------------------------------

  handleCheckAccess(params: { skill_name: string }): Record<string, unknown> {
    const skills = this.installedSkills();
    const chains = this.availableChains();

    let tier = (process.env.SKILLCHAIN_TIER ?? "").toLowerCase().trim();
    let wallet = (process.env.SKILLCHAIN_WALLET ?? "").trim() || null;
    let configError: string | null = null;

    if (!tier || !wallet) {
      try {
        const cfgPath = join(homedir(), ".skillchain", "config.json");
        if (existsSync(cfgPath)) {
          const cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));
          if (!tier) tier = (cfg.trust_tier ?? "").toLowerCase().trim();
          if (!wallet) wallet = cfg.wallet_address?.trim() || null;
        }
      } catch { /* ignore */ }
    }

    if (!tier) tier = "free";
    if (!wallet) {
      configError = "No wallet configured. Add SKILLCHAIN_TIER and SKILLCHAIN_WALLET to your MCP env, or run 'skillchain init'.";
    }

    const BUILDER_DOMAINS = new Set(["engineering", "ai"]);
    const CREATOR_DOMAINS = new Set(["legal", "meta"]);
    const tierLevel = (t: string) => {
      if (t === "creator" || t === "staker") return 2;
      if (t === "builder" || t === "holder") return 1;
      return 0;
    };

    let allowed = true;
    if (params.skill_name) {
      const manifest = this.loadManifest(params.skill_name);
      const domain = (String(manifest?.domain ?? "")).toLowerCase();
      const level = tierLevel(tier);
      if (CREATOR_DOMAINS.has(domain)) allowed = level >= 2;
      else if (BUILDER_DOMAINS.has(domain)) allowed = level >= 1;
    }

    return {
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
      marketplace_dir: this.marketplaceDir,
      marketplace_exists: existsSync(this.marketplaceDir),
    };
  }

  // -----------------------------------------------------------------------
  // TKG Query (extraction #8)
  // -----------------------------------------------------------------------

  handleTkgQuery(params: { query_text: string; subject: string; predicate: string; top_k: number; min_confidence: number }): Record<string, unknown> {
    try {
      let assertions = loadTKG();
      if (params.subject) assertions = assertions.filter((a: Record<string, unknown>) => a.subject === params.subject);
      if (params.predicate) assertions = assertions.filter((a: Record<string, unknown>) => a.predicate === params.predicate);
      if (params.min_confidence > 0) assertions = assertions.filter((a: Record<string, unknown>) => (a.confidence as number) >= params.min_confidence);

      const now = Date.now();
      const scored = assertions.map((a: Record<string, unknown>) => {
        const text = `${a.subject} ${a.predicate} ${a.object}`.toLowerCase();
        const q = params.query_text.toLowerCase();
        const qTokens = q.split(/\s+/).filter(Boolean);
        const overlap = qTokens.length > 0
          ? qTokens.filter(t => text.includes(t)).length / qTokens.length
          : 1;
        const conf = typeof a.confidence === "number" ? a.confidence : 0.5;
        const importance = typeof a.importance === "number" ? a.importance : conf;
        const ageSec = a.valid_from ? (now - new Date(a.valid_from as string).getTime()) / 1000 : 86400;
        const recency = Math.exp(-ageSec / (7 * 86400));
        const score = 0.35 * conf + 0.30 * importance + 0.20 * recency + 0.15 * overlap;
        return { ...a, _score: Math.round(score * 1000) / 1000 };
      });
      scored.sort((a, b) => (b._score as number) - (a._score as number));

      return { results: scored.slice(0, params.top_k) };
    } catch (err) {
      return { error: String(err) };
    }
  }

  // -----------------------------------------------------------------------
  // TKG Write (extraction — part of #8 group)
  // -----------------------------------------------------------------------

  handleTkgWrite(params: { subject: string; predicate: string; object: string; confidence: number; source_agent: string }): Record<string, unknown> {
    try {
      const assertion = {
        id: randomUUID(),
        subject: params.subject,
        predicate: params.predicate,
        object: params.object,
        confidence: params.confidence,
        source_agent: params.source_agent,
        derivation_kind: "observed",
        valid_from: new Date().toISOString(),
        valid_to: null,
        importance: params.confidence,
        created_at: new Date().toISOString(),
      };
      writeTKGAssertion(assertion);
      return { written: assertion.id, subject: params.subject, predicate: params.predicate, object: params.object };
    } catch (err) {
      return { error: String(err) };
    }
  }

  // -----------------------------------------------------------------------
  // TKG Stats (extraction — part of #8 group)
  // -----------------------------------------------------------------------

  handleTkgStats(): Record<string, unknown> {
    try {
      const all = existsSync(TKG_PATH)
        ? JSON.parse(readFileSync(TKG_PATH, "utf-8")) as Record<string, unknown>[]
        : [];
      return {
        total: all.length,
        active: all.filter((a: Record<string, unknown>) => a.status === "active").length,
        invalidated: all.filter((a: Record<string, unknown>) => String(a.status).startsWith("invalidated")).length,
        expired: all.filter((a: Record<string, unknown>) => a.status === "expired").length,
        subjects: new Set(all.map((a: Record<string, unknown>) => a.subject)).size,
      };
    } catch (err) {
      return { error: String(err) };
    }
  }

  // -----------------------------------------------------------------------
  // Send Agent Message (extraction #9)
  // -----------------------------------------------------------------------

  handleSendAgentMessage(params: {
    act: string; content_json: string; sender_id: string;
    receiver_id: string; thread_id: string; reply_to: string;
  }): Record<string, unknown> {
    try {
      const content = JSON.parse(params.content_json || "{}");
      const msg = {
        message_id: randomUUID(),
        act: params.act,
        sender_id: params.sender_id,
        receiver_id: params.receiver_id || null,
        thread_id: params.thread_id || randomUUID(),
        reply_to: params.reply_to || null,
        content,
        created_at: new Date().toISOString(),
        protocol_version: "1.0",
      };

      const dialoguePath = join(homedir(), ".skillchain", "fabric", "dialogue.json");
      const dir = join(homedir(), ".skillchain", "fabric");
      if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
      const existing = existsSync(dialoguePath)
        ? JSON.parse(readFileSync(dialoguePath, "utf-8")) as Record<string, unknown>
        : {};
      const thread = (existing[msg.thread_id] as Record<string, unknown>) || { thread_id: msg.thread_id, messages: [], participants: [] };
      (thread.messages as unknown[]).push(msg);
      if (!(thread.participants as string[]).includes(params.sender_id)) {
        (thread.participants as string[]).push(params.sender_id);
      }
      existing[msg.thread_id] = thread;
      writeFileSync(dialoguePath, JSON.stringify(existing, null, 2));

      return { dispatched: params.act, message_id: msg.message_id, thread_id: msg.thread_id };
    } catch (err) {
      return { error: String(err) };
    }
  }

  // -----------------------------------------------------------------------
  // Discover Flows (inline search handler)
  // -----------------------------------------------------------------------

  discoverFlows(domain: string, maxResults: number): Array<Record<string, unknown>> {
    const skills = this.installedSkills();
    const results: Array<Record<string, unknown>> = [];
    for (const name of [...skills.keys()].sort()) {
      const manifest = this.loadManifest(name);
      const skillDomain = (manifest.domain as string) ?? "general";
      if (domain) {
        const dl = domain.toLowerCase();
        const tags = ((manifest.tags as string[]) ?? []).map(t => t.toLowerCase());
        if (!skillDomain.toLowerCase().includes(dl) && !name.toLowerCase().includes(dl) && !tags.some(t => t.includes(dl))) {
          continue;
        }
      }
      results.push({ name, domain: skillDomain, description: manifest.description ?? "", tags: manifest.tags ?? [], execution_pattern: manifest.execution_pattern ?? "" });
      if (results.length >= maxResults) break;
    }
    return results;
  }

  // -----------------------------------------------------------------------
  // Search Flows (uses allFlowsForSearch)
  // -----------------------------------------------------------------------

  searchFlows(query: string, maxResults: number = 5): ChainMatch[] {
    const allFlows = this.allFlowsForSearch();
    const matcher = new ChainMatcher(allFlows as Array<{ name: string; description?: string; category?: string; steps?: Array<{ skill_name: string; alias?: string }> }>);
    return matcher.match(query, maxResults);
  }

  // -----------------------------------------------------------------------
  // Get Recommendations
  // -----------------------------------------------------------------------

  getRecommendations(): Record<string, unknown> {
    const skills = [...this.installedSkills().keys()];
    const skillRecs = this.profileMgr.suggestSkills(skills);
    const chainRecs = this.profileMgr.suggestChains();
    return {
      flow_recommendations: skillRecs.slice(0, 15),
      chain_recommendations: chainRecs,
    };
  }

  // -----------------------------------------------------------------------
  // Gamification
  // -----------------------------------------------------------------------

  getTrainerCard(): Record<string, unknown> {
    return new GamificationEngine().getTrainerCard();
  }

  // -----------------------------------------------------------------------
  // Velma
  // -----------------------------------------------------------------------

  whatNow(): Array<{ chain_name: string; reason: string; priority: number; category: string; nudge: string }> {
    const velma = new VelmaRecommender(this.marketplaceDir);
    return velma.whatNow();
  }

  // -----------------------------------------------------------------------
  // Memory — expose for MCP tools
  // -----------------------------------------------------------------------

  recall(query: string, maxResults: number = 10, flowFilter?: string): unknown[] {
    return this.memory.recall(query, maxResults, flowFilter);
  }

  getMemory(): MemoryStore { return this.memory; }
  getKg(): KnowledgeGraph { return this.kg; }
  getProfileMgr(): ProfileManager { return this.profileMgr; }

  // -----------------------------------------------------------------------
  // Helpers (private)
  // -----------------------------------------------------------------------

  private installedSkills(): Map<string, string> {
    const skills = new Map<string, string>();
    const dirs = [
      join(homedir(), ".claude", "skills"),
      join(homedir(), ".skillchain", "skills"),
    ];
    for (const dir of dirs) {
      if (existsSync(dir)) {
        for (const f of readdirSync(dir)) {
          if (f.endsWith(".md")) skills.set(f.replace(/\.md$/, ""), join(dir, f));
        }
      }
    }
    if (existsSync(this.marketplaceDir)) {
      for (const d of readdirSync(this.marketplaceDir)) {
        const skillMd = join(this.marketplaceDir, d, "skill.md");
        if (existsSync(skillMd)) skills.set(d, skillMd);
      }
    }
    return skills;
  }

  private loadManifest(skillName: string): Record<string, unknown> {
    const mkt = join(this.marketplaceDir, skillName, "manifest.json");
    if (existsSync(mkt)) {
      try { return JSON.parse(readFileSync(mkt, "utf-8")); } catch { /* */ }
    }
    return { name: skillName };
  }

  private availableChains(): Array<Record<string, unknown>> {
    const chainsDir = join(this.marketplaceDir, "chains");
    if (!existsSync(chainsDir)) return [];
    return readdirSync(chainsDir)
      .filter(f => f.endsWith(".chain.json"))
      .sort()
      .map(f => {
        try { return JSON.parse(readFileSync(join(chainsDir, f), "utf-8")); }
        catch { return null; }
      })
      .filter(Boolean) as Array<Record<string, unknown>>;
  }

  private allFlowsForSearch(): Array<Record<string, unknown>> {
    const chains = this.availableChains();
    const chainNames = new Set(chains.map(c => (c as Record<string, unknown>).name as string));
    const skills = this.installedSkills();
    const standaloneEntries: Array<Record<string, unknown>> = [];
    for (const [name] of skills) {
      if (chainNames.has(name)) continue;
      const manifest = this.loadManifest(name);
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
}
