/**
 * Memory Store — Tiered Memory System (L0-L3)
 * =============================================
 * Ported from NeurOS NeuroFS patterns (episodic/semantic split, value tagging).
 * Replaces flat state.json persistence with a hierarchical memory system.
 *
 * L0: Identity (~50 tokens, always loaded)
 * L1: Critical Facts (~500 tokens, always loaded)
 * L2: Skill Rooms (per-skill, loaded on demand)
 * L3: Semantic Index (cross-skill knowledge, queried on demand)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types — ported from NeurOS neurofs/contracts.py MemoryEntry
// ---------------------------------------------------------------------------

export type ImportanceLevel = "critical" | "high" | "medium" | "low" | "ephemeral";

export interface MemoryEntry {
  memory_id: string;
  content: string;
  timestamp: string;
  importance: number;       // 0.0 - 1.0
  importance_level: ImportanceLevel;
  tags: string[];
  source_skill: string;
  source_run_id?: string;
  /** NeurOS-style economic value tag (0.0-1.0), for finance-related memories */
  economic_value?: number;
  /** Access tracking */
  access_count: number;
  last_accessed: string;
}

export interface L0Identity {
  display_name: string;
  role: string;
  goals: string[];
  top_domains: string[];
  experience_level: string;
  summary: string;          // ~50 tokens
}

export interface L2SkillRoom {
  skill_name: string;
  /** Last N run summaries */
  run_summaries: Array<{
    run_id: string;
    date: string;
    phases_completed: number;
    key_outputs: string[];
  }>;
  /** Accumulated insights from this skill */
  insights: MemoryEntry[];
  /** User preferences specific to this skill */
  preferences: Record<string, unknown>;
  last_accessed: string;
}

export interface RecallResult {
  memory: MemoryEntry;
  tier: "L1" | "L2" | "L3";
  relevance: number;
}

// ---------------------------------------------------------------------------
// Memory Store
// ---------------------------------------------------------------------------

export class MemoryStore {
  private baseDir: string;
  private l0Path: string;
  private l1Path: string;
  private roomsDir: string;
  private l3Path: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? join(homedir(), ".skillchain", "memory");
    mkdirSync(this.baseDir, { recursive: true });
    this.l0Path = join(this.baseDir, "l0-identity.json");
    this.l1Path = join(this.baseDir, "l1-facts.json");
    this.roomsDir = join(this.baseDir, "rooms");
    this.l3Path = join(this.baseDir, "l3-index.json");
    mkdirSync(this.roomsDir, { recursive: true });
  }

  // -----------------------------------------------------------------------
  // L0: Identity (always loaded, ~50 tokens)
  // -----------------------------------------------------------------------

  getIdentity(): L0Identity {
    if (existsSync(this.l0Path)) {
      try { return JSON.parse(readFileSync(this.l0Path, "utf-8")); } catch { /* */ }
    }
    return {
      display_name: "",
      role: "",
      goals: [],
      top_domains: [],
      experience_level: "",
      summary: "",
    };
  }

  updateIdentity(updates: Partial<L0Identity>): void {
    const current = this.getIdentity();
    const updated = { ...current, ...updates };
    // Regenerate summary
    const parts: string[] = [];
    if (updated.display_name) parts.push(updated.display_name);
    if (updated.role) parts.push(`(${updated.role})`);
    if (updated.goals.length > 0) parts.push(`Goals: ${updated.goals.slice(0, 3).join(", ")}`);
    if (updated.top_domains.length > 0) parts.push(`Domains: ${updated.top_domains.slice(0, 3).join(", ")}`);
    updated.summary = parts.join(" | ");
    writeFileSync(this.l0Path, JSON.stringify(updated, null, 2), "utf-8");
  }

  /**
   * Sync L0 from user profile data.
   */
  syncFromProfile(profile: {
    display_name?: string;
    role?: string;
    goals?: string[];
    favorite_domains?: string[];
    experience_level?: string;
  }): void {
    this.updateIdentity({
      display_name: profile.display_name ?? "",
      role: profile.role ?? "",
      goals: profile.goals ?? [],
      top_domains: profile.favorite_domains ?? [],
      experience_level: profile.experience_level ?? "",
    });
  }

  // -----------------------------------------------------------------------
  // L1: Critical Facts (always loaded, ~500 tokens max)
  // -----------------------------------------------------------------------

  private loadL1(): MemoryEntry[] {
    if (existsSync(this.l1Path)) {
      try { return JSON.parse(readFileSync(this.l1Path, "utf-8")); } catch { /* */ }
    }
    return [];
  }

  private saveL1(facts: MemoryEntry[]): void {
    // Cap at ~50 entries to stay within token budget
    const capped = facts
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 50);
    writeFileSync(this.l1Path, JSON.stringify(capped, null, 2), "utf-8");
  }

  getCriticalFacts(): MemoryEntry[] {
    return this.loadL1();
  }

  /**
   * Store a critical fact in L1. Deduplicates by content similarity.
   */
  rememberFact(content: string, tags: string[], sourceSkill: string, importance: number = 0.7): MemoryEntry {
    const facts = this.loadL1();

    // Simple dedup: skip if very similar content already exists
    const normalized = content.toLowerCase().trim();
    const existing = facts.find(f => {
      const existingNorm = f.content.toLowerCase().trim();
      return existingNorm === normalized || this.similarity(existingNorm, normalized) > 0.8;
    });

    if (existing) {
      // Update existing entry
      existing.content = content;
      existing.timestamp = new Date().toISOString();
      existing.importance = Math.max(existing.importance, importance);
      existing.access_count++;
      existing.last_accessed = new Date().toISOString();
      this.saveL1(facts);
      return existing;
    }

    const entry: MemoryEntry = {
      memory_id: randomUUID().slice(0, 16),
      content,
      timestamp: new Date().toISOString(),
      importance,
      importance_level: importance >= 0.8 ? "high" : importance >= 0.5 ? "medium" : "low",
      tags,
      source_skill: sourceSkill,
      access_count: 0,
      last_accessed: new Date().toISOString(),
    };

    facts.push(entry);
    this.saveL1(facts);
    return entry;
  }

  // -----------------------------------------------------------------------
  // L2: Skill Rooms (loaded on demand per skill)
  // -----------------------------------------------------------------------

  private roomPath(skillName: string): string {
    const safe = skillName.replace(/[/\\]/g, "").replace(/\0/g, "").replace(/\.\./g, "").replace(/^\.+/, "") || "unknown";
    return join(this.roomsDir, `${safe}.json`);
  }

  getSkillRoom(skillName: string): L2SkillRoom {
    const path = this.roomPath(skillName);
    if (existsSync(path)) {
      try {
        const room = JSON.parse(readFileSync(path, "utf-8")) as L2SkillRoom;
        room.last_accessed = new Date().toISOString();
        writeFileSync(path, JSON.stringify(room, null, 2), "utf-8");
        return room;
      } catch { /* */ }
    }
    return {
      skill_name: skillName,
      run_summaries: [],
      insights: [],
      preferences: {},
      last_accessed: new Date().toISOString(),
    };
  }

  /**
   * Record a run summary to the skill's room (L2).
   * Called after complete_skill_run.
   */
  recordRunToRoom(
    skillName: string,
    runId: string,
    phasesCompleted: number,
    keyOutputs: string[],
  ): void {
    const room = this.getSkillRoom(skillName);
    room.run_summaries.push({
      run_id: runId,
      date: new Date().toISOString(),
      phases_completed: phasesCompleted,
      key_outputs: keyOutputs.slice(0, 5), // limit to 5 key outputs
    });

    // Keep last 20 run summaries
    if (room.run_summaries.length > 20) {
      room.run_summaries = room.run_summaries.slice(-20);
    }

    writeFileSync(this.roomPath(skillName), JSON.stringify(room, null, 2), "utf-8");
  }

  /**
   * Add an insight to the skill room (L2).
   */
  addInsight(skillName: string, content: string, tags: string[], importance: number = 0.5): MemoryEntry {
    const room = this.getSkillRoom(skillName);

    const entry: MemoryEntry = {
      memory_id: randomUUID().slice(0, 16),
      content,
      timestamp: new Date().toISOString(),
      importance,
      importance_level: importance >= 0.8 ? "high" : importance >= 0.5 ? "medium" : "low",
      tags,
      source_skill: skillName,
      access_count: 0,
      last_accessed: new Date().toISOString(),
    };

    room.insights.push(entry);

    // Cap at 30 insights per skill
    if (room.insights.length > 30) {
      room.insights = room.insights
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 30);
    }

    writeFileSync(this.roomPath(skillName), JSON.stringify(room, null, 2), "utf-8");
    return entry;
  }

  // -----------------------------------------------------------------------
  // L3: Semantic Index (cross-skill, queried on demand)
  // -----------------------------------------------------------------------

  private loadL3(): MemoryEntry[] {
    if (existsSync(this.l3Path)) {
      try { return JSON.parse(readFileSync(this.l3Path, "utf-8")); } catch { /* */ }
    }
    return [];
  }

  private saveL3(entries: MemoryEntry[]): void {
    // Cap at 200 entries
    const capped = entries
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 200);
    writeFileSync(this.l3Path, JSON.stringify(capped, null, 2), "utf-8");
  }

  /**
   * Store a semantic memory in L3 (cross-skill knowledge).
   */
  storeSemanticMemory(content: string, tags: string[], sourceSkill: string, importance: number = 0.5): MemoryEntry {
    const entries = this.loadL3();

    const entry: MemoryEntry = {
      memory_id: randomUUID().slice(0, 16),
      content,
      timestamp: new Date().toISOString(),
      importance,
      importance_level: importance >= 0.8 ? "high" : importance >= 0.5 ? "medium" : "low",
      tags,
      source_skill: sourceSkill,
      access_count: 0,
      last_accessed: new Date().toISOString(),
    };

    entries.push(entry);
    this.saveL3(entries);
    return entry;
  }

  // -----------------------------------------------------------------------
  // Recall — search across tiers
  // -----------------------------------------------------------------------

  /**
   * Search across L1, L2, and L3 for relevant memories.
   * Uses keyword matching (TF-IDF style, like NeurOS fallback).
   */
  recall(query: string, maxResults: number = 10, skillFilter?: string): RecallResult[] {
    const queryTokens = new Set(
      query.toLowerCase().match(/[a-z0-9]+/g)?.filter(w => w.length > 2) ?? []
    );
    if (queryTokens.size === 0) return [];

    const results: RecallResult[] = [];

    // Search L1
    for (const memory of this.loadL1()) {
      const relevance = this.scoreRelevance(memory, queryTokens);
      if (relevance > 0) {
        results.push({ memory, tier: "L1", relevance: relevance * 1.2 }); // L1 boost
      }
    }

    // Search L2 (specific skill or all rooms)
    if (skillFilter) {
      const room = this.getSkillRoom(skillFilter);
      for (const insight of room.insights) {
        const relevance = this.scoreRelevance(insight, queryTokens);
        if (relevance > 0) results.push({ memory: insight, tier: "L2", relevance });
      }
    } else {
      // Search all rooms — read room files from disk
      if (existsSync(this.roomsDir)) {
        const roomFiles = readdirSync(this.roomsDir);
        for (const file of roomFiles) {
          if (!file.endsWith(".json")) continue;
          try {
            const room: L2SkillRoom = JSON.parse(readFileSync(join(this.roomsDir, file), "utf-8"));
            for (const insight of room.insights) {
              const relevance = this.scoreRelevance(insight, queryTokens);
              if (relevance > 0) results.push({ memory: insight, tier: "L2", relevance });
            }
          } catch { /* skip corrupt files */ }
        }
      }
    }

    // Search L3
    for (const memory of this.loadL3()) {
      const relevance = this.scoreRelevance(memory, queryTokens);
      if (relevance > 0) results.push({ memory, tier: "L3", relevance });
    }

    // Sort by relevance, return top N
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults)
      .map(r => {
        // Update access tracking
        r.memory.access_count++;
        r.memory.last_accessed = new Date().toISOString();
        return r;
      });
  }

  /**
   * Get always-loaded context (L0 + L1) for any skill run.
   */
  getContext(): { identity: L0Identity; facts: MemoryEntry[] } {
    return {
      identity: this.getIdentity(),
      facts: this.getCriticalFacts(),
    };
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private scoreRelevance(memory: MemoryEntry, queryTokens: Set<string>): number {
    const contentTokens = memory.content.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    const tagTokens = memory.tags.map(t => t.toLowerCase());
    const allTokens = [...contentTokens, ...tagTokens];

    let matchCount = 0;
    for (const token of allTokens) {
      if (queryTokens.has(token)) matchCount++;
    }

    if (matchCount === 0) return 0;

    // Score: match ratio * importance * recency decay
    const matchRatio = matchCount / Math.max(queryTokens.size, 1);
    const importanceBoost = 0.5 + (memory.importance * 0.5);
    const ageMs = Date.now() - new Date(memory.timestamp).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recencyDecay = Math.exp(-0.05 * ageDays); // ~50% at 14 days

    return matchRatio * importanceBoost * recencyDecay;
  }

  /** Simple Jaccard-like similarity for dedup */
  private similarity(a: string, b: string): number {
    const tokensA = new Set(a.match(/[a-z0-9]+/g) ?? []);
    const tokensB = new Set(b.match(/[a-z0-9]+/g) ?? []);
    if (tokensA.size === 0 && tokensB.size === 0) return 1;

    let intersection = 0;
    for (const t of tokensA) if (tokensB.has(t)) intersection++;
    const union = tokensA.size + tokensB.size - intersection;

    return union === 0 ? 0 : intersection / union;
  }
}
