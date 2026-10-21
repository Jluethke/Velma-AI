# Audit Training Data for Target Leakage

**One-line description:** Runs five concrete leakage checks (availability time, ID-like columns, single-feature score versus baseline, duplicate rows, label-derived columns) on the versioned dataset and emits a feature list with every leaking column removed and the reason recorded.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_version` (object, required): From `mlp-dvc-version-raw-data`; names the exact data files and their hashes.
- `problem_frame` (object, required): From `mlp-frame-problem-metric`; provides `prediction_time`, `time_column`, `entity_column`, `task_type`.
- `primary_metric` (object, required): From `mlp-frame-problem-metric`; used for the single-feature score check.

---

## Outputs

- `leakage_findings` (object[]): One row per suspect column or row group: check name, column, evidence (number or query), decision (`drop`, `keep`, `open_question`).
- `clean_feature_list` (string[]): Feature columns that passed every check.

---

## Phase 1: Availability-Time Check

### Entry Criteria
- `dvc status` reports the data in `data_version` is present and unchanged.
- `problem_frame.prediction_time` is stated.

### Actions
1. Build a table `docs/feature_availability.csv` with columns `feature, source_table, source_column, available_at`. `available_at` is when the value is written in production, taken from the source system's schema docs or ETL code, never guessed.
2. Apply this rule to every feature:

| `available_at` relative to prediction time | Decision |
|---|---|
| Before or at prediction time | `keep` |
| After prediction time (for example `refund_reason`, `final_status`, `closed_at`, `days_to_resolution`) | `drop` |
| Unknown | `open_question`, and exclude from `clean_feature_list` until answered |

3. Check aggregates separately: a feature such as "customer refund count" leaks if its window includes the current row's label window. Read the SQL or code that computes it and record the window end.

### Output
`docs/feature_availability.csv` and availability findings.

### Quality Gate
- Every feature column in the dataset has one row in `docs/feature_availability.csv` (compare `wc -l` against the column count).
- No feature with `available_at` after prediction time is in the keep set.

---

## Phase 2: Mechanical Checks

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Load the data with polars (`import polars as pl; df = pl.read_parquet(path)`). Do not load it with a different reader than training will use.
2. **ID-like columns:** `df.select(pl.all().n_unique())`. Any column whose unique count equals the row count is an identifier; decision `drop` unless it is the declared `entity_column` (which is kept out of features but used for grouping).
3. **Single-feature score:** for each kept feature, fit a one-feature model inside cross-validation (`sklearn.model_selection.cross_val_score(HistGradientBoostingClassifier(), X[[col]], y, cv=5, scoring=<primary_metric.scoring>)`; use `HistGradientBoostingRegressor` for regression). It handles missing values natively. Rank features by score. Flag any single feature whose score is at or above the best full-feature baseline score from earlier work, or, if no baseline exists yet, the top-ranked feature, for a manual read of how it is computed. A single column that alone predicts the label that well is usually derived from the label.
4. **Duplicate rows:** hash feature columns per row: `df.with_columns(pl.concat_str(pl.col(feats).cast(pl.Utf8), separator="|").hash().alias("row_hash"))`, then count hashes appearing more than once and whether duplicates share the label. Exact duplicates later split across train and test inflate the test score.
5. **Label-derived columns:** search the feature code for the label source: `git grep -n "<label_table>\|<label_column>" -- src/features`. Any feature computed from the label table is `drop` unless its window ends before prediction time.
6. **Null-pattern leakage:** compute the label rate for rows where each feature is null versus non-null: `df.group_by(pl.col(c).is_null()).agg(pl.col(label).mean())`. A feature that is null only for one label value often means it is filled in after the outcome. Record it as `open_question` with the two rates.

### Output
Complete `leakage_findings`.

### Quality Gate
- `leakage_findings` contains an entry for every flagged column with numeric evidence (unique count, CV score, or label rates).
- The duplicate check reports the count of duplicated hashes (zero is a valid result).

---

## Phase 3: Emit the Clean Feature List

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. `clean_feature_list` = all features with decision `keep`. Exclude `drop` and `open_question`.
2. Write it to `params.yaml` under `features:` so DVC stages and training code read the same list. Do not hardcode the list in a second place.
3. Write `docs/leakage_audit.md` with one section per check and the commands used.
4. If duplicates exist, record the deduplication rule (keep first by `time_column`) for the split flow; do not delete rows from the raw DVC-tracked file.

### Output
`leakage_findings`, `clean_feature_list`.

### Quality Gate
- `python -c "import yaml; print(len(yaml.safe_load(open('params.yaml'))['features']))"` equals the length of `clean_feature_list`.
- No column in `clean_feature_list` appears with decision `drop` in `leakage_findings`.

---

## Worked Example

Illustrative only.

Data: 1.2M orders, 41 columns, label `refunded_30d`, primary metric `average_precision`.

- Phase 1: `support_ticket_count` is written by the support system up to 30 days after the order; `available_at` after prediction time, decision `drop`.
- Phase 2: `order_id` has 1,200,000 unique values in 1,200,000 rows, `drop`. Single-feature check: `refund_status_code` alone scores AP 0.97 while the logistic baseline scores 0.31; code reading shows it comes from the `refunds` table, `drop`. 14,302 duplicate row hashes, all from a retry bug in ingestion.
- Phase 3: 36 features in `clean_feature_list`, written to `params.yaml`; dedup rule "keep first by `created_at`" handed to the split flow.

---

## Exit Criteria

DONE when every feature has an availability time and a decision, all five checks have recorded evidence, and `clean_feature_list` is the single source in `params.yaml`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `available_at` unknown for many features | **Adjust**: exclude them, mark `open_question`, and continue with the known-safe set. |
| Phase 2 | Single-feature CV fails because the label has one class in a fold | **Adjust**: use `StratifiedKFold(n_splits=5, shuffle=True, random_state=<seed>)` as `cv`. |
| Phase 2 | Data too large for memory | **Adjust**: use `pl.scan_parquet` (lazy) and sample for the single-feature check, recording the sample size. |
| Phase 3 | Someone asks to keep a dropped column because it "helps" | **Stop**: a column that is not available at prediction time cannot help in production. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
