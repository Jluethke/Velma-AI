# Perception Model and Precision Selection by Measured Accuracy and Latency

**One-line description:** Puts every measured candidate (model and precision) on an accuracy versus latency table using holdout mAP and on-target TensorRT timing, removes candidates that miss the latency budget or accuracy target, keeps the Pareto front, and selects one with a written rule instead of judgment.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `detection_eval_report` (object, required): Holdout metrics for the current model per precision.
- `trtexec_report` (object, required): FP16 timing on target.
- `int8_build_report` (object, optional): INT8 timing on target, when built.
- `candidate_results` (object[], optional): Earlier runs of this chain for other models, each with the same report fields, measured on the same holdout and the same `gpu_target`.
- `latency_budget_ms` (number, required): The inference share of the end-to-end budget, from the user or the system requirement.
- `accuracy_target` (object, required): The user's acceptance target (metric name and value).

---

## Outputs

- `model_selection` (object): The table of all candidates, the Pareto front, the selected model and precision, the rule that selected it, and rejected candidates with reasons.

---

## Phase 1: Build a Comparable Table

### Entry Criteria
- Every candidate was measured on the same holdout file hash and the same GPU, TensorRT version and power mode.

### Actions
1. One row per (model, precision): AP@[.50:.95], AP50, the user's target metric, per-class AP for the classes the user marks safety relevant, `GPU Compute Time` median and p99, and end-to-end `Latency` p99 from trtexec.
2. Reject any row measured on a different holdout hash or different target stack; list it as "not comparable". Do not mix numbers from papers or model cards with your measurements.

### Output
Comparable table.

### Quality Gate
- Every row has holdout hash, GPU, TensorRT version and power mode columns, all equal.

---

## Phase 2: Filter and Find the Pareto Front

### Entry Criteria
- Table has one or more comparable rows.

### Actions
1. Remove rows whose trtexec `Latency` p99 exceeds `latency_budget_ms`. Use p99, not mean; the system must meet the budget on bad frames too.
2. Remove rows below `accuracy_target`.
3. Among the rest, a row is on the Pareto front if no other row is both at least as accurate and at least as fast, with one strictly better.
4. If any safety-relevant class AP is below a per-class target the user set, remove the row even if overall mAP passes.

### Output
Filtered table and Pareto front.

### Quality Gate
- Each removed row lists the rule that removed it.

---

## Phase 3: Select by Rule

### Entry Criteria
- Pareto front known.

### Actions
1. Apply the first matching rule:

| Condition | Selection |
|---|---|
| Front is empty | No model meets both; **Return** the closest rows on each axis to the user |
| One row on the front | Select it |
| Several rows | Select the most accurate row whose p99 leaves the headroom the user specified for the rest of the pipeline; if no headroom value is given, ask |

2. Record that end-to-end latency must still be measured (`perc-e2e-latency-budget`); trtexec excludes decode, preprocessing, tracking and fusion.

### Output
`model_selection`.

### Quality Gate
- The selection names the matched rule row and the numbers that satisfied it.

---

## Worked Example

Illustrative only. Budget 8 ms, target AP50 0.78. Rows: yolov8s FP16 (AP50 0.812, p99 2.95 ms), yolov8s INT8 with FP16 head (0.806, 1.89 ms), yolov8m FP16 (0.835, 5.80 ms), yolov8n INT8 (0.741, 1.10 ms, removed: below target). Front: s-INT8, m-FP16. User headroom: inference p99 at most 3 ms. Rule 3 selects yolov8s INT8 with FP16 head.

---

## Exit Criteria

DONE when one candidate is selected by a written rule from comparable measurements, or the user receives the closest rows because none meets both limits.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Candidates measured on different hardware | **Stop**: remeasure on `gpu_target`; do not scale numbers between GPUs. |
| Phase 2 | All rows fail latency | **Return**: report that a smaller model, INT8, a smaller input size, or a faster target is needed, each to be measured. |
| Phase 3 | No headroom value given | **Stop** and ask the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
