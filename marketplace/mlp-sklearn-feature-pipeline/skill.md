# Build a Leak-Free scikit-learn Feature Pipeline

**One-line description:** Puts all preprocessing (imputation, scaling, encoding, target encoding) inside one scikit-learn `Pipeline` with a `ColumnTransformer`, so every transform is fit only on training folds during CV and the same object runs at inference.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `split_manifest` (object, required): From `mlp-split-integrity-check`.
- `clean_feature_list` (string[], required): From `mlp-leakage-audit`.
- `primary_metric` (object, required): From `mlp-frame-problem-metric`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `feature_pipeline` (object): Path to `src/features.py` exposing `build_pipeline(estimator)`, the column groups, `get_feature_names_out()` output, and the scikit-learn version.
- `pipeline_cv_scores` (object): CV scores of the pipeline with a reference estimator on the saved folds, plus the result of the leak test (fit-outside versus fit-inside scores).

---

## Phase 1: Assign Columns to Transformers

### Entry Criteria
- `clean_feature_list` comes from `params.yaml`.

### Actions
1. Read dtypes with polars: `df.select(clean_feature_list).schema`.
2. Assign each column with this table:

| Column kind | Transformer |
|---|---|
| Numeric | `Pipeline([("impute", SimpleImputer(strategy="median", add_indicator=True)), ("scale", StandardScaler())])` (scaling only matters for linear, distance and neural models; harmless for trees) |
| Low-cardinality categorical (cardinality chosen by the user) | `OneHotEncoder(handle_unknown="infrequent_if_exist", min_frequency=<user value>, sparse_output=False)` |
| High-cardinality categorical | `TargetEncoder(target_type=<"binary"|"continuous"|"multiclass">, random_state=seed)` (scikit-learn 1.3 or later) |
| Datetime | A `FunctionTransformer` that extracts parts (hour, weekday) known at prediction time; never "days until label" |
| Free text | `TfidfVectorizer` on that single column (pass the column name as a string, not a list, so it gets 1-D input) |

3. `TargetEncoder.fit_transform` uses internal cross fitting to avoid leaking a row's own label; `fit(...).transform(...)` on the same data does NOT. Inside a `Pipeline`, `fit` calls `fit_transform`, which is correct. Never call `encoder.fit(X).transform(X)` by hand on training data.
4. Write the column groups to `params.yaml` (`numeric_cols`, `onehot_cols`, `target_enc_cols`) so code reads them from one place.

### Output
Column assignment table.

### Quality Gate
- The union of the column groups equals `clean_feature_list` exactly (print the set differences; both are empty).

---

## Phase 2: Build the Pipeline

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. In `src/features.py`:
   ```python
   from sklearn.compose import ColumnTransformer
   from sklearn.pipeline import Pipeline

   def build_pipeline(estimator, cols, seed):
       pre = ColumnTransformer(
           [("num", num_pipe, cols["numeric_cols"]),
            ("ohe", ohe, cols["onehot_cols"]),
            ("te", te, cols["target_enc_cols"])],
           remainder="drop",
           verbose_feature_names_out=True,
       )
       return Pipeline([("pre", pre), ("model", estimator)])
   ```
2. `remainder="drop"` makes the feature set explicit; a new column in the data cannot slip in.
3. Polars input works with `ColumnTransformer` in recent scikit-learn; confirm with a one-row test. To get named outputs for debugging, call `pipe.set_output(transform="polars")` (scikit-learn 1.4 or later).
4. Remove every preprocessing call made outside the pipeline: `git grep -n -E "fit_transform|\.fit\(" -- src` and confirm each hit is either the pipeline's own `fit` or not on features.
5. Fit once on train and print `pipe[:-1].get_feature_names_out()` to confirm the feature count.

### Output
`src/features.py`.

### Quality Gate
- `python -c "from src.features import build_pipeline"` exits 0.
- `get_feature_names_out()` prints names for every expected column group.

---

## Phase 3: Leak Test and CV Score

### Entry Criteria
- Pipeline fits.

### Actions
1. Score the pipeline with a reference estimator (the best rung 3 baseline) on the saved folds: `cross_validate(pipe, X_train, y_train, cv=project_cv(split_manifest), scoring=primary_metric.scoring)`, using the `src/cv.py` helper from `mlp-baseline-models` (`PredefinedSplit` for random and grouped splits, a forward-chaining list for time splits).
2. Leak test: fit the preprocessing on ALL train rows first, transform, then cross-validate only the estimator. Compare to step 1.

| Fit-outside score vs fit-inside score | Meaning |
|---|---|
| Higher | Preprocessing leaks fold information (target encoding or imputation fitted on eval rows). The pipeline version is the honest one; delete the fit-outside code. |
| Equal within CV std | No material leak through these transformers. |

3. Write the inside score to `pipeline_cv_scores` and the comparison to the leak-test field.
4. Write a unit test `tests/test_features.py` that builds the pipeline, fits on a small train sample and transforms one row containing an unseen category and a null; assert the output has no NaN and the expected width.

### Output
`feature_pipeline`, `pipeline_cv_scores`.

### Quality Gate
- `pytest -q tests/test_features.py` passes.
- The leak-test comparison numbers are recorded.

---

## Worked Example

Illustrative only.

Input: 36 clean features: 22 numeric, 9 low-cardinality categorical, 5 high-cardinality (`merchant_id`, `zip3`, ...); reference estimator `LogisticRegression`.

```
$ python src/leak_test.py
fit-inside  AP cv: 0.3011 +/- 0.0098
fit-outside AP cv: 0.3427 +/- 0.0090   <- TargetEncoder fit on all train rows leaked
$ pytest -q tests/test_features.py
1 passed in 1.12s
```
Fit-outside code removed; `pipeline_cv_scores` = 0.3011.

---

## Exit Criteria

DONE when all preprocessing lives inside one `Pipeline`, the leak test is recorded, and the unseen-category and null test passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `TargetEncoder` import fails | **Adjust**: scikit-learn is older than 1.3; upgrade or use one-hot with `min_frequency`. |
| Phase 2 | `ValueError: Found unknown categories` at transform | **Adjust**: set `handle_unknown="infrequent_if_exist"` or `"ignore"` on `OneHotEncoder`. |
| Phase 2 | Text column gets 2-D input error | **Adjust**: pass the column name as a string in the `ColumnTransformer` entry. |
| Phase 3 | Unit test finds NaN output | **Adjust**: the column bypassed the imputer; fix its group assignment. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
