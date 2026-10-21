# pytest LLM Regression Suite with Record and Replay

**One-line description:** Builds a pytest regression suite for an LLM feature with two tiers: an always-on offline tier that replays recorded model outputs through the scorers (fast, free, deterministic) and a marker-gated live tier (`-m llm_eval`) that calls the model, compares the paired result against a committed baseline file, fails on any critical-item failure, and fails on a statistically supported drop under the rule from `evh-sample-size-confidence-intervals`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `golden_set` (string, required): `evals/data/golden.jsonl`.
- `scorer_module` (string, required): `evals/scorers.py` from `evh-py-programmatic-scorers`.
- `ci_report` (string, required): From `evh-sample-size-confidence-intervals`; supplies alpha, the paired test method and the baseline numbers.
- `project_dir` (string, required): Repository root with pytest installed.

---

## Outputs

- `regression_suite` (string): `evals/tests/test_regression_offline.py`, `evals/tests/test_regression_live.py`, `evals/tests/conftest.py`, and the `[tool.pytest.ini_options]` marker entry.
- `baseline_file` (string): `evals/baseline/<feature>.json` with per-item pass flags per criterion, the baseline `system_version`, and the gate parameters.

---

## Phase 1: Register Markers and Fixtures

### Entry Criteria
- `pytest --version` works.

### Actions
1. In `pyproject.toml` add:
   ```toml
   [tool.pytest.ini_options]
   markers = ["llm_eval: calls a live model; costs money; run with -m llm_eval"]
   addopts = "-m 'not llm_eval'"
   ```
   The `addopts` line keeps live tests out of the default `pytest` run. Running `pytest -m llm_eval` overrides it.
2. Add `--strict-markers` to `addopts` so a typo in a marker name errors instead of silently creating a new marker.
3. In `evals/tests/conftest.py` add a session fixture `golden` that loads `golden.jsonl` once, and a fixture `recorded` that loads `evals/recordings/<system_version>.jsonl` (item id to output).
4. Do not put API keys in fixtures or files. The live tier reads `ANTHROPIC_API_KEY` (or your provider's variable) from the environment and calls `pytest.skip` with a clear message when it is absent, never a silent pass.

### Output
Markers and fixtures.

### Quality Gate
- `pytest --markers | grep llm_eval` prints the marker line.
- `pytest -q` (default run) collects zero live tests: `pytest -q --collect-only -m llm_eval` lists them, `pytest -q --collect-only` does not.

---

## Phase 2: Offline Replay Tier

### Entry Criteria
- A recording exists: write `evals/tools/record.py` that runs the current system on the golden set and stores `item_id, output, system_version` lines in `evals/recordings/<system_version>.jsonl`.

### Actions
1. In `test_regression_offline.py`, parametrize over items: `@pytest.mark.parametrize("item", ITEMS, ids=[i["id"] for i in ITEMS])`. Each test scores the recorded output with the programmatic scorers and asserts the result equals the baseline flag for that item.
2. This tier tests the scorers and the parsing code, not the model. It must run in seconds and run on every commit.
3. When a scorer change legitimately changes a baseline flag, update the baseline in a separate commit that names the scorer change. Never edit baseline flags to silence a failing test without that commit message.

### Output
Offline tier.

### Quality Gate
- `pytest -q evals/tests/test_regression_offline.py` passes and prints the item count.
- Changing one recorded output to a known-bad string makes exactly that item's test fail (mutation check), then revert.

---

## Phase 3: Live Tier and Gate

### Entry Criteria
- Baseline file exists (first time: create it from the current production version's run and commit it).

### Actions
1. `test_regression_live.py` has `pytestmark = pytest.mark.llm_eval`. One session fixture runs the candidate system on all items (through the harness or the app's own client, with the judge runner for judge criteria) and caches results in `tmp_path_factory`.
2. Gate tests, each a separate test function so failures are named:
   - `test_no_critical_failures`: every item with `severity == "critical"` passes every criterion. Any failure fails the test and lists item ids.
   - `test_no_significant_drop_<criterion>`: build the paired 2x2 table against the baseline flags on items valid in both, run `statsmodels.stats.contingency_tables.mcnemar(table, exact=True)`, and fail when the candidate has more baseline-only passes than candidate-only passes AND the p-value is below the alpha recorded in `ci_report` (Holm-corrected across criteria when several gate). Print the table in the assertion message.
   - `test_error_rate_reported`: count errored items and print them; fail only if the count exceeds a limit the user set, otherwise report.
3. Write a JUnit report for CI: `pytest -m llm_eval --junitxml=reports/llm_eval.xml -q`.
4. Do NOT loosen the gate (raise alpha, mark tests `xfail`, delete critical items) to get a green run. If the gate fails, the change regressed or the baseline is stale; investigate with `evh-regression-diff-triage`.
5. Baseline update procedure: only after a release is accepted, regenerate `evals/baseline/<feature>.json` from the accepted run and commit with the new `system_version` in the message.

### Output
`regression_suite` and `baseline_file`.

### Quality Gate
- `pytest -m llm_eval -q` runs all gate tests and writes `reports/llm_eval.xml`.
- Flipping one critical item's recorded result to fail in a test copy makes `test_no_critical_failures` fail (mutation check), then revert.

---

## Worked Example

Illustrative only. Feature `support_reply`, 197 items, criteria C1 (programmatic) and C2 (judge), alpha 0.05 from `ci_report`.

- Phase 1: `pytest --collect-only -q` collects 197 offline tests; `-m llm_eval` collects 3 live tests.
- Phase 2: offline tier `197 passed in 1.84s`; mutating `test-0012` output to 300 words fails `test_offline[test-0012]`.
- Phase 3: candidate v42 run: `test_no_critical_failures` fails listing `adv-031` (injection followed). `test_no_significant_drop_C2` passes: table `[[171,6],[9,9]]`, p = 0.61. The release is blocked by the critical failure, not by the aggregate.

---

## Exit Criteria

DONE when the default `pytest` run includes only the offline tier, the live tier runs under `-m llm_eval` with named critical, paired-drop and error gates, a baseline file is committed, and both mutation checks failed as expected.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Live tests run in the default suite | **Adjust**: fix `addopts`; confirm with `--collect-only`. |
| Phase 2 | Recording missing for the current `system_version` | **Retry**: run `evals/tools/record.py` and commit the recording. |
| Phase 3 | Gate fails | **Return**: run `evh-regression-diff-triage`; do not edit gates or baselines to pass. |
| Phase 3 | Many API errors during the live run | **Retry**: rerun the errored items only; report the error count. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
