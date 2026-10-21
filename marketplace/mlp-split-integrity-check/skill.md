# Verify Split Integrity

**One-line description:** Runs a pytest suite against the saved split file that proves rows are disjoint, groups never cross splits, time windows are ordered with the label gap, and duplicates do not straddle train and test, then publishes the single `split_manifest` every later step reads.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `random_split` (object, optional): From `mlp-split-random-stratified`, when that flow ran.
- `time_split` (object, optional): From `mlp-split-time-based`, when that flow ran.
- `group_split` (object, optional): From `mlp-split-grouped`, when that flow ran.
- `data_version` (object, required): From `mlp-dvc-version-raw-data`.
- `split_strategy` (string, required): `random`, `time` or `group`; selects which split object is checked.

---

## Outputs

- `split_manifest` (object): Path to `data/splits/split.parquet`, its md5, the strategy, seed, gap, group column, row counts per split, and the path of the passing test file.
- `split_violations` (object[]): Every failed check with the offending row IDs or group IDs (first 20) and counts. Empty when the split is clean.

---

## Phase 1: Select the Split and Write the Tests

### Entry Criteria
- Exactly one of `random_split`, `time_split`, `group_split` is non-empty, and it matches `split_strategy`.

### Actions
1. Read the split object for `split_strategy`. If two are non-empty, **Stop**: two split flows ran and the project has two truths.
2. Create `tests/test_split_integrity.py`. Do not edit other test files in this flow.
3. Write these tests (all strategies):
   - `test_every_row_assigned_once`: join the split file to the data on `row_id`; assert no missing and no duplicated `row_id`.
   - `test_splits_disjoint`: assert the `row_id` sets of `train`, `val`, `test` have empty pairwise intersections.
   - `test_no_duplicate_straddle`: hash feature columns per row (same hash as `mlp-leakage-audit`); assert no hash appears in both `train` and `test`.
   - `test_split_file_matches_manifest`: assert the md5 of `split.parquet` equals the md5 recorded in the split object.
4. Add strategy-specific tests:

| `split_strategy` | Extra test |
|---|---|
| `time` | `test_time_order_with_gap`: `max(train.time) + gap <= min(val.time)` and same for val to test; per CV fold, `max(train.time) < min(eval.time)` |
| `group` | `test_groups_disjoint`: group sets pairwise disjoint across splits and across each fold's train/eval |
| `random` | `test_stratified_rates`: per-split label counts match `round(rate * n)` within one row per class of what stratification produces, computed from the counts, not a fixed tolerance |

### Output
`tests/test_split_integrity.py`.

### Quality Gate
- `pytest --collect-only -q tests/test_split_integrity.py` lists 4 tests plus the strategy-specific test.

---

## Phase 2: Run, Mutation-Check, Publish

### Entry Criteria
- Tests collected.

### Actions
1. Run `pytest -q tests/test_split_integrity.py`. Read the summary line (`N passed`).
2. Prove the tests can fail: copy the split file to a temp path, move one test `row_id` into `train` (and for `group`, move one row of a test group), point the test at the copy via an environment variable, and run again. At least one test must fail. Then delete the temp copy. A test that cannot fail checks nothing.
3. Do NOT weaken an assertion, add `pytest.mark.skip`, or `xfail` to get green. A failing integrity test means the split is wrong.
4. On pass, write `split_manifest` with the file path, md5 (`md5sum data/splits/split.parquet`), strategy and parameters.
5. On fail, write each failure to `split_violations` and return to the split flow that produced the file.
6. Track the split file with DVC so its version is pinned: `dvc add data/splits/split.parquet` (or declare it as a stage output in `mlp-dvc-pipeline-stages`; do one, not both).

### Output
`split_manifest`, `split_violations`.

### Quality Gate
- `pytest -q tests/test_split_integrity.py` prints only `passed` results on the real file.
- The mutated copy produced at least one `failed` result.

---

## Worked Example

Illustrative only.

Input: `split_strategy` = `group`, `group_split` from `mlp-split-grouped`.

```
$ pytest -q tests/test_split_integrity.py
.....                                                     [100%]
5 passed in 3.41s
$ SPLIT_PATH=/tmp/split_mutated.parquet pytest -q tests/test_split_integrity.py
F...F
FAILED tests/test_split_integrity.py::test_splits_disjoint
FAILED tests/test_split_integrity.py::test_groups_disjoint - patient_id 10442 in train and test
2 failed, 3 passed in 3.38s
```

`split_manifest` = `{"path": "data/splits/split.parquet", "md5": "9d2c...", "strategy": "group", "group_column": "patient_id", "seed": 7}`.

---

## Exit Criteria

DONE when the integrity suite passes on the real split, fails on a mutated copy, and `split_manifest` records the file hash.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | More than one split object provided | **Stop**: keep the one matching `split_strategy`; delete the other generated split file only after the user confirms. |
| Phase 2 | `test_no_duplicate_straddle` fails | **Return**: to the split flow with the deduplication rule from `mlp-leakage-audit`. |
| Phase 2 | Mutation does not fail any test | **Adjust**: the test reads the wrong file or asserts nothing; fix the test, rerun both runs. |
| Phase 2 | md5 mismatch | **Retry**: rerun the split script; if it still differs, the split is not deterministic, **Return** to its flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
