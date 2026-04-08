/**
 * Skill Evolution Engine — Graduation Pipeline
 * ==============================================
 * Tracks skill maturity through evolution stages:
 *   Prompt -> Skill -> Validated -> Graduated -> Compiled
 *
 * A skill "graduates" when it has 100+ validations with 0.95+ average
 * similarity.  A graduated skill can be "compiled" — its phases converted
 * into a deterministic JSON representation.
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "fs";
import { join } from "path";
import { homedir } from "os";
import { createHash } from "crypto";

import { TrustBridge, type ValidationConsensus } from "./trust-bridge.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EvolutionStage =
  | "prompt"
  | "skill"
  | "validated"
  | "graduated"
  | "compiled";

export interface EvolutionStatus {
  skill_name: string;
  stage: EvolutionStage;
  has_manifest: boolean;
  validation_count: number;
  avg_similarity: number;
  has_compiled: boolean;
  details: string;
}

export interface GraduationResult {
  skill_name: string;
  qualified: boolean;
  stage: EvolutionStage;
  validation_count: number;
  avg_similarity: number;
  reasons: string[];
}

export interface CompiledStep {
  phase: string;
  description: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  assertions: string[];
}

export interface CompiledSkill {
  name: string;
  version: string;
  compiled_at: string;
  source_hash: string;
  domain: string;
  execution_pattern: string;
  steps: CompiledStep[];
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRADUATION_MIN_VALIDATIONS = 100;
const GRADUATION_MIN_SIMILARITY = 0.95; // 0.95 = 9500 bps

// ---------------------------------------------------------------------------
// Skill Evolution
// ---------------------------------------------------------------------------

export class SkillEvolution {
  private marketplaceDir: string;
  private compiledDir: string;
  private trustBridge: TrustBridge;

  constructor(marketplaceDir: string) {
    this.marketplaceDir = marketplaceDir;
    this.compiledDir = join(homedir(), ".skillchain", "compiled");
    mkdirSync(this.compiledDir, { recursive: true });
    this.trustBridge = new TrustBridge();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Return the current evolution stage of a skill.
   */
  async getEvolutionStatus(skillName: string): Promise<EvolutionStatus> {
    const hasManifest = this.hasManifest(skillName);
    const hasCompiled = this.hasCompiledOutput(skillName);

    // Fetch on-chain validation data
    const consensus = await this.fetchConsensus(skillName);
    const validationCount = consensus?.numValidators ?? 0;
    const avgSimilarity = consensus
      ? consensus.successRateBps / 10000
      : 0;

    // Determine stage
    let stage: EvolutionStage = "prompt";
    let details = "Raw prompt — no manifest found.";

    if (hasCompiled) {
      stage = "compiled";
      details = "Compiled to deterministic JSON.";
    } else if (
      validationCount >= GRADUATION_MIN_VALIDATIONS &&
      avgSimilarity >= GRADUATION_MIN_SIMILARITY
    ) {
      stage = "graduated";
      details = `Graduated: ${validationCount} validations, ${(avgSimilarity * 100).toFixed(1)}% similarity.`;
    } else if (validationCount > 0) {
      stage = "validated";
      details = `Validated: ${validationCount} validations so far (need ${GRADUATION_MIN_VALIDATIONS} at ${GRADUATION_MIN_SIMILARITY * 100}%+).`;
    } else if (hasManifest) {
      stage = "skill";
      details = "Skill with manifest — not yet validated on-chain.";
    }

    return {
      skill_name: skillName,
      stage,
      has_manifest: hasManifest,
      validation_count: validationCount,
      avg_similarity: avgSimilarity,
      has_compiled: hasCompiled,
      details,
    };
  }

  /**
   * Evaluate whether a skill qualifies for graduation.
   */
  async checkGraduation(skillName: string): Promise<GraduationResult> {
    const consensus = await this.fetchConsensus(skillName);
    const validationCount = consensus?.numValidators ?? 0;
    const avgSimilarity = consensus
      ? consensus.successRateBps / 10000
      : 0;
    const hasManifest = this.hasManifest(skillName);

    const reasons: string[] = [];
    let qualified = true;

    if (!hasManifest) {
      reasons.push("No manifest found — skill must be registered first.");
      qualified = false;
    }

    if (validationCount < GRADUATION_MIN_VALIDATIONS) {
      reasons.push(
        `Insufficient validations: ${validationCount}/${GRADUATION_MIN_VALIDATIONS}.`
      );
      qualified = false;
    }

    if (avgSimilarity < GRADUATION_MIN_SIMILARITY) {
      reasons.push(
        `Average similarity too low: ${(avgSimilarity * 100).toFixed(1)}% (need ${GRADUATION_MIN_SIMILARITY * 100}%).`
      );
      qualified = false;
    }

    if (qualified) {
      reasons.push(
        `Qualified for graduation: ${validationCount} validations at ${(avgSimilarity * 100).toFixed(1)}% similarity.`
      );
    }

    // Determine effective stage
    const status = await this.getEvolutionStatus(skillName);

    return {
      skill_name: skillName,
      qualified,
      stage: status.stage,
      validation_count: validationCount,
      avg_similarity: avgSimilarity,
      reasons,
    };
  }

  /**
   * Compile a graduated skill into deterministic JSON.
   * Reads the skill.md, parses phases/quality-gates, and produces a
   * structured compiled output saved to ~/.skillchain/compiled/.
   */
  compileSkill(skillName: string): CompiledSkill | { error: string } {
    // Locate skill.md
    const skillMdPath = this.findSkillMd(skillName);
    if (!skillMdPath) {
      return { error: `skill.md not found for '${skillName}'.` };
    }

    const manifest = this.loadManifest(skillName);
    const skillMd = readFileSync(skillMdPath, "utf-8");

    // Parse phases and quality gates from the markdown
    const steps = this.parsePhases(skillMd);

    if (steps.length === 0) {
      return { error: `No phases found in skill.md for '${skillName}'.` };
    }

    // Build a simple content hash
    const sourceHash = createHash("sha256")
      .update(skillMd)
      .digest("hex")
      .slice(0, 16);

    const compiled: CompiledSkill = {
      name: skillName,
      version: "1.0.0",
      compiled_at: new Date().toISOString(),
      source_hash: sourceHash,
      domain: (manifest.domain as string) ?? "general",
      execution_pattern: (manifest.execution_pattern as string) ?? "orpa",
      steps,
      metadata: {
        original_manifest: manifest,
      },
    };

    // Save
    const outPath = join(this.compiledDir, `${skillName}.compiled.json`);
    writeFileSync(outPath, JSON.stringify(compiled, null, 2), "utf-8");

    return compiled;
  }

  /**
   * Return the compiled version of a skill if it exists.
   */
  getCompiledSkill(skillName: string): CompiledSkill | null {
    const path = join(this.compiledDir, `${skillName}.compiled.json`);
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, "utf-8")) as CompiledSkill;
    } catch {
      return null;
    }
  }

  /**
   * List all known skills with their current evolution stage.
   */
  async listEvolutions(): Promise<EvolutionStatus[]> {
    const skillNames = new Set<string>();

    // Gather from marketplace
    if (existsSync(this.marketplaceDir)) {
      for (const entry of readdirSync(this.marketplaceDir)) {
        const skillMd = join(this.marketplaceDir, entry, "skill.md");
        if (existsSync(skillMd)) {
          skillNames.add(entry);
        }
      }
    }

    // Gather from compiled dir
    if (existsSync(this.compiledDir)) {
      for (const f of readdirSync(this.compiledDir)) {
        if (f.endsWith(".compiled.json")) {
          skillNames.add(f.replace(".compiled.json", ""));
        }
      }
    }

    const results: EvolutionStatus[] = [];
    for (const name of [...skillNames].sort()) {
      results.push(await this.getEvolutionStatus(name));
    }
    return results;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private hasManifest(skillName: string): boolean {
    const manifestPath = join(this.marketplaceDir, skillName, "manifest.json");
    return existsSync(manifestPath);
  }

  private hasCompiledOutput(skillName: string): boolean {
    const path = join(this.compiledDir, `${skillName}.compiled.json`);
    return existsSync(path);
  }

  private async fetchConsensus(
    skillName: string
  ): Promise<ValidationConsensus | null> {
    try {
      return await this.trustBridge.getValidationConsensus(skillName);
    } catch {
      return null;
    }
  }

  private loadManifest(skillName: string): Record<string, unknown> {
    const manifestPath = join(this.marketplaceDir, skillName, "manifest.json");
    if (existsSync(manifestPath)) {
      try {
        return JSON.parse(readFileSync(manifestPath, "utf-8"));
      } catch {
        /* */
      }
    }
    return { name: skillName };
  }

  private findSkillMd(skillName: string): string | null {
    // Check marketplace
    const mkt = join(this.marketplaceDir, skillName, "skill.md");
    if (existsSync(mkt)) return mkt;

    // Check ~/.claude/skills
    const claude = join(homedir(), ".claude", "skills", `${skillName}.md`);
    if (existsSync(claude)) return claude;

    // Check ~/.skillchain/skills
    const sc = join(homedir(), ".skillchain", "skills", `${skillName}.md`);
    if (existsSync(sc)) return sc;

    return null;
  }

  /**
   * Parse phases and quality gates from a skill.md file.
   *
   * Looks for patterns like:
   *   ## Phase N: Title
   *   ... description ...
   *   ### Quality Gate
   *   - assertion 1
   *   - assertion 2
   */
  private parsePhases(content: string): CompiledStep[] {
    const steps: CompiledStep[] = [];
    const lines = content.split("\n");

    let currentPhase: string | null = null;
    let currentDesc: string[] = [];
    let currentAssertions: string[] = [];
    let inQualityGate = false;

    const flushPhase = () => {
      if (currentPhase) {
        steps.push({
          phase: currentPhase,
          description: currentDesc.join("\n").trim(),
          inputs: {},
          outputs: {},
          assertions: [...currentAssertions],
        });
      }
      currentPhase = null;
      currentDesc = [];
      currentAssertions = [];
      inQualityGate = false;
    };

    for (const line of lines) {
      // Detect phase headings: "## Phase 1: Observe" or "## 1. Observe"
      const phaseMatch = line.match(
        /^##\s+(?:Phase\s+\d+[:.]\s*|(\d+)\.\s*)(.+)/i
      );
      if (phaseMatch) {
        flushPhase();
        currentPhase = (phaseMatch[2] ?? phaseMatch[1] ?? "").trim();
        inQualityGate = false;
        continue;
      }

      // Detect quality gate sub-heading
      if (/^###?\s+quality\s+gate/i.test(line)) {
        inQualityGate = true;
        continue;
      }

      // Another sub-heading resets quality gate mode
      if (/^###/.test(line) && !/quality\s+gate/i.test(line)) {
        inQualityGate = false;
      }

      if (currentPhase) {
        if (inQualityGate) {
          const bullet = line.match(/^\s*[-*]\s+(.+)/);
          if (bullet) {
            currentAssertions.push(bullet[1].trim());
          }
        } else {
          currentDesc.push(line);
        }
      }
    }

    flushPhase(); // flush last phase

    // Try to infer inputs/outputs from description keywords
    for (const step of steps) {
      const desc = step.description.toLowerCase();
      if (desc.includes("input") || desc.includes("receive") || desc.includes("accept")) {
        step.inputs["data"] = "unknown";
      }
      if (desc.includes("output") || desc.includes("return") || desc.includes("produce")) {
        step.outputs["result"] = "unknown";
      }
    }

    return steps;
  }
}
