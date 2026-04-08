/**
 * Service Layer — shared business logic for MCP tools, Discord bot, and webhooks.
 * ================================================================================
 * Extracts core operations from index.ts so they can be reused across interfaces.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";

import { SkillStateStore, type SkillRun } from "./skill-state.js";
import { ChainMatcher, type ChainMatch } from "./chain-matcher.js";
import { GamificationEngine } from "./gamification.js";
import { ProfileManager } from "./user-profile.js";
import { VelmaRecommender } from "./velma-recommender.js";
import { buildManifestIndex } from "./manifest-index.js";
import { ChainComposer, type ComposedChain } from "./chain-composer.js";
import { MemoryStore } from "./memory-store.js";
import { KnowledgeGraph } from "./knowledge-graph.js";

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

  completeRun(runId: string, status: string = "completed"): { success: boolean; error?: string } {
    const run = this.activeRuns.get(runId);
    if (!run) return { success: false, error: `Run '${runId}' not found` };

    this.store.completeRun(run, status);
    try { this.profileMgr.updateUsage(run.skill_name); } catch { /* */ }
    try { new GamificationEngine().recordSkillRun(run.skill_name); } catch { /* */ }
    this.activeRuns.delete(runId);
    return { success: true };
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
  // Memory
  // -----------------------------------------------------------------------

  recall(query: string, maxResults: number = 10): unknown[] {
    return this.memory.recall(query, maxResults);
  }

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
}
