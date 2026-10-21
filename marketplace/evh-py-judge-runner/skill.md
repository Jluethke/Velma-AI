# Python Judge Runner with Forced Tool Output

**One-line description:** Implements an async Python runner that calls the judge model through the Anthropic Python SDK with a forced tool call whose input schema is the verdict schema, bounded concurrency with asyncio.Semaphore, SDK retries, an on-disk cache keyed by a hash of every prompt input, and per-call token and latency logging, so judge verdicts are schema-valid, reproducible and cheap to rerun.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `judge_prompt` (string, required): Directory `evals/judge/` from `evh-judge-prompt-design` with prompts, `verdict_schema.json`, `judge_config.yaml`.
- `model_ids` (object, required): Judge model id and generation parameters from config (see `evh-prompt-model-versioning`).
- `project_dir` (string, required): Repository root with Python 3.10 or newer.

---

## Outputs

- `judge_runner` (string): Path to `evals/judge_runner.py` exposing `async def judge(item: dict, reply: str, criterion_id: str) -> dict` and a CLI `python evals/judge_runner.py --in outputs.jsonl --out verdicts.jsonl --criterion C2`, writing one verdict row per item with `evidence_quote`, `reasoning`, `verdict`, `input_tokens`, `output_tokens`, `latency_ms`, `cache_hit`, `judge_model`.

---

## Phase 1: Single Call with Forced Tool Use

### Entry Criteria
- `pip install anthropic pyyaml` done; `ANTHROPIC_API_KEY` is set in the environment (never in a file in the repo).

### Actions
1. Create `evals/judge_runner.py`. Build the tool from the schema:
   `tool = {"name": "record_verdict", "description": "Record the grade.", "input_schema": json.load(open("evals/judge/verdict_schema.json"))}`
2. Call with the tool forced:
   `resp = await client.messages.create(model=JUDGE_MODEL, max_tokens=MAX_TOKENS, system=rendered_prompt, messages=[{"role": "user", "content": "Grade the reply now."}], tools=[tool], tool_choice={"type": "tool", "name": "record_verdict"})`
   where `client = anthropic.AsyncAnthropic()`. `MAX_TOKENS` comes from config; it must be large enough that the verdict is not cut off (see Phase 2 gate).
3. Read the verdict: `block = next(b for b in resp.content if b.type == "tool_use")`; `verdict = block.input`. Validate with `jsonschema.validate(verdict, schema)`. If `resp.stop_reason == "max_tokens"`, the call was truncated: record `error: "truncated"`, never a verdict.
4. Set the sampling temperature from config. Some model versions restrict sampling parameters; if the API rejects a parameter, read the error, remove only that parameter, and record the change in the manifest. Do not guess.
5. Do NOT parse a verdict out of free text with a regex when tool use is available. Do NOT default a missing verdict to `pass` or `fail`; record it as an error.

### Output
A working single-call `judge()` function.

### Quality Gate
- `python evals/judge_runner.py --in evals/data/sample3.jsonl --out /tmp/v.jsonl --criterion C2` writes 3 rows, each passing `jsonschema.validate`.
- `grep -c '"error"' /tmp/v.jsonl` is 0 on the 3-item sample.

---

## Phase 2: Concurrency, Retries, Cache

### Entry Criteria
- Single call works.

### Actions
1. Concurrency: `sem = asyncio.Semaphore(N)` with `N` from config, and wrap each call in `async with sem:`. Start `N` at the value your provider rate limit allows (read your organization's rate limits page); lower it if you see 429 errors.
2. Retries: the SDK retries some errors itself (connection errors, 408, 409, 429, 5xx; default 2 retries, set by `AsyncAnthropic(max_retries=K)`). Do not wrap your own retry loop around it unless you need more; if you do, use exponential backoff with jitter and honor the `retry-after` header.
3. Cache: key = sha256 of `json.dumps({"model":..., "params":..., "system": rendered_prompt, "messages":..., "tool": tool}, sort_keys=True)`. Store each response as `evals/.cache/judge/<key>.json` (add `evals/.cache/` to `.gitignore`). On a hit, return the cached verdict and set `cache_hit: true`. A change to the prompt, model or schema changes the key, so stale verdicts are never reused.
4. Logging per call: `resp.usage.input_tokens`, `resp.usage.output_tokens`, and when prompt caching is used `resp.usage.cache_read_input_tokens` and `resp.usage.cache_creation_input_tokens`; latency from `time.perf_counter()` around the call; `resp.model` (the model id the API reports).
5. For large offline runs where results can wait, the Message Batches API (`client.messages.batches.create(requests=[{"custom_id": ..., "params": {...}}])`) is available at reduced cost per the provider's pricing page; poll `client.messages.batches.retrieve(id)` and read results when `processing_status == "ended"`. Keep the same cache key logic.

### Output
Full runner with concurrency, cache and logging.

### Quality Gate
- Running the CLI twice on the same 20 items: second run shows `cache_hit: true` on all 20 and makes zero API calls (count log lines).
- Changing one word in the judge prompt and rerunning shows `cache_hit: false` on all 20.
- No row has `max_tokens` truncation (`grep -c truncated` is 0).

---

## Phase 3: Determinism Check

### Entry Criteria
- Runner complete.

### Actions
1. Disable the cache (`--no-cache`) and run the judge 3 times on the same 30 dev items.
2. Compute per-item agreement across the 3 runs. Items whose verdict changes between runs are judge-unstable; list their ids in `evals/judge/UNSTABLE.md`.
3. If unstable items exist, record the instability rate; `evh-judge-calibration` and `evh-repeat-variance-epochs` use it. Do not hide it by caching one run.

### Output
`judge_runner` plus instability record.

### Quality Gate
- `evals/judge/UNSTABLE.md` exists and states the count of unstable items out of 30 (zero is a valid result).

---

## Worked Example

Illustrative only. Criterion C2, 197 test replies, `N = 8` from config.

- Phase 1: 3-item sample writes 3 schema-valid rows, e.g. `{"evidence_quote":"We'll refund you right away","reasoning":"Promise of refund; refund_eligible is false.","verdict":"fail","input_tokens":1840,"output_tokens":61,"latency_ms":2130,"cache_hit":false}`.
- Phase 2: first full run 197 calls, two 429s retried by the SDK; second run 197 cache hits, 0 calls. One word changed in `C2.txt`: 197 misses.
- Phase 3: 3 uncached runs on 30 dev items: 2 items flip (`dev-0219`, `dev-0388`), both ambiguous "we'll see what we can do" replies; recorded in `UNSTABLE.md`.

---

## Exit Criteria

DONE when the runner returns schema-valid verdicts via forced tool use, caches by full input hash, logs tokens and latency per call, and judge instability on repeated uncached runs is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `tool_use` block missing from the response | **Retry**: once; if still missing, record `error` and inspect `resp.stop_reason`. |
| Phase 1 | API rejects a parameter | **Adjust**: remove that parameter only, record it in the manifest. |
| Phase 2 | Persistent 429 errors | **Adjust**: lower `N`; check the rate limit headers in the error. |
| Phase 2 | Cache returns verdicts after the prompt changed | **Stop**: the key misses an input; add it to the hashed payload. |
| Phase 3 | Many unstable items | **Return**: sharpen the anchors in `evh-judge-prompt-design` for the unstable cases. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
