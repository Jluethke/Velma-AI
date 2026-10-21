# Write the Model Card

**One-line description:** Writes `MODEL_CARD.md` using the sections of Mitchell et al. (2019), "Model Cards for Model Reporting", where every number links to the artifact or tracker run that produced it, including the test interval, slice results, calibration and parity status.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_frame` (object, required): From `mlp-frame-problem-metric`.
- `data_version` (object, required): From `mlp-dvc-version-raw-data`.
- `metric_ci` (object, required): From `mlp-bootstrap-metric-ci`.
- `comparison_result` (object, required): From `mlp-paired-model-comparison`.
- `slice_report` (object, required): From `mlp-slice-error-analysis`.
- `calibration_report` (object, required): From `mlp-calibration-diagnose`.
- `parity_report` (object, required): From `mlp-inference-parity-test`.
- `sklearn_model_package` (object, optional): From `mlp-sklearn-mlflow-model-package`.
- `onnx_model_package` (object, optional): From `mlp-torch-onnx-export`.

---

## Outputs

- `model_card` (object): Path to `MODEL_CARD.md`, the list of every number in it with its source artifact, and the open questions carried into the card.

---

## Phase 1: Draft the Sections

### Entry Criteria
- All required inputs present; `parity_report` shows the suite passing (if not, the card states "parity failing" in Caveats and the model is not marked deployable).

### Actions
1. Create `MODEL_CARD.md` with one `## <Section>` heading per item below, in this order (Mitchell et al. 2019), and no other `## ` headings:
   1. **Model Details**: name, version, date, model type, package URI (`sklearn_model_package` or `onnx_model_package`), git commit, tracker run ID, license, contact.
   2. **Intended Use**: from `problem_frame`: prediction unit, prediction time, action. Out-of-scope uses: any unit or time not in the frame.
   3. **Factors**: the slice columns analyzed and why.
   4. **Metrics**: primary metric and the table row that chose it; secondary metrics; decision threshold if any and how it was set.
   5. **Evaluation Data**: test split definition from the split strategy, row count, period or groups, DVC hash.
   6. **Training Data**: train (and validation) definition, row counts, DVC hash from `data_version`.
   7. **Quantitative Results** (the paper's "quantitative analysis" section): test metric with interval (`metric_ci`), comparison with baseline (`comparison_result` verdict and interval), slice table (`slice_report`), calibration (`calibration_report`).
   8. **Ethical Considerations**: slices flagged `worse`, sensitive attributes present or absent in features, known label noise.
   9. **Caveats and Recommendations**: every open question collected from earlier flows; drift observed in the time split; retraining trigger owner.
2. For a Hugging Face repo, the same content goes in `README.md` with a YAML metadata block at the top; check the Hugging Face model card docs for the metadata keys. Do not maintain two divergent cards.

### Output
Draft `MODEL_CARD.md`.

### Quality Gate
- `grep -c "^## " MODEL_CARD.md` returns 9 (one per section).

---

## Phase 2: Trace Every Number

### Entry Criteria
- Draft exists.

### Actions
1. Extract every number: `grep -oE "[0-9]+\.[0-9]+|[0-9]{2,}" MODEL_CARD.md`.
2. For each, add a source reference right after it (footnote or link): tracker run ID and metric key, `reports/slices.csv` row, `metric_ci` field, or DVC hash. A number with no source is removed or marked as an open question.
3. Copy numbers from the artifacts with a small script, not by retyping. Retyped numbers drift.
4. State intervals with unit and resample count exactly as `metric_ci` reports them.
5. Do not add marketing language or claims not backed by an artifact.

### Output
Traced card.

### Quality Gate
- Every extracted number has an adjacent source reference (count of numbers equals count of references, printed).

---

## Phase 3: Review Against Inputs

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Check these exact matches:

| Card field | Must equal |
|---|---|
| Test metric and interval | `metric_ci` point, low, high |
| Baseline verdict | `comparison_result.verdict` |
| Slices flagged worse | rows with `flag == "worse"` in `reports/slices.csv` |
| Calibration decision | `calibration_report.decision` |
| Parity status | `parity_report` pass/fail and tolerance source |
| Data hashes | `data_version` md5 values |

2. Commit `MODEL_CARD.md` with the model version and log it as an artifact to the tracker run (`mlflow.log_artifact("MODEL_CARD.md")` or `run.log_artifact` / `wandb.save`).
3. Fill `model_card`.

### Output
`model_card`.

### Quality Gate
- Every row of the match table is checked and printed as `match` or `mismatch`; zero mismatches.

---

## Worked Example

Illustrative only.

Excerpt of `MODEL_CARD.md` for a refund-risk model:

```
## Quantitative Results
Test average precision 0.362 (95% CI 0.341 to 0.384, cluster bootstrap over customer_id,
9999 resamples) [run 4f1c2a9e, metric test_average_precision].
Versus logistic baseline: +0.043 (95% CI 0.030 to 0.057), verdict tuned_better [comparison_result].
Slices flagged worse: region=LATAM (AP 0.244), device=__null__ (AP 0.198) [reports/slices.csv rows 7, 11].

## Caveats and Recommendations
- Open question: ONNX parity tolerance not yet set by the owner.
- Refund rate rose from 0.041 (train) to 0.052 (test window) [time_split report].
```
Match table: 6 of 6 `match`.

---

## Exit Criteria

DONE when `MODEL_CARD.md` has the nine sections, every number traces to an artifact, the match table has zero mismatches, and the card is versioned with the model.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `parity_report` failing | **Adjust**: write the card with "not deployable: parity failing" in Model Details and Caveats. |
| Phase 2 | A number has no source | **Adjust**: remove it or move it to Caveats as an open question. |
| Phase 3 | Mismatch with an input | **Retry**: regenerate the number from the artifact by script, then recheck. |
| Phase 3 | Card requested without slice analysis | **Stop**: run `mlp-slice-error-analysis`; Factors and Ethical Considerations need it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
