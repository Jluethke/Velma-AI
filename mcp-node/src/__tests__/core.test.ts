/**
 * Core unit tests for FlowFabric MCP server business logic.
 *
 * Covers: safeJsonParse, GamificationEngine, MemoryStore, KnowledgeGraph.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { GamificationEngine, SKILL_CATEGORIES } from "../gamification.js";
import { MemoryStore } from "../memory-store.js";
import { KnowledgeGraph } from "../knowledge-graph.js";

// ===========================================================================
// 1. safeJsonParse — prototype pollution guard (recreated since not exported)
// ===========================================================================

describe("safeJsonParse", () => {
  // Recreated to match the implementation in index.ts:103-109
  function safeJsonParse(input: string): Record<string, unknown> {
    const parsed = JSON.parse(input, (key, value) => {
      if (key === "__proto__" || key === "constructor" || key === "prototype")
        return undefined;
      return value;
    });
    return typeof parsed === "object" && parsed !== null
      ? parsed
      : { raw: input };
  }

  it("parses valid JSON objects", () => {
    expect(safeJsonParse('{"name":"test","count":42}')).toEqual({
      name: "test",
      count: 42,
    });
  });

  it("strips __proto__ keys (prototype pollution guard)", () => {
    const result = safeJsonParse(
      '{"__proto__":{"polluted":true},"safe":"value"}',
    );
    expect(result).toEqual({ safe: "value" });
    expect(({} as any).polluted).toBeUndefined();
  });

  it("strips constructor keys", () => {
    const result = safeJsonParse('{"constructor":{"evil":true},"ok":"yes"}');
    expect(result).toEqual({ ok: "yes" });
  });

  it("strips prototype keys", () => {
    const result = safeJsonParse('{"prototype":{"bad":true},"good":"data"}');
    expect(result).toEqual({ good: "data" });
  });

  it("wraps non-object JSON (string) into { raw }", () => {
    expect(safeJsonParse('"just a string"')).toEqual({
      raw: '"just a string"',
    });
  });

  it("wraps null into { raw }", () => {
    expect(safeJsonParse("null")).toEqual({ raw: "null" });
  });
});

// ===========================================================================
// 2. GamificationEngine — XP, levels, achievements, streaks
// ===========================================================================

describe("GamificationEngine", () => {
  let tmpDir: string;
  let engine: GamificationEngine;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "gam-test-"));
    engine = new GamificationEngine(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("starts at level 1 with 0 XP", () => {
    const card = engine.getTrainerCard();
    expect(card.level).toBe(1);
    expect(card.xp).toBe(0);
    expect(card.title).toBe("Novice");
  });

  it("awards 15 XP per skill run", () => {
    engine.recordSkillRun("budget-builder");
    const card = engine.getTrainerCard();
    // 15 base + 50 first_skill achievement = 65
    expect(card.xp).toBe(65);
  });

  it("discovers new skills and tracks unique count", () => {
    engine.recordSkillRun("budget-builder");
    engine.recordSkillRun("budget-builder"); // duplicate
    engine.recordSkillRun("meal-planner");
    const card = engine.getTrainerCard();
    expect(card.skills_discovered).toBe(2);
    expect(card.total_skill_runs).toBe(3);
  });

  it("unlocks first_skill achievement on first run", () => {
    const achievements = engine.recordSkillRun("resume-builder");
    const ids = achievements.map((a) => a.id);
    expect(ids).toContain("first_skill");
  });

  it("awards chain XP as 25 + stepCount * 5", () => {
    engine.recordChainRun("career-chain", 3, 5000);
    const card = engine.getTrainerCard();
    // 25 + 3*5 = 40 base chain XP + 75 first_chain achievement = 115
    expect(card.xp).toBe(115);
  });

  it("records compositions and awards 20 + stepCount * 3 XP", () => {
    engine.recordComposition("dynamic-chain", 4);
    const card = engine.getTrainerCard();
    // 20 + 4*3 = 32 base + 200 chain_architect achievement = 232
    expect(card.xp).toBe(232);
  });

  it("levels up when crossing XP threshold (level 2 at 100 XP)", () => {
    // Need 100 XP to reach level 2.
    // Run skills to accumulate enough XP.
    // First run gives 15 + 50 (first_skill) = 65.
    engine.recordSkillRun("budget-builder");
    // Second unique skill: 15 XP (no new achievement yet, need 5 for skill_5)
    engine.recordSkillRun("meal-planner");
    // Third unique skill: 15 XP => total = 65+15+15 = 95
    engine.recordSkillRun("resume-builder");
    const card = engine.getTrainerCard();
    // 95 XP < 100 threshold, still level 1
    expect(card.level).toBe(1);
    // One more: 15 XP => 110 >= 100
    engine.recordSkillRun("code-review");
    const card2 = engine.getTrainerCard();
    expect(card2.level).toBe(2);
  });

  it("tracks evolution levels per skill", () => {
    engine.recordSkillRun("budget-builder");
    engine.recordSkillRun("budget-builder");
    engine.recordSkillRun("budget-builder");
    const state = engine.getState();
    expect(state.evolution_levels["budget-builder"]).toBe(3);
  });

  it("returns full achievement list with unlock status", () => {
    engine.recordSkillRun("resume-builder");
    const achievements = engine.getAchievements();
    const firstSkill = achievements.find(
      (a) => a.id === "first_skill",
    );
    expect(firstSkill).toBeDefined();
    expect(firstSkill!.unlocked).toBe(true);
    expect(firstSkill!.unlocked_at).toBeTruthy();

    const skill5 = achievements.find((a) => a.id === "skill_5");
    expect(skill5).toBeDefined();
    expect(skill5!.unlocked).toBe(false);
  });

  it("builds a correct skilldex from SKILL_CATEGORIES", () => {
    engine.recordSkillRun("budget-builder"); // Finance
    engine.recordSkillRun("resume-builder"); // Career
    const dex = engine.getSkilldex();
    expect(dex.total_discovered).toBe(2);
    expect(dex.total_skills).toBeGreaterThan(100); // 130+ skills registered
    const finance = (dex.categories as any)["Finance"];
    expect(finance.discovered).toBe(1);
  });
});

// ===========================================================================
// 3. MemoryStore — L0 identity, L1 facts, L2 rooms, recall
// ===========================================================================

describe("MemoryStore", () => {
  let tmpDir: string;
  let store: MemoryStore;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "mem-test-"));
    store = new MemoryStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty defaults for new identity", () => {
    const identity = store.getIdentity();
    expect(identity.display_name).toBe("");
    expect(identity.goals).toEqual([]);
  });

  it("updates and persists identity (L0)", () => {
    store.updateIdentity({
      display_name: "Alice",
      role: "Developer",
      goals: ["Learn Rust", "Ship v2"],
    });
    // Re-instantiate to verify persistence
    const store2 = new MemoryStore(tmpDir);
    const identity = store2.getIdentity();
    expect(identity.display_name).toBe("Alice");
    expect(identity.role).toBe("Developer");
    expect(identity.goals).toEqual(["Learn Rust", "Ship v2"]);
    expect(identity.summary).toContain("Alice");
    expect(identity.summary).toContain("Developer");
  });

  it("stores and retrieves a critical fact (L1)", () => {
    const entry = store.rememberFact(
      "User prefers dark mode",
      ["preference", "ui"],
      "settings-skill",
      0.8,
    );
    expect(entry.memory_id).toBeTruthy();
    expect(entry.content).toBe("User prefers dark mode");
    expect(entry.importance_level).toBe("high"); // 0.8 >= 0.8

    const facts = store.getCriticalFacts();
    expect(facts.length).toBe(1);
    expect(facts[0].content).toBe("User prefers dark mode");
  });

  it("deduplicates identical facts by updating existing entry", () => {
    store.rememberFact("Favorite color is blue", ["pref"], "test-skill", 0.5);
    store.rememberFact("Favorite color is blue", ["pref"], "test-skill", 0.9);
    const facts = store.getCriticalFacts();
    expect(facts.length).toBe(1);
    // Importance should be max(0.5, 0.9) = 0.9
    expect(facts[0].importance).toBe(0.9);
  });

  it("records run summaries to a skill room (L2)", () => {
    store.recordRunToRoom("budget-builder", "run-1", 3, [
      "Created monthly budget",
      "Set savings target",
    ]);
    const room = store.getSkillRoom("budget-builder");
    expect(room.skill_name).toBe("budget-builder");
    expect(room.run_summaries.length).toBe(1);
    expect(room.run_summaries[0].run_id).toBe("run-1");
    expect(room.run_summaries[0].phases_completed).toBe(3);
  });

  it("adds insights to a skill room (L2)", () => {
    const insight = store.addInsight(
      "resume-builder",
      "User has 5 years experience in TypeScript",
      ["career", "skills"],
      0.7,
    );
    expect(insight.importance_level).toBe("medium"); // 0.5 <= 0.7 < 0.8
    const room = store.getSkillRoom("resume-builder");
    expect(room.insights.length).toBe(1);
  });

  it("stores and retrieves semantic memories (L3)", () => {
    store.storeSemanticMemory(
      "Budget planning helps reduce financial stress",
      ["finance", "wellness"],
      "budget-builder",
      0.6,
    );
    // Verify through recall (which searches L3)
    const results = store.recall("budget financial stress");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].tier).toBe("L3");
  });

  it("recall searches across tiers and ranks by relevance", () => {
    store.rememberFact(
      "User works in fintech startup",
      ["career", "fintech"],
      "career-pivot",
      0.9,
    );
    store.storeSemanticMemory(
      "Fintech requires strong compliance knowledge",
      ["fintech", "compliance"],
      "learn-anything",
      0.5,
    );
    const results = store.recall("fintech");
    expect(results.length).toBe(2);
    // L1 gets a 1.2x boost so should rank higher despite similar content
    expect(results[0].tier).toBe("L1");
  });

  it("getContext returns L0 identity and L1 facts together", () => {
    store.updateIdentity({ display_name: "Bob" });
    store.rememberFact("Important fact", ["tag"], "skill", 0.9);
    const ctx = store.getContext();
    expect(ctx.identity.display_name).toBe("Bob");
    expect(ctx.facts.length).toBe(1);
  });
});

// ===========================================================================
// 4. KnowledgeGraph — triples, queries, contradictions, confidence
// ===========================================================================

describe("KnowledgeGraph", () => {
  let tmpDir: string;
  let kg: KnowledgeGraph;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "kg-test-"));
    // Pass a dummy RPC URL so trust-bridge calls fail gracefully
    // and default trust score (0.5) is used
    kg = new KnowledgeGraph(tmpDir, "http://localhost:1");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("asserts a new triple and returns it", async () => {
    const { triple, contradictions } = await kg.assert(
      "TypeScript",
      "enables",
      "type safety",
      "code-review",
      "run-1",
      0.8,
    );
    expect(triple.subject).toBe("typescript"); // lowercased
    expect(triple.predicate).toBe("enables");
    expect(triple.object).toBe("type safety");
    expect(triple.valid_until).toBeNull();
    expect(contradictions).toEqual([]);
  });

  it("queries by subject and returns matching triples", async () => {
    await kg.assert("node.js", "enables", "server development", "api-design", "r1", 0.7);
    await kg.assert("node.js", "consumes", "v8 engine", "api-design", "r2", 0.6);
    await kg.assert("python", "enables", "data science", "api-design", "r3", 0.7);

    const result = kg.query("node.js");
    expect(result.total_matches).toBe(2);
    expect(result.triples.every((t) => t.subject.includes("node.js"))).toBe(true);
  });

  it("detects contradictions (same subject+predicate, different object)", async () => {
    await kg.assert("company", "produces", "widgets", "market-research", "r1", 0.7);
    const { contradictions } = await kg.assert(
      "company",
      "produces",
      "software",
      "market-research",
      "r2",
      0.8,
    );
    expect(contradictions.length).toBe(1);
    expect(contradictions[0].object).toBe("widgets");
    // The old triple should now have valid_until set
    expect(contradictions[0].valid_until).not.toBeNull();
  });

  it("filters by predicate type", async () => {
    await kg.assert("A", "caused", "B", "skill", "r1");
    await kg.assert("C", "supports", "D", "skill", "r2");
    const result = kg.query(undefined, "caused");
    expect(result.total_matches).toBe(1);
    expect(result.triples[0].predicate).toBe("caused");
  });

  it("applies confidence weighting via trust score", async () => {
    const { triple } = await kg.assert(
      "claim",
      "supports",
      "evidence",
      "research-assistant",
      "r1",
      0.9,
    );
    // confidence = input_confidence * trust_score
    // trust_score defaults to 0.5 when RPC fails
    expect(triple.confidence).toBeCloseTo(0.9 * 0.5, 1);
    expect(triple.trust_score).toBeCloseTo(0.5, 1);
  });

  it("returns entity history ordered chronologically", async () => {
    await kg.assert("project", "produces", "v1", "product-roadmap", "r1");
    await kg.assert("project", "produces", "v2", "product-roadmap", "r2");
    const hist = kg.history("project");
    expect(hist.entity).toBe("project");
    expect(hist.history.length).toBe(2);
    // First should be superseded/contradicted, second active
    expect(hist.history[0].status).toBe("contradicted");
    expect(hist.history[1].status).toBe("active");
  });

  it("getStats reports correct counts", async () => {
    await kg.assert("A", "related_to", "B", "s", "r1");
    await kg.assert("C", "related_to", "D", "s", "r2");
    await kg.assert("A", "related_to", "E", "s", "r3"); // contradicts first

    const stats = kg.getStats();
    expect(stats.total_triples).toBe(3);
    expect(stats.active_triples).toBe(2); // B was superseded, D and E active
    expect(stats.superseded_triples).toBe(1);
  });
});
