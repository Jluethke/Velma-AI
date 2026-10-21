# Time-Based Split with Label-Horizon Gap

**One-line description:** Splits data by prediction time into train, validation and test windows with a gap equal to the label window, and builds forward-chaining CV folds with scikit-learn `TimeSeriesSplit`, so no training label overlaps an evaluation period.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_version` (object, required): From `mlp-dvc-version-raw-data`.
- `problem_frame` (object, required): From `mlp-frame-problem-metric`; provides `label_window` and `entity_column`.
- `time_column` (string, required): Column holding the prediction time of each row (not the label event time).
- `cutoff_dates` (object, required): `train_end`, `val_end`, `test_end` timestamps chosen by the user, for example matching the business's planned retraining cadence.

---

## Outputs

- `time_split` (object): Path to `data/splits/split.parquet` (`row_id`, `split`, `fold`), the window boundaries, the gap used, row counts and label rates per window, and the count of entities seen in both train and test.

---

## Phase 1: Compute the Gap

### Entry Criteria
- `time_column` has no nulls: `df.select(pl.col(time_column).null_count())` returns 0.
- `cutoff_dates` are strictly increasing.

### Actions
1. Set `gap = problem_frame.label_window`. Reason: a training row at time t has a label that is only known at t + label_window. If training rows end at `train_end`, labels up to `train_end + label_window` are inside the training data, so validation must start after that.
2. Define the train window with this rule (pick the row that describes how the data was collected):

| At training time, can you observe labels up to `train_end`? | Train window |
|---|---|
| Yes, training happens at `train_end` and labels need the full window | `time <= train_end - gap` (rows whose label is complete) |
| Data is a historical extract with all labels already complete | `time <= train_end`, and validation starts at `train_end + gap` |

   - validation: `train_end + gap < time <= val_end` (second rule) or `train_end < time <= val_end` (first rule).
   - test: `val_end + gap < time <= test_end` (second rule) or `val_end < time <= test_end` (first rule).
3. Write the chosen rule and the resulting boundaries in the split log.

### Output
Window boundaries and gap.

### Quality Gate
- `max(train time) + gap <= min(val time)` and `max(val time) + gap <= min(test time)` hold when checked with polars on the saved split (for the first rule the gap is already removed from train).

---

## Phase 2: Build the Split and CV Folds

### Entry Criteria
- Phase 1 gate holds on paper.

### Actions
1. Sort by `time_column`, then `row_id` as a tiebreaker.
2. Assign `split` with polars `pl.when(...).then(...)` expressions using the boundaries. Rows inside a gap get `split = "gap"` and are not used anywhere.
3. For CV inside train, use `sklearn.model_selection.TimeSeriesSplit(n_splits=k, gap=g_rows)` where `gap` is a ROW count, not a duration. Convert duration to rows only when rows are evenly spaced in time (one row per day per series). When they are not, build folds by date instead: for each fold i, train = `time <= fold_end_i - gap`, eval = `fold_end_i < time <= fold_end_{i+1}`.
4. Do NOT use `KFold(shuffle=True)` or `StratifiedKFold` on time-ordered data; they train on the future.
5. Save `data/splits/split.parquet` with `row_id`, `split`, `fold` (fold = index of the date-based eval window for train rows, null otherwise).

### Output
`split.parquet` with time windows and folds.

### Quality Gate
- For each fold, `max(train time) < min(eval time)`; print both values per fold.
- `git grep -n "shuffle=True" -- src` returns no line in split or CV code.

---

## Phase 3: Report Drift and Entity Overlap

### Entry Criteria
- `split.parquet` exists.

### Actions
1. Print per split: row count, min and max time, label rate.
2. A label rate that changes across windows is real drift, not a bug. Record it; it is why the time split exists.
3. If `problem_frame.entity_column` is set, count entities in both train and test: `train_ents.join(test_ents, on=entity, how="inner").height`. Record the count. If the model will score only new entities in production, return to `mlp-split-grouped` for a time-and-group split.
4. Write all numbers to `time_split`.

### Output
`time_split`.

### Quality Gate
- Every row has a `split` value in `train`, `val`, `test`, `gap`.
- The entity overlap count is recorded (or "no entity column").

---

## Worked Example

Illustrative only.

Input: orders 2023-01-01 to 2024-06-30, `label_window` = 30 days, historical extract with all labels complete, `cutoff_dates` = train_end 2023-12-31, val_end 2024-03-31, test_end 2024-06-30.

- Phase 1: second rule; val starts 2024-01-31, test starts 2024-05-01.
- Phase 2: folds by month across 2023 with a 30-day gap each.
- Phase 3:

```
split  rows     min_time    max_time    refund_rate
train  812004   2023-01-01  2023-12-31  0.041
gap    66310    2024-01-01  2024-01-30  -
val    131877   2024-01-31  2024-03-31  0.047
gap    66989    2024-04-01  2024-04-30  -
test   134220   2024-05-01  2024-06-30  0.052
customers in both train and test: 48,113
```

---

## Exit Criteria

DONE when every evaluation window starts after the previous window's end plus the label gap, CV folds only train on the past, and drift and entity overlap are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `time_column` is the label event time, not prediction time | **Stop**: rebuild with prediction time; event time leaks the label. |
| Phase 1 | `label_window` unknown | **Return**: to `mlp-frame-problem-metric`; the gap cannot be chosen without it. |
| Phase 2 | Uneven row spacing with `TimeSeriesSplit(gap=...)` | **Adjust**: switch to date-based folds as in step 3. |
| Phase 3 | A window has zero positives | **Adjust**: ask the user to move `cutoff_dates`; do not shuffle. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
