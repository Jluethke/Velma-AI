# Normalize Eval Results to One Row Schema

**One-line description:** Converts an Inspect AI log or a promptfoo results JSON into one long-format JSONL table (one row per item, epoch and criterion) with stratum, system version, pass flag, error flag, tokens and latency, so every downstream statistic, cost and regression flow reads the same schema regardless of harness.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `inspect_log` (string, optional): Log directory from `evh-py-inspect-ai-task`. Present when the Python stack ran.
- `promptfoo_results` (string, optional): `results.json` path from `evh-promptfoo-config`. Present when the Node stack ran.
- `strata_manifest` (object, required): From `evh-test-set-stratify`; supplies stratum per item id when the harness log lacks it.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `scored_results` (string): Path to `logs/<system_version>/scored.jsonl` with columns `system_version, item_id, group_id, stratum, split, severity, epoch, criterion, passed, value, error, input_tokens, output_tokens, cache_read_tokens, latency_ms, model`.

---

## Phase 1: Choose the Reader

### Entry Criteria
- Exactly one of `inspect_log` or `promptfoo_results` is present. If both are present, run this flow once per input and keep the files separate.

### Actions
1. Inspect logs: write `evals/tools/normalize_inspect.py` using `from inspect_ai.log import read_eval_log`. For each `.eval` file in the directory: `log = read_eval_log(path)`; for each `s in log.samples`, for each `name, sc in s.scores.items()` emit one row: `item_id=s.id`, `epoch=s.epoch`, `criterion=name`, `passed = sc.value == "C"` (Inspect's `CORRECT` constant is `"C"`; print `inspect_ai.scorer.CORRECT` to confirm), `value=sc.value`, `error = s.error is not None`. Token usage: read `s.model_usage` if present (a mapping of model name to usage with `input_tokens` and `output_tokens`); print `dir(s)` once to confirm field names in your version.
2. promptfoo results: write `evals/tools/normalize_promptfoo.mjs`. Load the JSON; for each row in `results.results`, for each entry in `gradingResult.componentResults` emit one row with `criterion = entry.assertion.metric`, `passed = entry.pass`, `value = entry.score`; `error = Boolean(row.error)`; `latency_ms = row.latencyMs`; tokens from `row.response.tokenUsage` (`prompt`, `completion`, `cached` keys in current versions; print one row to confirm). `item_id` and `stratum` come from `row.testCase.metadata`. Repeats appear as separate rows; number them as epochs per test.
3. Never infer `passed` from a numeric score with a cutoff you chose. Use the harness's own pass flag or the scorer's `CORRECT` value.

### Output
Reader script for the harness in use.

### Quality Gate
- Script runs without exception on the run's files.
- Printed row count equals items times epochs times criteria, minus nothing (errors still get rows with `error: true`).

---

## Phase 2: Join, Validate, Write

### Entry Criteria
- Raw rows produced.

### Actions
1. Join missing `stratum`, `group_id`, `split`, `severity` by `item_id` from `strata_manifest` and `golden.jsonl`. Every row must have a stratum.
2. Read `system_version` and `model` from the copied `version_manifest.json` in the log directory.
3. Validate with a fixed check: no duplicate `(item_id, epoch, criterion)`; `passed` is boolean or null; rows with `error: true` have `passed: null`. A row that errored must never count as a fail or a pass.
4. Write `logs/<system_version>/scored.jsonl` and print a summary: rows, errors, distinct items, epochs, criteria.

### Output
`scored_results`.

### Quality Gate
- `python -c "import json,collections;r=[json.loads(l) for l in open('logs/<v>/scored.jsonl')];k=collections.Counter((x['item_id'],x['epoch'],x['criterion']) for x in r);print(max(k.values()), sum(1 for x in r if x['error'] and x['passed'] is not None), sum(1 for x in r if not x.get('stratum')))"` prints `1 0 0`.

---

## Worked Example

Illustrative only. Inspect log in `logs/a41f0c9e2b7d/` with 197 samples, 1 epoch, 3 scorers.

- Phase 1: `normalize_inspect.py` emits 591 rows; 6 rows (2 samples times 3 scorers) carry `error: true`.
- Phase 2: strata joined from the manifest; validation prints `1 0 0`. Summary: `rows=591 errors=6 items=197 epochs=1 criteria=3`.

---

## Exit Criteria

DONE when `scored.jsonl` exists with one row per item, epoch and criterion, every row has stratum and system version, and errored rows have `passed: null`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Neither input present | **Stop**: run the harness flow first. |
| Phase 1 | Field names differ from this flow in your harness version | **Adjust**: print one raw sample, map the real field names, and record the version. |
| Phase 2 | Item ids missing from the strata manifest | **Stop**: the run used a different dataset version; compare dataset sha256 in the manifests. |
| Phase 2 | Duplicate keys | **Adjust**: two log files cover the same run; keep the newer one and record the choice. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
