import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { evaluateCondition } from "../chain-condition.js";

describe("evaluateCondition", () => {
  const ctx = {
    stack: "python",
    product_scope: { has_firmware: true, needs_harness: false },
    refactorings: ["rename", "inline"],
    stampede_plan: { techniques: ["lock"] },
    cache_backend: "redis",
    intake: { reviewers: ["a", "b"] },
    count: 3,
  };

  it("treats a missing condition as true", () => {
    expect(evaluateCondition(undefined, ctx)).toBe(true);
    expect(evaluateCondition("", ctx)).toBe(true);
  });

  it("compares strings and booleans", () => {
    expect(evaluateCondition("stack == 'python'", ctx)).toBe(true);
    expect(evaluateCondition("stack == 'go'", ctx)).toBe(false);
    expect(evaluateCondition("stack != 'go'", ctx)).toBe(true);
    expect(evaluateCondition("product_scope.has_firmware == true", ctx)).toBe(true);
    expect(evaluateCondition("product_scope.needs_harness == true", ctx)).toBe(false);
  });

  it("supports symbol and word boolean operators with parentheses", () => {
    expect(evaluateCondition("stack == 'cpp' || stack == 'python'", ctx)).toBe(true);
    expect(evaluateCondition("stack == 'cpp' or stack == 'rust'", ctx)).toBe(false);
    expect(evaluateCondition("stack == 'python' && (cache_backend == 'redis' || stack == 'go')", ctx)).toBe(true);
    expect(evaluateCondition("'lock' in stampede_plan.techniques and cache_backend == 'redis'", ctx)).toBe(true);
    expect(evaluateCondition("not stack == 'go'", ctx)).toBe(true);
  });

  it("supports in, not in, lists, numbers and length", () => {
    expect(evaluateCondition("'rename' in refactorings", ctx)).toBe(true);
    expect(evaluateCondition("'dead_code' in refactorings", ctx)).toBe(false);
    expect(evaluateCondition("'dead_code' not in refactorings", ctx)).toBe(true);
    expect(evaluateCondition("stack in ['python', 'node']", ctx)).toBe(true);
    expect(evaluateCondition("count > 2", ctx)).toBe(true);
    expect(evaluateCondition("intake.reviewers.length > 0", ctx)).toBe(true);
    expect(evaluateCondition("refactorings != []", ctx)).toBe(true);
  });

  it("returns null when a value is not in the context yet", () => {
    expect(evaluateCondition("sync_strategy.strategy == 'rebase'", ctx)).toBeNull();
    expect(evaluateCondition("'oidc' in api_inventory.auth_schemes", ctx)).toBeNull();
  });

  it("lets a known side decide even when the other side is unresolved", () => {
    expect(evaluateCondition("stack == 'python' || missing == 'x'", ctx)).toBe(true);
    expect(evaluateCondition("stack == 'go' && missing == 'x'", ctx)).toBe(false);
    expect(evaluateCondition("stack == 'python' && missing == 'x'", ctx)).toBeNull();
  });

  it("returns null for unparseable or template text", () => {
    expect(evaluateCondition("stack === 'python'", ctx)).toBeNull();
    expect(evaluateCondition("${intake.reviewers.length} > 0", ctx)).toBeNull();
    expect(evaluateCondition("stack == 'python", ctx)).toBeNull();
  });

  it("parses every condition in the published marketplace chains", () => {
    const dir = join(__dirname, "..", "..", "..", "marketplace", "chains");
    if (!existsSync(dir)) return;
    const unparsed: string[] = [];
    for (const f of readdirSync(dir).filter(n => n.endsWith(".chain.json"))) {
      const chain = JSON.parse(readFileSync(join(dir, f), "utf-8"));
      for (const s of chain.steps ?? []) {
        if (!s.condition || s.condition.includes("${")) continue;
        // With an empty context every path is unresolved, so a parseable condition
        // yields null only through unresolved paths. Supplying a context with every
        // referenced path set to a string proves the grammar accepts it.
        const paths = s.condition.replace(/'[^']*'|"[^"]*"/g, "").match(/[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*/g) ?? [];
        const probe: Record<string, unknown> = {};
        for (const p of paths) {
          if (["and", "or", "not", "in", "true", "false", "null", "None"].includes(p)) continue;
          const keys = p.split(".").filter((k: string) => k !== "length");
          let cur = probe;
          keys.forEach((k: string, i: number) => {
            if (i === keys.length - 1) { if (!(k in cur)) cur[k] = []; }
            else { cur[k] = (cur[k] && typeof cur[k] === "object" && !Array.isArray(cur[k])) ? cur[k] : {}; cur = cur[k] as Record<string, unknown>; }
          });
        }
        if (evaluateCondition(s.condition, probe) === null) unparsed.push(`${f}: ${s.condition}`);
      }
    }
    expect(unparsed).toEqual([]);
  });
});
