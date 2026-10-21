# LLM-as-Judge Prompt Design

**One-line description:** Writes one judge prompt per rubric criterion that asks a single binary or anchored question, gives the judge the input, the reference facts and the anchors, makes it write its reasoning before a verdict in a fixed machine-readable format, and includes few-shot examples drawn from the dev split only, with controls for the position, verbosity and self-preference biases documented by Zheng et al. (2023).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rubric` (object, required): `evals/rubric.yaml` with criteria marked `method: judge`.
- `golden_set` (string, required): Path to `evals/data/golden.jsonl` with adjudicated labels and `required_facts`.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `judge_prompt` (string): Directory `evals/judge/` with one prompt file per judge criterion (`<criterion_id>.txt`), a `verdict_schema.json` shared by all of them, and `judge_config.yaml` listing criterion id, prompt file, scale, few-shot item ids, and the judge model key from config.

---

## Phase 1: One Criterion per Judge Call

### Entry Criteria
- At least one criterion has `method: judge`.

### Actions
1. Create one prompt file per criterion. Never ask one judge call to grade several criteria and return several scores; criteria bleed into each other and you cannot calibrate them separately.
2. Each prompt has these sections in this order:
   - Role line: "You grade one property of a reply. You do not grade anything else."
   - The criterion question copied verbatim from `rubric.yaml`.
   - The level anchors copied verbatim, each with its level name.
   - Inputs, each wrapped in XML-style tags: `<user_input>`, `<context>` (retrieved docs or tool results if the system saw them), `<required_facts>` (when `target_kind` is `required_facts`), `<reply>`.
   - Instructions: "Quote the exact sentence from `<reply>` that decides the grade, then explain in at most three sentences, then give the verdict." Reasoning before the verdict; a verdict written first is not influenced by the reasoning.
   - Output format: the verdict schema in Phase 2.
3. Tell the judge what to ignore when the criterion is not about it: "Do not consider length, tone or formatting." This counters verbosity bias (longer answers rated higher).
4. Give the judge the same context the system saw. A judge grading groundedness without the retrieved documents grades against its own memory instead.

### Output
Draft prompt files in `evals/judge/`.

### Quality Gate
- `ls evals/judge/*.txt | wc -l` equals the number of `method: judge` criteria.
- Each prompt file contains the criterion question verbatim (check with `grep -F`).

---

## Phase 2: Fixed Verdict Format

### Entry Criteria
- Draft prompts exist.

### Actions
1. Write `evals/judge/verdict_schema.json`:
   `{"type":"object","required":["evidence_quote","reasoning","verdict"],"properties":{"evidence_quote":{"type":"string"},"reasoning":{"type":"string"},"verdict":{"enum":["pass","fail"]}},"additionalProperties":false}`
   For ordinal criteria set the enum to the anchor level names, never bare numbers, so a judge cannot return a value outside the scale.
2. The runner (`evh-py-judge-runner` or `evh-node-judge-runner`) enforces this schema through the provider's tool use or structured output feature. In the prompt, still show the exact JSON shape once.
3. Add an `unsure` option ONLY if the rubric allows it and calibration will count it; otherwise judges overuse it.

### Output
`verdict_schema.json`.

### Quality Gate
- `python -c "import json;json.load(open('evals/judge/verdict_schema.json'))"` exits 0.
- The schema `verdict` enum equals the rubric levels for that criterion.

---

## Phase 3: Few-Shot Examples and Bias Controls

### Entry Criteria
- Prompts and schema exist; `golden.jsonl` has adjudicated labels.

### Actions
1. Pick few-shot examples from the DEV split only, never from test. Include at least one example per verdict level, and include a hard negative (a reply that looks good but fails the criterion) and a hard positive (a short, plain reply that passes). Record their item ids in `judge_config.yaml` and exclude those ids from judge calibration later.
2. Order few-shot examples so verdict levels alternate; a run of identical verdicts teaches the judge to repeat the last label.
3. Self-preference bias: if the judge model is the same model family as the system under test, record it in `judge_config.yaml` as `same_family: true`. Calibration against human labels is then mandatory before trusting the judge (it is mandatory anyway; this flag makes the risk visible in the report).
4. Position bias applies to pairwise prompts; that is handled in `evh-pairwise-comparison` by swapping order. For single-reply grading, keep the reply in the same position in every prompt.
5. Render one complete prompt for one dev item and read it end to end. Check that no template variable is left unfilled (`grep -n "{" rendered.txt`).

### Output
Final `judge_prompt` directory and `judge_config.yaml`.

### Quality Gate
- `python -c "import json,yaml;c=yaml.safe_load(open('evals/judge/judge_config.yaml'));t={json.loads(l)['id'] for l in open('evals/data/test.jsonl')};print([i for k in c['criteria'] for i in k['few_shot_ids'] if i in t])"` prints `[]`.
- The rendered sample prompt has no unfilled `{variable}`.

---

## Worked Example

Illustrative only. Criterion C2 "Does the reply promise a refund, credit or replacement that `order_record.refund_eligible` does not allow?" (binary; `fail` means a forbidden promise).

- Phase 1: `evals/judge/C2.txt` with `<user_input>`, `<context>` holding the order record JSON, `<reply>`; instruction to quote the deciding sentence first; "Do not consider tone or length."
- Phase 2: verdict enum `["pass","fail"]`.
- Phase 3: few-shot ids `dev-0041` (fail: "We'll send a replacement today", eligible false), `dev-0102` (pass: "Refunds aren't available for this order, but here's how to request a repair"), `dev-0317` (hard negative: polite and long, implies "we'll make it right with a credit"). `same_family: true` recorded. Rendered prompt has no `{`.

---

## Exit Criteria

DONE when every judge criterion has its own prompt with verbatim question and anchors, a strict verdict schema, few-shot examples only from dev, and a rendered sample with no unfilled variables.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Criterion needs facts the judge cannot see | **Adjust**: add the needed context or `required_facts` to the judge inputs; never let the judge rely on its own knowledge for ground truth. |
| Phase 2 | Ordinal scale with numeric levels | **Adjust**: replace numbers with anchor names in the enum. |
| Phase 3 | Not enough dev examples for a level | **Return**: label more dev items in `evh-golden-labels-annotation`. |
| Phase 3 | A few-shot id is in test | **Stop**: replace it with a dev item. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
