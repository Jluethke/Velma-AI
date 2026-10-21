# TypeScript Judge Runner with Forced Tool Output

**One-line description:** Implements a TypeScript judge runner on the Anthropic TypeScript SDK (`@anthropic-ai/sdk`) with a forced tool call whose input schema is the verdict schema, Ajv validation of the tool input, p-limit concurrency, SDK retries, a content-hash disk cache, and per-call token and latency logging.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `judge_prompt` (string, required): Directory `evals/judge/` with prompts, `verdict_schema.json`, `judge_config.yaml`.
- `model_ids` (object, required): Judge model id and generation parameters from config.
- `project_dir` (string, required): Repository root with Node.js 18 or newer (global `fetch` and `crypto` available).

---

## Outputs

- `judge_runner` (string): Path to `evals/judgeRunner.ts` exporting `judge(item, reply, criterionId): Promise<Verdict>` and a CLI `npx tsx evals/judgeRunner.ts --in outputs.jsonl --out verdicts.jsonl --criterion C2`, writing `evidence_quote`, `reasoning`, `verdict`, `input_tokens`, `output_tokens`, `latency_ms`, `cache_hit`, `judge_model` per row.

---

## Phase 1: Single Call with Forced Tool Use

### Entry Criteria
- `npm install @anthropic-ai/sdk ajv p-limit yaml` and `npm install --save-dev tsx` done; `ANTHROPIC_API_KEY` set in the environment.

### Actions
1. In `evals/judgeRunner.ts`: `import Anthropic from "@anthropic-ai/sdk"; const client = new Anthropic();` (reads `ANTHROPIC_API_KEY`).
2. Tool from schema: `const tool = { name: "record_verdict", description: "Record the grade.", input_schema: schema };`
3. Call: `const resp = await client.messages.create({ model: JUDGE_MODEL, max_tokens: MAX_TOKENS, system: renderedPrompt, messages: [{ role: "user", content: "Grade the reply now." }], tools: [tool], tool_choice: { type: "tool", name: "record_verdict" } });`
4. Extract: `const block = resp.content.find((b) => b.type === "tool_use");` then validate `block.input` with `ajv.compile(schema)`. If `resp.stop_reason === "max_tokens"`, record `error: "truncated"`.
5. Set temperature from config; if the API rejects a sampling parameter for this model, remove only that one and record it.
6. Do NOT `JSON.parse` a verdict out of free text. Do NOT treat a missing verdict as pass or fail.

### Output
Working single-call `judge()`.

### Quality Gate
- `npx tsx evals/judgeRunner.ts --in evals/data/sample3.jsonl --out tmp/v.jsonl --criterion C2` writes 3 rows that all pass Ajv validation.
- `npx tsc --noEmit -p evals` exits 0.

---

## Phase 2: Concurrency, Retries, Cache

### Entry Criteria
- Single call works.

### Actions
1. Concurrency: `import pLimit from "p-limit"; const limit = pLimit(N);` and `await Promise.all(items.map((it) => limit(() => judge(...))))`. `N` comes from config and your provider rate limits. Never `Promise.all` over unbounded calls.
2. Retries: the SDK retries connection errors, 408, 409, 429 and 5xx by default (2 retries; set `new Anthropic({ maxRetries: K })`). Per-request timeout: `new Anthropic({ timeout: ms })`. Check the SDK README for current defaults.
3. Cache: `createHash("sha256").update(JSON.stringify({ model, params, system: renderedPrompt, messages, tool })).digest("hex")` from `node:crypto`; store `evals/.cache/judge/<key>.json`; add `evals/.cache/` to `.gitignore`. Note: `JSON.stringify` key order follows insertion order; build the object with a fixed key order or sort keys before hashing.
4. Log per call: `resp.usage.input_tokens`, `resp.usage.output_tokens`, `resp.usage.cache_read_input_tokens`, `resp.usage.cache_creation_input_tokens` (when present), latency via `performance.now()`, and `resp.model`.
5. For offline bulk runs, `client.messages.batches.create({ requests: [...] })` is available; read the SDK docs for result retrieval.

### Output
Full runner.

### Quality Gate
- Second run on the same 20 items reports 20 cache hits and zero API calls.
- One-word judge prompt edit causes 20 misses.
- `grep -c truncated` on the output is 0.

---

## Phase 3: Determinism Check

### Entry Criteria
- Runner complete.

### Actions
1. Run 3 times with `--no-cache` on the same 30 dev items.
2. List items whose verdict changed across runs in `evals/judge/UNSTABLE.md` with the count.
3. Hand the instability count to `evh-judge-calibration`.

### Output
`judge_runner` plus instability record.

### Quality Gate
- `evals/judge/UNSTABLE.md` states unstable count out of 30.

---

## Worked Example

Illustrative only. Criterion C3 "Does every question in the message get an answer or an explicit deferral?", 197 items, `N = 8`.

- Phase 1: `npx tsx evals/judgeRunner.ts --in evals/data/sample3.jsonl --out tmp/v.jsonl --criterion C3` writes 3 valid rows; `tsc --noEmit` clean.
- Phase 2: first run 197 calls in about 4 minutes, one 529 overloaded error retried by the SDK; second run 197 hits.
- Phase 3: 1 of 30 items unstable (`dev-0150`, two questions where the second is rhetorical).

---

## Exit Criteria

DONE when the TypeScript runner returns Ajv-valid verdicts via forced tool use, runs with bounded concurrency, caches by input hash, logs usage and latency, and instability is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `p-limit` import fails under CommonJS | **Adjust**: `p-limit` is ESM-only in current majors; run with `tsx` or set `"type": "module"`, or pin a CommonJS-compatible major after checking its changelog. |
| Phase 1 | `tool_use` block missing | **Retry**: once; then record `error` with `stop_reason`. |
| Phase 2 | Cache keys differ for identical inputs | **Adjust**: sort keys before hashing. |
| Phase 2 | Persistent rate limit errors | **Adjust**: lower `N`. |
| Phase 3 | High instability | **Return**: tighten anchors in `evh-judge-prompt-design`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
