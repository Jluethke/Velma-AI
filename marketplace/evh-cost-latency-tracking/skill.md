# Eval Cost and Latency Tracking

**One-line description:** Computes per-request cost from the token usage the API returned (input, output, cache read and cache write tokens priced separately from a user-supplied price table), measures time to first token with streaming and total latency, reports p50, p95 and p99 per stratum with the percentile method stated, and splits system-under-test spend from judge spend.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scored_results` (string, required): `scored.jsonl` with token and latency columns from `evh-results-normalize`.
- `price_table` (object, required): Per model id, the price per million tokens for input, output, cache write and cache read, copied from the provider's current pricing page with the date read. Never filled from memory.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `cost_latency_report` (string): `logs/<system_version>/COST_LATENCY.md` and `cost_latency.json`: total and per-request cost for the system and the judge separately, projected cost per 1,000 production requests, TTFT and total latency percentiles overall and per stratum, output-token percentiles, and the count of requests that hit `max_tokens`.

---

## Phase 1: Capture Usage and Timing Correctly

### Entry Criteria
- The harness or runner logs usage per request. If not, add it before measuring.

### Actions
1. Token fields to record per request (Anthropic Messages API names; other providers name them differently, read their response docs): `usage.input_tokens`, `usage.output_tokens`, `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`. Cache tokens are billed at different rates from plain input tokens; summing them into one input number misprices the run.
2. Latency: wrap the call with `time.perf_counter()` (Python) or `performance.now()` (Node). For time to first token, use streaming and record the time of the first text delta:
   Python: `with client.messages.stream(...) as stream:` then iterate `for text in stream.text_stream:` and record the time on the first iteration.
   Node: `const stream = client.messages.stream({...}); stream.on("text", ...)` and record the first event time.
3. Latency measured inside an eval with concurrency N is not production latency: queueing in your own semaphore and provider rate limiting add delay. Record the concurrency used next to every latency number, and for latency claims run a separate sequential sample.
4. Record `stop_reason`. Requests ending in `max_tokens` were truncated; count them.
5. Judge calls are logged with the same fields but tagged `role: judge`.

### Output
Per-request usage and timing in `scored.jsonl` (or a joined `usage.jsonl`).

### Quality Gate
- No row with `error: false` has null `input_tokens` or `output_tokens`.
- Every latency number has the concurrency recorded beside it.

---

## Phase 2: Compute Cost

### Entry Criteria
- `price_table` provided with the date it was read.

### Actions
1. Per request: `cost = (input*p_in + output*p_out + cache_write*p_cw + cache_read*p_cr) / 1_000_000` using the row's model id to select prices.
2. If the run used a batch API or other discounted mode, apply the discount stated on the provider's pricing page to those requests only and record it.
3. Sum separately for `role: system` and `role: judge`. Report eval cost (both) and production cost projection (system only): `mean cost per request * 1000`.
4. Cross-check: compare your computed total for the run against the provider console or usage API for the same time window. A large gap means missing rows or wrong prices.

### Output
Cost figures in `cost_latency.json`.

### Quality Gate
- Computed total and provider console total for the window are both written in the report with their difference.
- The `price_table` date is printed in the report header.

---

## Phase 3: Percentiles and Report

### Entry Criteria
- Cost and latency columns complete.

### Actions
1. Percentiles: `numpy.percentile(lat_ms, [50, 95, 99])`. NumPy's default `method="linear"` interpolates; state the method. For tails, report "n too small for p99" instead of a number when `n < 100` (with fewer than 100 values the 99th percentile is interpolated between the two largest observations and is not a real estimate).
2. Per stratum: long-input strata often dominate p95. Report each.
3. Output-token distribution: p50 and p95 of `output_tokens`; compare with `max_tokens` from config. If p95 is near the limit, truncation risk is high.
4. Compare with the baseline run's report: show deltas in cost per 1,000 requests and p95 latency. These are descriptive; latency comparisons between runs at different times are confounded by provider load, so rerun both versions in the same window when a latency claim decides a release.
5. If `task_spec.hard_constraints` sets latency or cost ceilings, mark each pass or fail with the measured value.

### Output
`cost_latency_report`.

### Quality Gate
- `COST_LATENCY.md` states percentile method, n, concurrency, and price date.
- Every ceiling from `task_spec` is marked pass or fail with its measured value.

---

## Worked Example

Illustrative only. 197 items, concurrency 8, system and judge models priced from the provider page read 2026-10-20 (prices are the user's input).

- Phase 1: all 195 valid rows have tokens; 2 requests hit `max_tokens`. Sequential latency sample of 40 items run separately.
- Phase 2: system cost 0.38 USD for the run, judge 0.91 USD; production projection 1.95 USD per 1,000 requests. Console total for the window 1.31 USD vs computed 1.29 USD.
- Phase 3: sequential TTFT p50 610 ms, p95 1,240 ms; total latency p50 2.8 s, p95 5.9 s (n = 40, so p99 not reported). Stratum `long_input` p95 9.1 s. `task_spec` ceiling "p95 total latency under 8 s" passes overall, fails for `long_input`.

---

## Exit Criteria

DONE when every valid request has priced tokens, system and judge spend are separated, latency percentiles state method, n and concurrency, and every product ceiling is marked with its measured value.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Harness does not log cache token fields | **Adjust**: log the raw `usage` object from the runner and join it by request id. |
| Phase 2 | Price table missing or undated | **Stop**: ask for current prices from the provider page; do not use remembered prices. |
| Phase 2 | Computed total far from console | **Retry**: look for missing rows, retried calls not logged, or wrong model mapping. |
| Phase 3 | Latency compared across days | **Adjust**: rerun both versions in one window before claiming a latency change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
