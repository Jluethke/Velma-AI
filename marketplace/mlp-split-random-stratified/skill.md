# Random Stratified Train/Validation/Test Split

**One-line description:** Creates a seeded, label-stratified train/validation/test split and stratified CV folds with scikit-learn for independent rows, and saves the assignment by row ID so it never changes between runs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_version` (object, required): From `mlp-dvc-version-raw-data`.
- `problem_frame` (object, required): From `mlp-frame-problem-metric`; must have `recommended_split` = `random` behind it.
- `split_seed` (integer, required): Seed for every random split call. Recorded, never re-drawn.
- `test_fraction` (number, required): Fraction of rows held out as test, chosen by the user. The validation fraction is the same value unless the user states otherwise.

---

## Outputs

- `random_split` (object): Path to `data/splits/split.parquet` with columns `row_id`, `split` (`train`, `val`, `test`), `fold` (CV fold for train rows), plus per-split row counts and label rates.

---

## Phase 1: Decide Stratification

### Entry Criteria
- `problem_frame.task_type` is known.
- The data has a stable unique row ID column. If not, create one from a stable key (never from the row position, which changes when data is re-sorted).

### Actions
1. Choose with this table:

| Task type | `stratify=` argument | CV splitter |
|---|---|---|
| `binary`, `multiclass` | the label column | `StratifiedKFold(n_splits=k, shuffle=True, random_state=split_seed)` |
| `regression` | binned label: `pl.col(y).qcut(q, labels=None)` with q chosen by the user, or none | `KFold(n_splits=k, shuffle=True, random_state=split_seed)` |
| `multilabel` | none in scikit-learn; record an open question (the `iterative-stratification` package exists, check its docs) | `KFold(...)` |

2. Check the smallest class count: `df.group_by(label).len().min()`. `train_test_split` raises `ValueError: The least populated class in y has only 1 member` when a class has fewer than 2 rows. Stop and report the class rather than dropping it silently.
3. `k` (number of folds) is a user input; scikit-learn's default for `n_splits` is 5. Record which one you used.

### Output
Stratification and splitter choice.

### Quality Gate
- The smallest class count is recorded.
- The chosen row of the table is written in the split log.

---

## Phase 2: Split and Save

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. In `src/split.py`, sort the data by `row_id` first. Sorting makes the split independent of file order.
2. Split in two calls:
   - `trainval_ids, test_ids = train_test_split(ids, test_size=test_fraction, stratify=strat, random_state=split_seed)`
   - `train_ids, val_ids = train_test_split(trainval_ids, test_size=val_fraction_of_trainval, stratify=strat_trainval, random_state=split_seed)` where `val_fraction_of_trainval = test_fraction / (1 - test_fraction)` when validation and test are the same size.
3. Assign CV folds on `train_ids` with the splitter from Phase 1: loop `for fold, (_, idx) in enumerate(cv.split(X_train, y_train))` and set `fold` for rows in `idx`.
4. Write `data/splits/split.parquet` with `row_id`, `split`, `fold`. Save IDs, not copies of the data.
5. Do NOT call `train_test_split` again anywhere else in the project. Every later step reads `split.parquet`.

### Output
`data/splits/split.parquet`.

### Quality Gate
- Running `python src/split.py` twice produces files with identical hashes: `md5sum data/splits/split.parquet` matches across runs.
- `git grep -n "train_test_split" -- src` shows exactly one file: `src/split.py`.

---

## Phase 3: Report the Split

### Entry Criteria
- `split.parquet` exists.

### Actions
1. Print row counts and label rate per split: join `split.parquet` back to the labels and `group_by("split").agg(pl.len(), pl.col(label).mean())`.
2. Confirm each split's label rate matches the overall rate. With stratification they differ only by rounding of small counts; a large difference means stratification was not applied.
3. Record counts and rates in `random_split`.

### Output
`random_split`.

### Quality Gate
- The three split row counts sum to the total row count.
- Every `train` row has a `fold` value from 0 to k-1; `val` and `test` rows have null `fold`.

---

## Worked Example

Illustrative only.

Input: 50,000 support tickets, 4 classes, `split_seed` = 20240611, `test_fraction` = 0.15, k = 5.

```
$ python src/split.py
smallest class count: 812 (class=billing)
train 35000  val 7500  test 7500
label rate per split (billing): overall 0.0162, train 0.0162, val 0.0163, test 0.0161
$ md5sum data/splits/split.parquet   # run 1
9d2c...  data/splits/split.parquet
$ python src/split.py && md5sum data/splits/split.parquet   # run 2
9d2c...  data/splits/split.parquet
```

---

## Exit Criteria

DONE when `split.parquet` assigns every row to exactly one split, is byte-identical across reruns, and is the only place split logic lives.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Class with fewer than 2 rows | **Stop**: report the class; merging or dropping classes is a problem-frame change. |
| Phase 1 | Rows are not independent (entity repeats, time order matters) | **Return**: to `mlp-frame-problem-metric`; use `mlp-split-grouped` or `mlp-split-time-based`. |
| Phase 2 | Hash differs across reruns | **Adjust**: sort by `row_id` before splitting and pass `random_state` to every call. |
| Phase 3 | Label rates differ by more than rounding | **Retry**: confirm `stratify=` was passed in both calls. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
