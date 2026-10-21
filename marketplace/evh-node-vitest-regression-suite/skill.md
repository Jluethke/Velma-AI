# Vitest LLM Regression Suite with Record and Replay

**One-line description:** Builds a Vitest regression suite for an LLM feature with a default offline project that replays recorded outputs through the TypeScript scorers and a separate live project (selected with `--project live`) that calls the model, fails on any critical-item failure, and fails on a paired drop against a committed baseline using an exact McNemar test computed from the binomial distribution.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `golden_set` (string, required): `evals/data/golden.jsonl`.
- `scorer_module` (string, required): `evals/scorers.ts` from `evh-node-programmatic-scorers`.
- `ci_report` (string, required): From `evh-sample-size-confidence-intervals`; supplies alpha and baseline numbers.
- `project_dir` (string, required): Repository root with Vitest installed.

---

## Outputs

- `regression_suite` (string): `vitest.config.ts` with `offline` and `live` projects, `evals/regression.offline.test.ts`, `evals/regression.live.test.ts`, `evals/stats.ts`.
- `baseline_file` (string): `evals/baseline/<feature>.json` with per-item pass flags, baseline `system_version`, and gate parameters.

---

## Phase 1: Split Offline and Live Projects

### Entry Criteria
- `npx vitest --version` works. Check whether your Vitest major supports `test.projects` (Vitest 3.2 and later) or needs a workspace file (`vitest.workspace.ts` in older majors); read the Vitest docs for your version.

### Actions
1. In `vitest.config.ts` define two projects: `offline` including `evals/**/*.offline.test.ts`, and `live` including `evals/**/*.live.test.ts` with a longer `testTimeout` (from your measured p99 latency times batch size, not a guess).
2. `package.json` scripts: `"test": "vitest run --project offline"`, `"eval:live": "vitest run --project live --reporter=default --reporter=junit --outputFile.junit=reports/llm_eval.xml"`. Confirm reporter flags with `npx vitest run --help`.
3. The live project checks `process.env.ANTHROPIC_API_KEY` and fails with a clear message when missing (`throw new Error("ANTHROPIC_API_KEY not set; live eval cannot run")`), never a silent skip in CI.

### Output
Config with two projects.

### Quality Gate
- `npx vitest list --project offline` lists only offline files (if your version lacks `vitest list`, use `npx vitest run --project offline --reporter=verbose` and read the file names).
- `npm test` does not make any network call (run with the API key unset; it still passes).

---

## Phase 2: Offline Replay Tier

### Entry Criteria
- Recording `evals/recordings/<system_version>.jsonl` exists (create with `npx tsx evals/tools/record.ts`).

### Actions
1. `regression.offline.test.ts`: load golden and recordings at module top, then `it.each(items)("$id", (item) => { expect(scoreAll(recorded[item.id], item)).toEqual(baseline.items[item.id]); })`.
2. This tier tests scorers and parsing only; it must stay fast and free.
3. Baseline flag changes caused by a scorer change go in a separate commit naming that change.

### Output
Offline tier.

### Quality Gate
- `npm test` passes and reports the item count.
- Mutating one recorded output fails exactly that item's test; revert.

---

## Phase 3: Live Tier and Paired Gate

### Entry Criteria
- Baseline file committed.

### Actions
1. `evals/stats.ts`: implement the exact McNemar p-value as a two-sided binomial test on discordant counts `b` (baseline-only passes) and `c` (candidate-only passes): `p = min(1, 2 * sum_{i=0}^{min(b,c)} C(b+c, i) * 0.5^(b+c))`. Compute with log-gamma or BigInt-free iterative products to avoid overflow. Test it: `mcnemarExact(6, 9)` must be about `0.607` and `mcnemarExact(0, 10)` about `0.00195` (these match `scipy.stats.binomtest(6, 15)` and `binomtest(0, 10)`).
2. `regression.live.test.ts`: in `beforeAll`, run the candidate on all items (via the app's client and the judge runner) with bounded concurrency; then:
   - `it("no critical failures")`: all `severity: critical` items pass all criteria; message lists failing ids.
   - `it.each(criteria)("no significant drop: %s")`: fail when `b > c` and `mcnemarExact(b, c) < alpha` (alpha from `ci_report`, Holm-corrected across gating criteria).
   - `it("reports errors")`: print errored ids; fail only past a user-set limit.
3. Do not mark failing gate tests `.skip` or `.fails`, and do not lower alpha after seeing results.
4. Baseline update: only after a release is accepted; regenerate and commit with the new `system_version`.

### Output
`regression_suite` and `baseline_file`.

### Quality Gate
- `npx vitest run evals/stats.test.ts` passes the two McNemar reference values.
- `npm run eval:live` writes `reports/llm_eval.xml`.
- Forcing a critical item to fail in a test copy fails "no critical failures"; revert.

---

## Worked Example

Illustrative only. Feature `ticket_classifier`, 412 items, one programmatic criterion, alpha 0.05.

- Phase 1: Vitest 3.2 `test.projects` config; `npm test` passes with the key unset.
- Phase 2: offline tier `Tests 412 passed`; mutating `t-0090` to `"category":"Other"` fails `t-0090` only.
- Phase 3: `mcnemarExact(6, 9)` = 0.6072, `mcnemarExact(0, 10)` = 0.00195. Candidate v8: b = 17, c = 5, p = 0.0169 < 0.05; "no significant drop: category" fails. Triage starts.

---

## Exit Criteria

DONE when `npm test` runs only the offline replay, `npm run eval:live` runs critical, paired-drop and error gates with a JUnit report, the McNemar helper matches the reference values, and a baseline is committed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `projects` option not recognized | **Adjust**: use a workspace file per the docs for your Vitest major. |
| Phase 2 | Recording missing | **Retry**: run the recorder and commit the file. |
| Phase 3 | McNemar helper disagrees with the reference | **Stop**: fix the helper before any gate uses it. |
| Phase 3 | Gate fails | **Return**: run `evh-regression-diff-triage`; never edit gates to pass. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
