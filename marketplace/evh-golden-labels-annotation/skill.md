# Golden Answers and Human Labels

**One-line description:** Decides per criterion whether an item needs a golden reference answer or rubric-only grading, collects double-annotated human labels in Label Studio on a fixed overlap subset, measures inter-annotator agreement with Cohen's kappa or Krippendorff's alpha, and adjudicates disagreements into a frozen golden set.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `test_set` (string, required): Path to `evals/data/test.jsonl` (dev file beside it).
- `adversarial_set` (string, required): Path to `evals/data/adversarial.jsonl`.
- `rubric` (object, required): From `evh-task-rubric-spec` (`evals/rubric.yaml`).
- `annotators` (string[], required): Names of at least two people who know the domain and will label independently.

---

## Outputs

- `golden_set` (string): Path to `evals/data/golden.jsonl`: every dev, test and adversarial item with `target` (reference answer, label, or list of required facts) where the decision table requires one, and `rubric_version`.
- `human_labels` (string): Path to `evals/data/human_labels.jsonl`: one row per item, criterion and annotator with the label, plus the adjudicated label, used by `evh-judge-calibration` to calibrate the judge.

---

## Phase 1: Choose Reference or Rubric per Criterion

### Entry Criteria
- `rubric.yaml` has `method` and `scale` on every criterion.

### Actions
1. Apply this table per criterion and write the result as `target_kind` in `rubric.yaml`:

| `task_spec.output_type` or criterion | `target_kind` | What the annotator writes |
|---|---|---|
| classification, extraction, numeric | `exact_reference` | the one correct value |
| structured | `schema_plus_fields` | JSON Schema once; correct values for the fields that have one |
| grounded_text | `required_facts` | a list of atomic facts the answer must state, each checkable alone |
| open_text with a rubric criterion | `rubric_only` | no reference; the annotator labels outputs against the anchors |
| code | `tests` | unit tests the generated code must pass |

2. Do NOT write a full model answer as a golden reference for `open_text`. Similarity to one reference answer penalizes correct answers phrased differently. Use `required_facts` or `rubric_only`.
3. For `required_facts`, keep each fact atomic ("return window is 30 days"), not compound ("return window is 30 days and needs a receipt").

### Output
`rubric.yaml` with `target_kind` per criterion.

### Quality Gate
- Every criterion has `target_kind`.
- No `required_facts` entry contains " and " joining two facts (check with `grep`).

---

## Phase 2: Set Up Labeling in Label Studio

### Entry Criteria
- At least two `annotators`.

### Actions
1. Install and start: `pip install label-studio` then `label-studio start` (opens the web UI; default port shown in the console output).
2. Create one project per task. Labeling config: a `<Text>` block for the input and output, and one `<Choices>` block per rubric criterion with exactly the rubric levels as choices. Paste the anchor descriptions into each choice's `hint` text so annotators see them.
3. Generate outputs to label: run the current system on all dev items and save `evals/data/outputs_v0.jsonl`. Import those (input, output) pairs as tasks (Label Studio accepts JSON import).
4. Choose the overlap subset: every item in the calibration subset (all dev items, or a seeded random subset of dev if dev is large) is labeled by every annotator independently. Annotators must not see each other's labels; in Label Studio give each annotator their own account.
5. Brief annotators with the rubric only. Do not show them model or judge scores.

### Output
Label Studio project with tasks assigned to every annotator.

### Quality Gate
- Every annotator account shows the full overlap subset in its queue.
- The labeling config choices equal the rubric levels exactly (compare names).

---

## Phase 3: Measure Agreement and Adjudicate

### Entry Criteria
- All annotators finished the overlap subset; export done as JSON.

### Actions
1. Convert the export to `human_labels.jsonl` rows: `item_id, criterion_id, annotator, label`.
2. Two annotators, nominal or binary labels: `from sklearn.metrics import cohen_kappa_score; cohen_kappa_score(a, b)`. Ordinal labels: `cohen_kappa_score(a, b, weights="quadratic")`.
3. Three or more annotators, or missing labels: `pip install krippendorff`, then `krippendorff.alpha(reliability_data=matrix, level_of_measurement="nominal")` (use `"ordinal"` for ordinal scales). `matrix` is annotators by items with `numpy.nan` for missing.
4. Read the value against a named standard, not an invented cut:
   - Krippendorff (2004, Content Analysis, 2nd ed.): rely on data with alpha at or above 0.800; draw only tentative conclusions between 0.667 and 0.800; below 0.667 do not rely on the labels.
   - For kappa, Landis and Koch (1977) bands are descriptive (0.61 to 0.80 "substantial", 0.81 to 1.00 "almost perfect"); use them for wording only. The project's required level is a user decision recorded in `task_spec.open_questions` if not given.
5. If agreement on a criterion is below the level the project accepts: read the disagreeing items together, rewrite the anchor in `rubric.yaml`, bump `rubric_version`, and relabel the overlap subset for that criterion. Do not drop disagreeing items to raise the number.
6. Adjudicate: for each disagreement, a third person (or the annotators together) picks the final label and writes one line why. Store as `annotator: "adjudicated"`.
7. Write `golden.jsonl` with targets from Phase 1 and the adjudicated labels. Commit with the rubric.

### Output
`golden_set` and `human_labels` committed.

### Quality Gate
- `python -c "from sklearn.metrics import cohen_kappa_score;print(cohen_kappa_score(a,b))"` (or the krippendorff call) output is recorded per criterion in `evals/data/AGREEMENT.md`.
- Every disagreement has an `adjudicated` row: count of disagreeing (item, criterion) pairs equals count of adjudicated rows.
- `rubric_version` in `golden.jsonl` equals the version in `rubric.yaml`.

---

## Worked Example

Illustrative only. Support bot, criteria C2 refund policy (binary), C3 answers the question (binary), annotators Ana and Raj, 120 dev items in the overlap subset.

- Phase 1: C2 and C3 `rubric_only`; a new criterion C5 "states the correct return window" is `required_facts: ["return window is 30 days"]`.
- Phase 2: Label Studio project with two `<Choices>` blocks (pass, fail) per criterion.
- Phase 3: `cohen_kappa_score` C2 = 0.91, C3 = 0.58. C3 disagreements were all multi-question messages; anchor rewritten to "every question in the message gets an answer or an explicit deferral". Relabel gives C3 = 0.84. 11 disagreements adjudicated. `golden.jsonl` written with `rubric_version: 2`.

---

## Exit Criteria

DONE when every criterion has a `target_kind`, agreement per criterion is measured and recorded, every disagreement is adjudicated, and `golden.jsonl` plus `human_labels.jsonl` are committed with a matching rubric version.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Annotators cannot agree on the reference value | **Return**: send the item to the product owner; until answered, exclude it and list it. |
| Phase 2 | Only one annotator available | **Stop**: agreement cannot be measured with one person; get a second annotator before calibrating any judge. |
| Phase 3 | Agreement stays low after two anchor rewrites | **Adjust**: split the criterion into narrower binary criteria and relabel. |
| Phase 3 | Agreement computed on a different item set per annotator | **Retry**: restrict to items every annotator labeled, or use Krippendorff alpha which handles missing labels. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
