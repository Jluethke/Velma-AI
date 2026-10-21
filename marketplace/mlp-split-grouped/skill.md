# Grouped Split So No Entity Crosses Splits

**One-line description:** Splits data so every row of one entity (patient, user, device, site) lands in exactly one of train, validation or test, using scikit-learn `GroupShuffleSplit` and `StratifiedGroupKFold`, so evaluation measures performance on unseen entities.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_version` (object, required): From `mlp-dvc-version-raw-data`.
- `problem_frame` (object, required): From `mlp-frame-problem-metric`.
- `group_column` (string, required): The entity identifier, usually `problem_frame.entity_column`.
- `split_seed` (integer, required): Seed for every random call.
- `test_fraction` (number, required): Approximate fraction of GROUPS held out as test.

---

## Outputs

- `group_split` (object): Path to `data/splits/split.parquet` (`row_id`, `split`, `fold`), group counts and row counts per split, label rate per split, and the largest group's share of rows.

---

## Phase 1: Inspect Group Sizes

### Entry Criteria
- `group_column` has no nulls.

### Actions
1. Compute group sizes: `sizes = df.group_by(group_column).len().sort("len", descending=True)`.
2. Record: number of groups, rows in the largest group, and the largest group's share of all rows.
3. Apply this rule:

| Condition | Action |
|---|---|
| Largest group's row share is larger than `test_fraction` | It cannot fit in test without dominating it. Record an open question; consider capping rows per group for training only. |
| Number of groups is smaller than the number of CV folds k | **Stop**: grouped CV is impossible. |
| Otherwise | Continue. |

4. Check for hidden duplicates of the same entity under different IDs (for example the same email with two customer IDs). If the data has such a key, build the group as the connected component of both keys. Record the rule.

### Output
Group size profile.

### Quality Gate
- Group count, largest group size and largest share are recorded.

---

## Phase 2: Split by Group

### Entry Criteria
- Phase 1 rule did not stop.

### Actions
1. Choose the splitter:

| Task | Holdout splitter | CV splitter |
|---|---|---|
| Classification, label rate matters | `StratifiedGroupKFold(n_splits=round(1/test_fraction), shuffle=True, random_state=split_seed)`; take fold 0 as test | `StratifiedGroupKFold(n_splits=k, shuffle=True, random_state=split_seed)` |
| Regression or rate does not matter | `GroupShuffleSplit(n_splits=1, test_size=test_fraction, random_state=split_seed)` | `GroupKFold(n_splits=k)` |

2. Note: `GroupShuffleSplit(test_size=...)` is a fraction of GROUPS, so the row fraction differs when groups differ in size. Report both.
3. Note: `GroupKFold` only gained `shuffle` and `random_state` in scikit-learn 1.6. Check `python -c "import sklearn; print(sklearn.__version__)"` before passing them.
4. Split test off first, then validation from the remainder with the same splitter type, then CV folds on train. Always pass `groups=` to `.split(X, y, groups=...)`. Calling `.split(X, y)` without `groups` raises an error for group splitters; do not "fix" it by switching to `KFold`.
5. Save `data/splits/split.parquet` with `row_id`, `split`, `fold`.

### Output
`split.parquet`.

### Quality Gate
- `python -c` check: the sets of `group_column` values in train, val and test are pairwise disjoint (every intersection size prints 0).
- Rerunning the split script gives the same `md5sum` for `split.parquet`.

---

## Phase 3: Report

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Print per split: group count, row count, label rate.
2. Check every CV fold: groups in the fold's eval rows do not appear in its train rows.
3. Pass `groups=` to every later `cross_validate`, `GridSearchCV.fit` and Optuna objective. Write a reminder line to `docs/split.md`: "every CV call must pass groups".
4. Fill `group_split`.

### Output
`group_split`.

### Quality Gate
- Per-fold group overlap counts are all 0.
- `docs/split.md` contains the "pass groups" line.

---

## Worked Example

Illustrative only.

Input: 220,000 ECG segments from 1,840 patients, `group_column` = `patient_id`, `test_fraction` = 0.2, binary label, k = 5, `split_seed` = 7.

```
groups: 1840   largest group: 1,212 rows (0.55% of rows)
splitter: StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=7), fold 0 -> test
split  patients  rows    positive_rate
train  1177      140,912 0.083
val    295       35,410  0.081
test   368       43,678  0.085
patient overlap train/val/test: 0 0 0
```

---

## Exit Criteria

DONE when no group appears in two splits or in both sides of any CV fold, and the split file is reproducible byte for byte.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fewer groups than folds | **Stop**: reduce k (user decision) or report that grouped CV is not possible. |
| Phase 2 | `TypeError` passing `shuffle` to `GroupKFold` | **Adjust**: scikit-learn is older than 1.6; drop the arguments or upgrade. |
| Phase 2 | Test row share far from `test_fraction` | **Adjust**: report it; do not move individual rows between splits. |
| Phase 3 | A downstream CV call omits `groups` | **Return**: fix that call; the score it produced is invalid. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
