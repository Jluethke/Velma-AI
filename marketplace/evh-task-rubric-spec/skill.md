# Eval Task Spec and Rubric

**One-line description:** Turns one LLM feature into a written eval task spec (input contract, output contract, pass definition) and an anchored analytic rubric whose every level has a concrete observable description and a real example, so later scorers and judges grade the same thing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `feature_description` (string, required): What the LLM feature does, who calls it, the prompt or prompt file path, and the model it runs on today.
- `product_constraints` (string, optional): Hard product rules the output must obey (format, length limit set by the UI, banned content, languages supported, latency or cost ceilings set by the product owner).

---

## Outputs

- `task_spec` (object): Written to `evals/TASK_SPEC.md` and `evals/task_spec.json`: task id, input fields, output contract, output type class, pass definition, hard constraints, out-of-scope list, open questions.
- `rubric` (object): Written to `evals/rubric.yaml`: one entry per criterion with id, question, scale type (binary or ordinal), anchored level descriptions, one example output per level, and the grading method (programmatic, reference match, or judge).

---

## Phase 1: Write the Task Contract

### Entry Criteria
- `feature_description` names the prompt or code path that produces the output.

### Actions
1. Open the prompt file or code path named in `feature_description`. Copy the exact input variables it takes (for example `{customer_message}`, `{order_history}`) into a list. Do not guess variables; read them from the template.
2. Collect 10 real outputs from the current system (from logs, or by running the feature by hand). Paste them into `evals/samples/current_outputs.md`. You need real outputs before writing a rubric; a rubric written from imagination grades the wrong things.
3. Classify the output type with this table and record the class in `task_spec.output_type`:

| Output looks like | `output_type` | Default grading method |
|---|---|---|
| One label from a fixed set | `classification` | exact match after normalization |
| Fields pulled from input text | `extraction` | per-field exact or normalized match |
| JSON or other structured object | `structured` | JSON Schema validation, then per-field checks |
| A number or date | `numeric` | tolerance match (tolerance from the product owner) |
| Code that can be executed | `code` | run unit tests against it |
| Free text with one correct fact set | `grounded_text` | reference facts checked by a judge |
| Free text with many valid answers | `open_text` | rubric graded by a judge |

4. Write the pass definition as one sentence a stranger can check: "An output passes when it ...". If you cannot write it without the words "good", "helpful" or "appropriate", split it into criteria in Phase 2.
5. Copy every rule from `product_constraints` into `task_spec.hard_constraints`. A hard constraint is binary: violated or not.
6. List what the feature must NOT be asked to do (out-of-scope inputs) in `task_spec.out_of_scope`, and the expected behavior for each (refuse, redirect, ask a clarifying question).

### Output
`evals/TASK_SPEC.md` and `evals/task_spec.json` with the contract filled in.

### Quality Gate
- `python -c "import json;d=json.load(open('evals/task_spec.json'));print(sorted(d))"` prints all keys: `hard_constraints`, `input_fields`, `open_questions`, `out_of_scope`, `output_type`, `pass_definition`, `task_id`.
- Every name in `input_fields` appears verbatim in the prompt template (check with `grep -n "{field}" <prompt file>`).
- `evals/samples/current_outputs.md` contains 10 real outputs.

---

## Phase 2: Draft Rubric Criteria

### Entry Criteria
- `task_spec.json` exists and `output_type` is set.

### Actions
1. Read the 10 real outputs. For each, write one line on what is wrong or right. Group the lines into criteria. Each criterion answers ONE question (for example "Does the reply state the refund amount from the order record?"). Never combine two questions in one criterion ("accurate and polite" is two criteria).
2. Choose the scale per criterion with this rule:
   - If two careful people would always agree on yes or no: binary (`pass` / `fail`).
   - If there are real, describable intermediate states: ordinal with at most the number of levels you can anchor with a distinct written description and a real example. If you cannot find a real example for a level, delete that level.
3. Prefer binary. Binary criteria give higher agreement between annotators and between judge and human, and their pass rates can be given a confidence interval directly.
4. For each criterion set `method` from the Phase 1 table. Criteria that can be checked by code (length, format, presence of a required field, a forbidden string) MUST use `method: programmatic`. Do not send a check to an LLM judge that a regex or schema can do.
5. Mark each criterion `severity: critical` (any failure fails the whole output, for example leaking another customer's data) or `severity: standard`.

### Output
Draft `evals/rubric.yaml` with criteria, scales, methods and severities.

### Quality Gate
- Every criterion `question` contains exactly one question mark and no "and" joining two properties (check by reading each line).
- Every criterion with `method: programmatic` names the exact check (regex, schema path, or length rule).
- `python -c "import yaml;r=yaml.safe_load(open('evals/rubric.yaml'));print(len(r['criteria']))"` runs without error.

---

## Phase 3: Anchor Every Level

### Entry Criteria
- Draft rubric exists.

### Actions
1. For every level of every criterion, write an observable description: what text is present or absent in the output. Ban vague words in anchors: "good", "adequate", "mostly", "some". Replace them with countable facts ("states the amount and the date", "omits the date").
2. Attach one real output from `evals/samples/current_outputs.md` (or a hand-edited copy of one) as the example for each level.
3. Ask a second person (or a fresh model session with only the rubric and the 10 outputs) to grade the 10 outputs. Record disagreements in `task_spec.open_questions`. For each disagreement rewrite the anchor that allowed two readings.
4. Freeze the rubric: add `rubric_version: 1` and commit it with `git add evals/rubric.yaml evals/task_spec.json evals/TASK_SPEC.md && git commit -m "evals: task spec and rubric v1"`.

### Output
Final `rubric` and `task_spec`, committed.

### Quality Gate
- `grep -inE "\b(good|adequate|mostly|some|appropriate)\b" evals/rubric.yaml` returns no anchor lines.
- Every level has a non-empty `example` field.
- `git log -1 --stat` shows the three files committed.

---

## Worked Example

Illustrative only. `feature_description`: "Support reply drafter. Prompt `prompts/reply_drafter.txt` with `{customer_message}` and `{order_record}`; runs on the team's current production model." `product_constraints`: "Reply under 120 words (UI limit). Never promise a refund the order record does not allow."

- Phase 1: `grep -n "{" prompts/reply_drafter.txt` shows `{customer_message}` and `{order_record}`. `output_type: open_text`. Pass definition: "An output passes when every critical criterion passes and at least the standard criteria the product owner marks required pass." Hard constraints: `word_count <= 120`, `no_unallowed_refund_promise`.
- Phase 2: criteria `C1 word limit` (binary, programmatic: `len(text.split()) <= 120`), `C2 refund policy` (binary, judge, critical), `C3 answers the asked question` (binary, judge), `C4 tone` dropped because the 10 samples showed no tone failures.
- Phase 3: anchor for `C2 fail`: "States or implies a refund, credit or replacement when `order_record.refund_eligible` is false." Example: sample 7 ("We'll refund you right away") with `refund_eligible: false`. The second grader disagreed on sample 4 ("we can look into a refund"); the anchor was rewritten to count "look into" as not a promise.

---

## Exit Criteria

DONE when `evals/task_spec.json` and `evals/rubric.yaml` are committed, every criterion asks one question, every level has an observable anchor and a real example, and every check that code can perform is marked programmatic.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No real outputs available (feature not built yet) | **Adjust**: generate 10 outputs by running the prompt by hand on 10 realistic inputs and mark them `synthetic` in the samples file. |
| Phase 1 | Prompt template not found at the named path | **Stop**: ask for the correct path; do not reconstruct the prompt from memory. |
| Phase 2 | A criterion cannot be stated without a vague word | **Adjust**: split it into two or more binary criteria with observable conditions. |
| Phase 3 | No real example exists for an ordinal level | **Adjust**: remove the level and merge it into its neighbor. |
| Phase 3 | Second grader still disagrees after one anchor rewrite | **Retry**: rewrite the disputed anchors again and regrade; if the same criterion is still disputed after the second rewrite, record it in `open_questions` and split it into narrower binary criteria. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
