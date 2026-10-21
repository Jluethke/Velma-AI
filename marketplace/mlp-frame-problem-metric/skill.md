# Frame the ML Problem and Choose the Metric

**One-line description:** Turns a business request into a written ML problem frame (unit of prediction, prediction time, label window, action taken) and picks one primary metric and one split strategy from decision tables, so every later step optimizes and evaluates the same thing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_statement` (string, required): The request in the requester's words, for example "flag orders likely to be refunded so support can review them".
- `label_definition` (string, required): How the target is computed from raw data, including the event, the time window and the source table.
- `decision_costs` (object, optional): Cost of a false positive, cost of a false negative, review capacity per day, or any other number the business already uses. Leave empty when unknown; never invent it.

---

## Outputs

- `problem_frame` (object): `task_type`, `prediction_unit`, `prediction_time`, `label_window`, `action`, `uses_probabilities` (true/false), `entity_column`, `time_column`, `open_questions`.
- `primary_metric` (object): `name`, the scikit-learn scoring string (`scoring`), `greater_is_better`, the decision-table row that selected it, and up to two secondary metrics.
- `recommended_split` (string): One of `random`, `time`, `group`, with the decision-table row that selected it.

---

## Phase 1: Write the Problem Frame

### Entry Criteria
- `problem_statement` and `label_definition` are present.

### Actions
1. Create the file `docs/problem_frame.md` in the project repo. Do not edit any other file in this flow.
2. Fill in these six lines, one sentence each:
   - **Prediction unit:** the row the model scores (one order, one user-day, one image).
   - **Prediction time:** the exact moment the score is produced (for example "at order creation", "every night at 02:00 UTC").
   - **Label window:** the period after prediction time in which the label event is counted (from `label_definition`).
   - **Action:** what a person or system does with the score.
   - **Uses probabilities:** "yes" if the number itself is consumed (expected cost, pricing, risk score shown to a person); "no" if only the ranking or a thresholded class is used.
   - **Entity and time columns:** the column that identifies the entity (customer, patient, device) and the column holding the event timestamp, or "none".
3. Classify `task_type` with this table:

| Label values | Task type |
|---|---|
| Two classes | `binary` |
| Three or more mutually exclusive classes | `multiclass` |
| Several labels can be true at once | `multilabel` |
| A real number | `regression` |
| A real number indexed by time, predicted for future periods | `forecasting` |

4. Write every unknown as an entry in `open_questions`. Do not guess the prediction time or the label window.

### Output
`docs/problem_frame.md` and a draft `problem_frame`.

### Quality Gate
- `grep -c "^\*\*" docs/problem_frame.md` returns 6 or more (all six lines present).
- `prediction_time` and `label_window` are both non-empty, or each missing one is listed in `open_questions`.

---

## Phase 2: Choose the Primary Metric

### Entry Criteria
- Draft `problem_frame` exists.

### Actions
1. Walk this table top to bottom and take the FIRST row that matches. Record the row number.

| # | Condition | Primary metric | scikit-learn `scoring` |
|---|---|---|---|
| 1 | `binary`, `decision_costs` gives both error costs | Expected cost at the chosen threshold (custom scorer via `sklearn.metrics.make_scorer`) | custom |
| 2 | `binary`, fixed review capacity in `decision_costs` | Precision at k, where k = capacity per scoring batch | custom (`sklearn.metrics.top_k_accuracy_score` does NOT do this; write it) |
| 3 | `binary`, `uses_probabilities` = yes | Log loss, Brier score as secondary | `neg_log_loss`, `neg_brier_score` |
| 4 | `binary`, positive class is rare and is the class of interest | Average precision (area under precision-recall) | `average_precision` |
| 5 | `binary`, otherwise | ROC AUC | `roc_auc` |
| 6 | `multiclass`, classes imbalanced | Macro F1, balanced accuracy secondary | `f1_macro`, `balanced_accuracy` |
| 7 | `multiclass`, otherwise | Accuracy, log loss secondary | `accuracy`, `neg_log_loss` |
| 8 | `regression`, cost grows linearly with error | MAE | `neg_mean_absolute_error` |
| 9 | `regression`, large errors cost disproportionately more | RMSE | `neg_root_mean_squared_error` (scikit-learn 1.4 or later) |
| 10 | `regression`, a quantile is needed (for example capacity planning) | Pinball loss at that quantile | custom via `mean_pinball_loss(alpha=q)` |
| 11 | `forecasting` | MASE against the seasonal naive forecast | custom |

2. "Rare" in row 4 is not a number you choose: compute the positive rate from the data and record it. If the requester has not said the positive class is the class of interest, add an open question instead of using row 4.
3. Do NOT pick accuracy for an imbalanced binary task. Do NOT pick MAPE when the target can be zero or near zero (division by zero).
4. Add at most two secondary metrics. Secondary metrics are reported, never optimized.
5. Run `python -c "from sklearn.metrics import get_scorer_names; print(sorted(get_scorer_names()))"` and confirm every non-custom scoring string you wrote appears in the list. Do not type a scoring string from memory without this check.

### Output
`primary_metric` with its table row.

### Quality Gate
- The `get_scorer_names()` output contains every non-custom `scoring` string in `primary_metric`.
- Exactly one primary metric is recorded.

---

## Phase 3: Choose the Split Strategy

### Entry Criteria
- `primary_metric` exists.

### Actions
1. Take the FIRST matching row:

| # | Condition | `recommended_split` |
|---|---|---|
| 1 | The model will score rows whose prediction time is later than every training row, and `time_column` exists | `time` |
| 2 | One entity appears in many rows and the model will score entities it never saw | `group` |
| 3 | Rows are independent and identically distributed and there is no deployment-time drift question | `random` |

2. If rows 1 and 2 both apply, choose `time` and record in `open_questions`: "entities also repeat; the time-split flow must also report entity overlap".
3. Write the chosen row number into `recommended_split` and into `docs/problem_frame.md`.

### Output
`recommended_split`, final `problem_frame`.

### Quality Gate
- `recommended_split` is exactly one of `random`, `time`, `group`.
- `docs/problem_frame.md` names the table row behind the split and behind the metric.

---

## Worked Example

Illustrative only.

Input: `problem_statement` = "flag orders likely to be refunded within 30 days so support can review up to 200 per day"; `label_definition` = "refund row in `refunds` table with `created_at` within 30 days of `orders.created_at`"; `decision_costs` = `{"review_capacity_per_day": 200}`.

- Phase 1: prediction unit = one order; prediction time = order creation; label window = 30 days; action = support review queue; uses probabilities = no; entity column = `customer_id`, time column = `created_at`. `task_type` = `binary`.
- Phase 2: row 2 matches (fixed capacity). Primary metric = precision at k=200 per day (custom scorer). Secondary = `average_precision`. Check: `python -c "from sklearn.metrics import get_scorer_names; print('average_precision' in get_scorer_names())"` prints `True`.
- Phase 3: orders are scored after all training orders exist, so row 1: `recommended_split` = `time`. Customers repeat, so an open question asks the time-split flow to report customer overlap.

---

## Exit Criteria

DONE when `docs/problem_frame.md` exists with all six frame lines, one primary metric chosen by a numbered table row, and one split strategy chosen by a numbered table row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Prediction time cannot be stated | **Stop**: record it as an open question; every leakage check depends on it. |
| Phase 1 | Label definition uses data only known after prediction time as a feature | **Return**: send the conflict back to the requester; this is leakage by design. |
| Phase 2 | Scoring string not in `get_scorer_names()` | **Adjust**: use the closest listed name or write a custom scorer with `make_scorer`. |
| Phase 2 | Costs requested but not provided | **Adjust**: fall through to the next table row and record the missing costs as an open question. |
| Phase 3 | No time column and no entity column | **Adjust**: use `random` and record that drift cannot be checked. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
