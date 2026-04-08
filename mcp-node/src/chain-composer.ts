/**
 * Chain Composer — Validated Dynamic Chain Composition
 * =====================================================
 * Dynamically composes skill chains at runtime from the validated skill registry.
 * Uses input/output compatibility matching, topological sorting, and trust-weighted
 * scoring with confidence-gated fallback to curated chains.
 *
 * PATENT FAMILY F CIP — Novel hybrid: dynamic composition + curated fallback
 * with trust-validated skill registry scoring.
 */
import { type ManifestIndex, type SkillManifest } from "./manifest-index.js";
import { INTENT_MAP, tokenize, ChainMatcher, type ChainMatch } from "./chain-matcher.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComposedStep {
  skill_name: string;
  alias: string;
  depends_on: string[];
  /** Why this skill was selected */
  selection_reason: string;
  /** Input fields this skill needs */
  inputs: string[];
  /** Output fields this skill produces */
  outputs: string[];
}

export interface ComposedChain {
  /** Whether this came from dynamic composition or curated fallback */
  type: "composed" | "curated";
  chain_name: string;
  description: string;
  confidence: number;
  steps: ComposedStep[];
  /** How well the composition covers the query intent */
  coverage_score: number;
  /** How well skill inputs/outputs connect */
  coherence_score: number;
  /** Aggregate trust score from the skill registry */
  trust_score: number;
  /** Whether we fell back to curated chains */
  fallback_used: boolean;
  /** Explanation of composition decisions */
  explanation: string[];
}

interface ScoredCandidate {
  skillName: string;
  manifest: SkillManifest;
  relevance: number;
  matchedTokens: string[];
  matchedIntents: string[];
}

// ---------------------------------------------------------------------------
// Composition Engine
// ---------------------------------------------------------------------------

export class ChainComposer {
  private idx: ManifestIndex;

  constructor(manifestIndex: ManifestIndex) {
    this.idx = manifestIndex;
  }

  /**
   * Compose a chain dynamically from natural language query.
   * Falls back to curated chain matching if confidence is below threshold.
   */
  compose(
    query: string,
    maxSkills: number = 5,
    minConfidence: number = 0.4,
    curatedChains?: Array<{ name: string; description?: string; category?: string; steps?: Array<{ skill_name: string; alias?: string }> }>,
  ): ComposedChain {
    const explanation: string[] = [];
    const queryTokens = tokenize(query);

    if (queryTokens.length === 0) {
      return this.emptyResult("No meaningful tokens in query", explanation);
    }

    // Step 1: Find candidate skills by relevance to query
    const candidates = this.findCandidates(queryTokens, query);
    explanation.push(`Found ${candidates.length} candidate skills from ${this.idx.skills.size} total`);

    if (candidates.length === 0) {
      // Try curated fallback immediately
      if (curatedChains) {
        return this.curatedFallback(query, curatedChains, explanation, "No candidate skills matched query");
      }
      return this.emptyResult("No candidate skills found", explanation);
    }

    // Step 2: Select top skills and build dependency graph
    const selected = this.selectSkills(candidates, maxSkills, queryTokens);
    explanation.push(`Selected ${selected.length} skills: ${selected.map(s => s.skillName).join(", ")}`);

    if (selected.length < 1) {
      if (curatedChains) {
        return this.curatedFallback(query, curatedChains, explanation, "Not enough skills to compose a chain");
      }
      return this.emptyResult("Not enough skills to compose", explanation);
    }

    // Step 3: Build dependency DAG based on input/output matching
    const steps = this.buildDAG(selected);
    explanation.push(`Built DAG with ${steps.length} steps`);

    // Step 4: Score the composition
    const coverageScore = this.scoreCoverage(selected, queryTokens);
    const coherenceScore = this.scoreCoherence(steps);
    const trustScore = this.scoreTrust(selected);
    const confidence = (coverageScore * 0.4) + (coherenceScore * 0.35) + (trustScore * 0.25);

    explanation.push(
      `Scores — coverage: ${coverageScore.toFixed(2)}, coherence: ${coherenceScore.toFixed(2)}, ` +
      `trust: ${trustScore.toFixed(2)}, confidence: ${confidence.toFixed(2)} (threshold: ${minConfidence})`
    );

    // Step 5: Confidence gate — fallback to curated if too low
    if (confidence < minConfidence && curatedChains) {
      return this.curatedFallback(query, curatedChains, explanation,
        `Confidence ${confidence.toFixed(2)} below threshold ${minConfidence}`);
    }

    // Generate a descriptive chain name
    const chainName = this.generateChainName(selected, queryTokens);

    return {
      type: "composed",
      chain_name: chainName,
      description: `Dynamically composed chain for: "${query}"`,
      confidence,
      steps,
      coverage_score: coverageScore,
      coherence_score: coherenceScore,
      trust_score: trustScore,
      fallback_used: false,
      explanation,
    };
  }

  /**
   * Explain why specific skills were chosen for a composition.
   */
  explain(query: string, maxSkills: number = 5): Record<string, unknown> {
    const queryTokens = tokenize(query);
    const candidates = this.findCandidates(queryTokens, query);
    const selected = this.selectSkills(candidates, maxSkills, queryTokens);

    return {
      query,
      tokens: queryTokens,
      candidates: candidates.slice(0, 15).map(c => ({
        skill: c.skillName,
        relevance: c.relevance,
        matched_tokens: c.matchedTokens,
        matched_intents: c.matchedIntents,
        domain: c.manifest.domain,
        inputs: c.manifest.inputs,
        outputs: c.manifest.outputs,
      })),
      selected: selected.map(s => ({
        skill: s.skillName,
        relevance: s.relevance,
        reason: s.matchedIntents.length > 0
          ? `Intent match: ${s.matchedIntents.join(", ")}`
          : `Token match: ${s.matchedTokens.join(", ")}`,
      })),
      dag: this.buildDAG(selected),
    };
  }

  // -----------------------------------------------------------------------
  // Step 1: Find candidate skills
  // -----------------------------------------------------------------------

  private findCandidates(queryTokens: string[], rawQuery: string): ScoredCandidate[] {
    const scores = new Map<string, ScoredCandidate>();

    const getOrCreate = (name: string): ScoredCandidate => {
      if (!scores.has(name)) {
        scores.set(name, {
          skillName: name,
          manifest: this.idx.skills.get(name)!,
          relevance: 0,
          matchedTokens: [],
          matchedIntents: [],
        });
      }
      return scores.get(name)!;
    };

    // 1a. Intent-based matching (strongest signal)
    const lowerQuery = rawQuery.toLowerCase();
    for (const [keyword, chainNames] of Object.entries(INTENT_MAP)) {
      if (lowerQuery.includes(keyword)) {
        // Intent map points to chains, but we need skills.
        // Map chain names to the skills they contain by scanning tag/name overlap
        for (const skillName of this.idx.skills.keys()) {
          const manifest = this.idx.skills.get(skillName)!;
          const skillTokens = tokenize(`${manifest.name} ${manifest.description} ${manifest.tags.join(" ")}`);

          for (const chainName of chainNames) {
            const chainTokens = tokenize(chainName);
            const overlap = chainTokens.filter(ct => skillTokens.includes(ct));
            if (overlap.length > 0) {
              const c = getOrCreate(skillName);
              c.relevance += 15 * overlap.length;
              c.matchedIntents.push(`${keyword}->${chainName}`);
            }
          }
        }
      }
    }

    // 1b. Direct tag matching
    for (const token of queryTokens) {
      const tagMatches = this.idx.tagIndex.get(token);
      if (tagMatches) {
        for (const skillName of tagMatches) {
          const c = getOrCreate(skillName);
          c.relevance += 12;
          if (!c.matchedTokens.includes(token)) c.matchedTokens.push(token);
        }
      }
    }

    // 1c. Domain matching
    for (const token of queryTokens) {
      const domainMatches = this.idx.domainIndex.get(token);
      if (domainMatches) {
        for (const skillName of domainMatches) {
          const c = getOrCreate(skillName);
          c.relevance += 8;
          if (!c.matchedTokens.includes(token)) c.matchedTokens.push(token);
        }
      }
    }

    // 1d. Name and description matching
    for (const [skillName, manifest] of this.idx.skills) {
      const skillTokens = new Set(tokenize(`${skillName} ${manifest.description}`));
      let matchCount = 0;
      for (const token of queryTokens) {
        if (skillTokens.has(token)) matchCount++;
      }
      if (matchCount > 0) {
        const c = getOrCreate(skillName);
        c.relevance += matchCount * 6;
        for (const token of queryTokens) {
          if (skillTokens.has(token) && !c.matchedTokens.includes(token)) {
            c.matchedTokens.push(token);
          }
        }
      }
    }

    // Sort by relevance descending
    return [...scores.values()]
      .filter(c => c.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);
  }

  // -----------------------------------------------------------------------
  // Step 2: Select top skills with diversity
  // -----------------------------------------------------------------------

  private selectSkills(
    candidates: ScoredCandidate[],
    maxSkills: number,
    queryTokens: string[],
  ): ScoredCandidate[] {
    if (candidates.length <= maxSkills) return candidates;

    const selected: ScoredCandidate[] = [];
    const coveredOutputs = new Set<string>();
    const coveredDomains = new Set<string>();

    for (const candidate of candidates) {
      if (selected.length >= maxSkills) break;

      // Prefer skills that add new outputs (coverage diversity)
      const newOutputs = candidate.manifest.outputs.filter(
        o => !coveredOutputs.has(o.toLowerCase())
      );

      // Prefer skills from different domains (domain diversity)
      const newDomain = !coveredDomains.has(candidate.manifest.domain.toLowerCase());

      // Diversity bonus: prefer skills that expand coverage
      const diversityBonus = (newOutputs.length > 0 ? 5 : 0) + (newDomain ? 3 : 0);

      if (selected.length === 0 || candidate.relevance + diversityBonus > 0) {
        selected.push(candidate);
        for (const o of candidate.manifest.outputs) coveredOutputs.add(o.toLowerCase());
        coveredDomains.add(candidate.manifest.domain.toLowerCase());
      }
    }

    return selected;
  }

  // -----------------------------------------------------------------------
  // Step 3: Build dependency DAG
  // -----------------------------------------------------------------------

  private buildDAG(selected: ScoredCandidate[]): ComposedStep[] {
    const steps: ComposedStep[] = [];
    const skillSet = new Set(selected.map(s => s.skillName));

    // Map of output_field -> producing skill alias
    const outputProviders = new Map<string, string>();

    // First pass: create steps and register outputs
    for (const candidate of selected) {
      const alias = candidate.skillName.replace(/-/g, "_");
      for (const output of candidate.manifest.outputs) {
        const normalized = output.toLowerCase().replace(/[_\s-]+/g, "_");
        outputProviders.set(normalized, alias);
      }
    }

    // Second pass: resolve dependencies based on input/output matching
    for (const candidate of selected) {
      const alias = candidate.skillName.replace(/-/g, "_");
      const dependsOn: string[] = [];

      for (const input of candidate.manifest.inputs) {
        const normalized = input.toLowerCase().replace(/[_\s-]+/g, "_");
        const provider = outputProviders.get(normalized);
        if (provider && provider !== alias && !dependsOn.includes(provider)) {
          dependsOn.push(provider);
        }
      }

      steps.push({
        skill_name: candidate.skillName,
        alias,
        depends_on: dependsOn,
        selection_reason: candidate.matchedIntents.length > 0
          ? `Intent: ${candidate.matchedIntents.slice(0, 2).join(", ")}`
          : `Tokens: ${candidate.matchedTokens.slice(0, 3).join(", ")}`,
        inputs: candidate.manifest.inputs,
        outputs: candidate.manifest.outputs,
      });
    }

    // Topological sort
    return this.topoSort(steps);
  }

  private topoSort(steps: ComposedStep[]): ComposedStep[] {
    const byAlias = new Map(steps.map(s => [s.alias, s]));
    const visited = new Set<string>();
    const sorted: ComposedStep[] = [];

    const visit = (alias: string) => {
      if (visited.has(alias)) return;
      visited.add(alias);
      const step = byAlias.get(alias);
      if (!step) return;
      for (const dep of step.depends_on) {
        visit(dep);
      }
      sorted.push(step);
    };

    for (const step of steps) visit(step.alias);
    return sorted;
  }

  // -----------------------------------------------------------------------
  // Step 4: Scoring
  // -----------------------------------------------------------------------

  /** Coverage: what fraction of query tokens are addressed by selected skills */
  private scoreCoverage(selected: ScoredCandidate[], queryTokens: string[]): number {
    if (queryTokens.length === 0) return 0;
    const covered = new Set<string>();
    for (const s of selected) {
      for (const t of s.matchedTokens) covered.add(t);
    }
    return Math.min(1, covered.size / queryTokens.length);
  }

  /** Coherence: what fraction of skill inputs are satisfied by other skills' outputs */
  private scoreCoherence(steps: ComposedStep[]): number {
    if (steps.length <= 1) return 1; // single skill is perfectly coherent

    const allOutputs = new Set<string>();
    let totalInputs = 0;
    let satisfiedInputs = 0;

    for (const step of steps) {
      for (const input of step.inputs) {
        totalInputs++;
        const normalized = input.toLowerCase().replace(/[_\s-]+/g, "_");
        if (allOutputs.has(normalized)) satisfiedInputs++;
      }
      for (const output of step.outputs) {
        allOutputs.add(output.toLowerCase().replace(/[_\s-]+/g, "_"));
      }
    }

    if (totalInputs === 0) return 0.5; // no declared inputs — moderate coherence
    return satisfiedInputs / totalInputs;
  }

  /** Trust: aggregate score based on skill registry metadata */
  private scoreTrust(selected: ScoredCandidate[]): number {
    if (selected.length === 0) return 0;

    let trustSum = 0;
    for (const s of selected) {
      // Skills with manifests (inputs/outputs defined) get higher trust
      const hasManifest = s.manifest.inputs.length > 0 || s.manifest.outputs.length > 0;
      const hasTags = s.manifest.tags.length > 0;
      const hasDescription = s.manifest.description.length > 20;

      // Base trust from manifest completeness (0-1 scale)
      let skillTrust = 0.3; // baseline
      if (hasManifest) skillTrust += 0.3;
      if (hasTags) skillTrust += 0.2;
      if (hasDescription) skillTrust += 0.2;

      trustSum += skillTrust;
    }

    return trustSum / selected.length;
  }

  // -----------------------------------------------------------------------
  // Fallback & Helpers
  // -----------------------------------------------------------------------

  private curatedFallback(
    query: string,
    chains: Array<{ name: string; description?: string; category?: string; steps?: Array<{ skill_name: string; alias?: string }> }>,
    explanation: string[],
    reason: string,
  ): ComposedChain {
    explanation.push(`Falling back to curated chains: ${reason}`);

    const matcher = new ChainMatcher(chains);
    const matches = matcher.match(query, 1);

    if (matches.length === 0) {
      return this.emptyResult("No curated chains matched either", explanation);
    }

    const best = matches[0];
    explanation.push(`Curated match: "${best.chain_name}" (score: ${best.score})`);

    return {
      type: "curated",
      chain_name: best.chain_name,
      description: best.description,
      confidence: Math.min(1, best.score / 100),
      steps: best.skills.map((sk, i) => ({
        skill_name: sk,
        alias: sk.replace(/-/g, "_"),
        depends_on: i > 0 ? [best.skills[i - 1].replace(/-/g, "_")] : [],
        selection_reason: "curated chain step",
        inputs: [],
        outputs: [],
      })),
      coverage_score: 0,
      coherence_score: 0,
      trust_score: 0,
      fallback_used: true,
      explanation,
    };
  }

  private emptyResult(reason: string, explanation: string[]): ComposedChain {
    explanation.push(`No composition: ${reason}`);
    return {
      type: "composed",
      chain_name: "none",
      description: reason,
      confidence: 0,
      steps: [],
      coverage_score: 0,
      coherence_score: 0,
      trust_score: 0,
      fallback_used: false,
      explanation,
    };
  }

  private generateChainName(selected: ScoredCandidate[], queryTokens: string[]): string {
    // Use first 3 meaningful query tokens
    const nameTokens = queryTokens.slice(0, 3);
    if (nameTokens.length > 0) return `composed-${nameTokens.join("-")}`;
    // Fallback: use first skill name
    if (selected.length > 0) return `composed-${selected[0].skillName}`;
    return "composed-chain";
  }
}
