/**
 * Knowledge Graph — Consensus-Validated Temporal Knowledge Graph
 * ================================================================
 * Entity-relationship triples with validity windows, populated by skill
 * execution outputs and validated via on-chain TrustOracle consensus.
 *
 * PATENT FAMILY F CIP — Novel combination:
 * - Temporal KG (from MemPalace/NeurOS patterns)
 * - Trust-weighted validation (from SkillChain on-chain consensus)
 * - Skill execution provenance (source_skill, source_run_id)
 *
 * Edge types ported from NeurOS: caused, supports, contradicts, preceded, enables
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import { type TrustScore, TrustBridge } from "./trust-bridge.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Relationship types between entities — ported from NeurOS KG store */
export type EdgeType =
  | "caused"        // A caused B
  | "supports"      // A supports/validates B
  | "contradicts"   // A contradicts B (triggers validity windowing)
  | "preceded"      // A happened before B (temporal ordering)
  | "enables"       // A enables/allows B
  | "produces"      // A produces output B
  | "consumes"      // A consumes input B
  | "related_to"    // General association
  | "derived_from"; // B was derived from A

export interface KnowledgeTriple {
  /** Unique ID for this triple */
  triple_id: string;
  /** Subject entity */
  subject: string;
  /** Relationship type */
  predicate: EdgeType;
  /** Object entity */
  object: string;
  /** When this fact became valid (ISO 8601) */
  valid_from: string;
  /** When this fact was invalidated (ISO 8601), null if still valid */
  valid_until: string | null;
  /** Confidence score (0-1), influenced by trust validation */
  confidence: number;
  /** Which skill produced this triple */
  source_skill: string;
  /** Which run produced this triple */
  source_run_id: string;
  /** On-chain trust score at time of creation (0-1) */
  trust_score: number;
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
  /** Creation timestamp */
  created_at: string;
}

export interface KGQueryResult {
  triples: KnowledgeTriple[];
  query: {
    subject?: string;
    predicate?: string;
    object?: string;
    at_time?: string;
  };
  total_matches: number;
}

export interface KGHistoryResult {
  entity: string;
  history: Array<{
    triple: KnowledgeTriple;
    status: "active" | "superseded" | "contradicted";
  }>;
}

export interface KGValidation {
  triple_id: string;
  trust_score: number;
  validation_consensus: {
    has_consensus: boolean;
    num_validators: number;
    success_rate_bps: number;
  } | null;
  skill_trust: number;
  overall_confidence: number;
}

// ---------------------------------------------------------------------------
// Knowledge Graph Engine
// ---------------------------------------------------------------------------

export class KnowledgeGraph {
  private storePath: string;
  private triples: KnowledgeTriple[];
  private trustBridge: TrustBridge;

  constructor(baseDir?: string, rpcUrl?: string) {
    const dir = baseDir ?? join(homedir(), ".skillchain", "memory");
    mkdirSync(dir, { recursive: true });
    this.storePath = join(dir, "knowledge-graph.json");
    this.triples = this.load();
    this.trustBridge = new TrustBridge(rpcUrl);
  }

  // -----------------------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------------------

  private load(): KnowledgeTriple[] {
    if (existsSync(this.storePath)) {
      try { return JSON.parse(readFileSync(this.storePath, "utf-8")); } catch { /* */ }
    }
    return [];
  }

  private save(): void {
    writeFileSync(this.storePath, JSON.stringify(this.triples, null, 2), "utf-8");
  }

  // -----------------------------------------------------------------------
  // Assert — add new triples
  // -----------------------------------------------------------------------

  /**
   * Assert a new knowledge triple. Handles contradiction detection:
   * if a new triple contradicts an existing one, the existing triple's
   * valid_until is set and both coexist with separate validity windows.
   */
  async assert(
    subject: string,
    predicate: EdgeType,
    object: string,
    sourceSkill: string,
    sourceRunId: string,
    confidence: number = 0.7,
    metadata: Record<string, unknown> = {},
  ): Promise<{ triple: KnowledgeTriple; contradictions: KnowledgeTriple[] }> {
    const now = new Date().toISOString();

    // Get trust score for the source skill (async, with offline fallback)
    let trustScore = 0.5; // default
    try {
      const trust = await this.trustBridge.getSkillTrust(sourceSkill);
      trustScore = trust.combined;
    } catch { /* use default */ }

    // Detect contradictions: same subject+predicate but different object
    const contradictions = this.findContradictions(subject, predicate, object);
    for (const existing of contradictions) {
      if (existing.valid_until === null) {
        existing.valid_until = now;
      }
    }

    // Create new triple
    const triple: KnowledgeTriple = {
      triple_id: randomUUID().slice(0, 16),
      subject: subject.toLowerCase().trim(),
      predicate,
      object: object.toLowerCase().trim(),
      valid_from: now,
      valid_until: null,
      confidence: confidence * trustScore, // Trust-weighted confidence
      source_skill: sourceSkill,
      source_run_id: sourceRunId,
      trust_score: trustScore,
      metadata,
      created_at: now,
    };

    this.triples.push(triple);

    // Cap at 1000 triples (remove oldest low-confidence ones)
    if (this.triples.length > 1000) {
      this.triples = this.triples
        .sort((a, b) => {
          // Keep active triples, sort by confidence * recency
          const aActive = a.valid_until === null ? 1 : 0;
          const bActive = b.valid_until === null ? 1 : 0;
          if (aActive !== bActive) return bActive - aActive;
          return b.confidence - a.confidence;
        })
        .slice(0, 1000);
    }

    this.save();

    return { triple, contradictions };
  }

  // -----------------------------------------------------------------------
  // Query — point-in-time retrieval
  // -----------------------------------------------------------------------

  /**
   * Query triples with optional filters. Supports point-in-time queries.
   */
  query(
    subject?: string,
    predicate?: string,
    object?: string,
    atTime?: string,
    maxResults: number = 20,
  ): KGQueryResult {
    let results = this.triples;

    // Filter by subject
    if (subject) {
      const s = subject.toLowerCase().trim();
      results = results.filter(t => t.subject.includes(s) || t.object.includes(s));
    }

    // Filter by predicate
    if (predicate) {
      results = results.filter(t => t.predicate === predicate);
    }

    // Filter by object
    if (object) {
      const o = object.toLowerCase().trim();
      results = results.filter(t => t.object.includes(o));
    }

    // Point-in-time filter: only triples valid at the given time
    if (atTime) {
      const queryTime = new Date(atTime).getTime();
      results = results.filter(t => {
        const validFrom = new Date(t.valid_from).getTime();
        const validUntil = t.valid_until ? new Date(t.valid_until).getTime() : Infinity;
        return queryTime >= validFrom && queryTime <= validUntil;
      });
    } else {
      // Default: only currently valid triples
      results = results.filter(t => t.valid_until === null);
    }

    // Sort by confidence descending
    results = results.sort((a, b) => b.confidence - a.confidence);

    return {
      triples: results.slice(0, maxResults),
      query: { subject, predicate, object, at_time: atTime },
      total_matches: results.length,
    };
  }

  // -----------------------------------------------------------------------
  // History — how a fact changed over time
  // -----------------------------------------------------------------------

  /**
   * Get the history of all triples involving an entity.
   * Shows how facts changed, were contradicted, or superseded.
   */
  history(entity: string, maxResults: number = 20): KGHistoryResult {
    const e = entity.toLowerCase().trim();
    const related = this.triples
      .filter(t => t.subject.includes(e) || t.object.includes(e))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return {
      entity,
      history: related.slice(0, maxResults).map(triple => {
        let status: "active" | "superseded" | "contradicted" = "active";
        if (triple.valid_until !== null) {
          // Check if it was contradicted or just superseded
          const contradictors = this.triples.filter(
            t => t.subject === triple.subject &&
            t.predicate === triple.predicate &&
            t.object !== triple.object &&
            new Date(t.created_at).getTime() >= new Date(triple.created_at).getTime()
          );
          status = contradictors.length > 0 ? "contradicted" : "superseded";
        }
        return { triple, status };
      }),
    };
  }

  // -----------------------------------------------------------------------
  // Validate — check trust score of a knowledge claim
  // -----------------------------------------------------------------------

  /**
   * Validate a triple against on-chain trust data.
   * Returns the trust score, validation consensus, and overall confidence.
   */
  async validate(tripleId: string): Promise<KGValidation | null> {
    const triple = this.triples.find(t => t.triple_id === tripleId);
    if (!triple) return null;

    let skillTrust = 0.5;
    let validationConsensus: KGValidation["validation_consensus"] = null;

    try {
      const trust = await this.trustBridge.getSkillTrust(triple.source_skill);
      skillTrust = trust.combined;

      const consensus = await this.trustBridge.getValidationConsensus(triple.source_skill);
      if (consensus) {
        validationConsensus = {
          has_consensus: consensus.hasConsensus,
          num_validators: consensus.numValidators,
          success_rate_bps: consensus.successRateBps,
        };
      }
    } catch { /* offline fallback */ }

    // Recalculate confidence with latest trust data
    const baseConfidence = triple.confidence / Math.max(triple.trust_score, 0.01);
    const overallConfidence = baseConfidence * skillTrust;

    // Update the triple's trust score
    triple.trust_score = skillTrust;
    triple.confidence = overallConfidence;
    this.save();

    return {
      triple_id: tripleId,
      trust_score: triple.trust_score,
      validation_consensus: validationConsensus,
      skill_trust: skillTrust,
      overall_confidence: overallConfidence,
    };
  }

  // -----------------------------------------------------------------------
  // Auto-extract triples from skill outputs
  // -----------------------------------------------------------------------

  /**
   * Extract knowledge triples from skill phase outputs.
   * Looks for structured relationships in the data.
   */
  async extractFromOutput(
    output: Record<string, unknown>,
    skillName: string,
    runId: string,
  ): Promise<KnowledgeTriple[]> {
    const extracted: KnowledgeTriple[] = [];

    // Extract entity relationships from key-value structures
    for (const [key, value] of Object.entries(output)) {
      if (value === null || value === undefined) continue;

      // Pattern: key that implies a relationship
      if (typeof value === "string" && value.length > 2 && value.length < 200) {
        const relationship = this.inferRelationship(key);
        if (relationship) {
          const result = await this.assert(
            skillName,
            relationship,
            value,
            skillName,
            runId,
            0.5,
            { source_key: key },
          );
          extracted.push(result.triple);
        }
      }

      // Pattern: nested object with result/recommendation/conclusion
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
          if (typeof subValue === "string" && subValue.length > 5 && subValue.length < 200) {
            const relationship = this.inferRelationship(subKey);
            if (relationship) {
              const result = await this.assert(
                `${skillName}:${key}`,
                relationship,
                subValue,
                skillName,
                runId,
                0.4,
                { source_key: `${key}.${subKey}` },
              );
              extracted.push(result.triple);
            }
          }
        }
      }
    }

    return extracted;
  }

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------

  getStats(): Record<string, unknown> {
    const active = this.triples.filter(t => t.valid_until === null);
    const predicateCounts: Record<string, number> = {};
    for (const t of active) {
      predicateCounts[t.predicate] = (predicateCounts[t.predicate] ?? 0) + 1;
    }

    const skillCounts: Record<string, number> = {};
    for (const t of this.triples) {
      skillCounts[t.source_skill] = (skillCounts[t.source_skill] ?? 0) + 1;
    }

    return {
      total_triples: this.triples.length,
      active_triples: active.length,
      superseded_triples: this.triples.length - active.length,
      predicate_distribution: predicateCounts,
      skill_contributions: skillCounts,
      avg_confidence: active.length > 0
        ? Math.round((active.reduce((s, t) => s + t.confidence, 0) / active.length) * 100) / 100
        : 0,
      avg_trust_score: active.length > 0
        ? Math.round((active.reduce((s, t) => s + t.trust_score, 0) / active.length) * 100) / 100
        : 0,
    };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private findContradictions(
    subject: string,
    predicate: EdgeType,
    object: string,
  ): KnowledgeTriple[] {
    const s = subject.toLowerCase().trim();
    const o = object.toLowerCase().trim();

    return this.triples.filter(t =>
      t.subject === s &&
      t.predicate === predicate &&
      t.object !== o &&
      t.valid_until === null // only active triples can be contradicted
    );
  }

  private inferRelationship(key: string): EdgeType | null {
    const k = key.toLowerCase();

    if (k.includes("result") || k.includes("output") || k.includes("product")) return "produces";
    if (k.includes("cause") || k.includes("reason") || k.includes("because")) return "caused";
    if (k.includes("support") || k.includes("evidence") || k.includes("confirm")) return "supports";
    if (k.includes("contradict") || k.includes("conflict") || k.includes("oppose")) return "contradicts";
    if (k.includes("require") || k.includes("need") || k.includes("depend")) return "consumes";
    if (k.includes("enable") || k.includes("allow") || k.includes("unlock")) return "enables";
    if (k.includes("derive") || k.includes("base") || k.includes("source")) return "derived_from";
    if (k.includes("recommend") || k.includes("suggest") || k.includes("conclusion")) return "produces";
    if (k.includes("before") || k.includes("after") || k.includes("then")) return "preceded";

    return null; // Don't create triples for unrecognized patterns
  }
}
