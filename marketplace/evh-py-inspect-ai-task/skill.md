# Inspect AI Eval Task (Python)

**One-line description:** Builds the eval as an Inspect AI (`inspect_ai`) task: loads the golden and adversarial JSONL with `json_dataset` and `FieldSpec`, renders the versioned prompt with a solver chain, wraps the tested Python scorers and the calibrated judge as `@scorer` functions with `accuracy()` and `stderr()` metrics, runs `inspect eval` with epochs and a log directory, and reads results with `inspect view` and `read_eval_log`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `golden_set` (string, required): `evals/data/golden.jsonl`.
- `adversarial_set` (string, required): `evals/data/adversarial.jsonl`.
- `scorer_module` (string, required): `evals/scorers.py` from `evh-py-programmatic-scorers`.
- `judge_prompt` (string, required): `evals/judge/` with approved criteria.
- `version_manifest` (string, required): `evals/version_manifest.json`; copied into each run.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `inspect_task` (string): Path to `evals/inspect_task.py` defining `@task` functions `main_eval()` and `adversarial_eval()`.
- `inspect_log` (string): Path to the run's log directory (for example `logs/<system_version>/`) containing `.eval` log files and `version_manifest.json`.

---

## Phase 1: Dataset and Solver

### Entry Criteria
- `pip install inspect-ai` done and its exact version pinned in `requirements-eval.txt`; the provider package for your model installed (for Anthropic models: `pip install anthropic`).

### Actions
1. In `evals/inspect_task.py` load the data:
   `from inspect_ai.dataset import json_dataset, FieldSpec`
   `ds = json_dataset("evals/data/golden.jsonl", FieldSpec(input="input_text", target="target", id="id", metadata=["stratum", "split", "group_id", "severity"]))`
   `input` must be a string or a list of chat messages. If your items store structured fields, add a precomputed `input_text` field (the rendered user message) during dataset building, or use a `sample_fields` function that returns `Sample(...)`.
2. Filter to the split being scored: `ds = ds.filter(lambda s: s.metadata["split"] == "test")`.
3. Solver chain: `from inspect_ai.solver import system_message, generate`; `solver=[system_message(open("prompts/support/reply_system.txt").read()), generate()]`. `system_message` treats `{name}` as a template slot filled from sample metadata; if your prompt contains literal braces, check the docs for escaping or load the text without template processing.
4. Do not reimplement the application's prompt assembly differently from production. If production builds the prompt in code, call that code from a custom `@solver` so the eval tests what ships.

### Output
Dataset and solver defined.

### Quality Gate
- `inspect eval evals/inspect_task.py@main_eval --model <provider/model> --limit 3` completes and prints a results table with 3 samples.

---

## Phase 2: Scorers

### Entry Criteria
- Three-sample run works.

### Actions
1. Wrap each programmatic scorer:
   ```python
   from inspect_ai.scorer import scorer, Score, Target, accuracy, stderr, CORRECT, INCORRECT
   from evals.scorers import score_json_schema

   @scorer(metrics=[accuracy(), stderr()])
   def json_schema_ok():
       async def score(state, target: Target):
           r = score_json_schema(state.output.completion, state.metadata | {"target": target.text})
           return Score(value=CORRECT if r["passed"] else INCORRECT, answer=state.output.completion, explanation=r["reason"])
       return score
   ```
2. Judge criteria: either wrap your calibrated runner (`await judge(...)` from `evh-py-judge-runner`) inside a `@scorer` in the same way, or use Inspect's built-in `model_graded_qa(template=..., model=...)` only if you recalibrate that exact template with `evh-judge-calibration`. A judge that was not calibrated in its final form is not approved.
3. Pass several scorers as a list: `Task(dataset=ds, solver=[...], scorer=[json_schema_ok(), refund_policy_judge()])`.
4. Built-in scorers that are real and useful: `match()` (prefix or suffix match), `includes()`, `pattern(regex)`, `exact()`, `f1()`. Check `python -c "import inspect_ai.scorer as s;print(dir(s))"` for what your version has before using one.
5. Do not compute pass rates by hand from the console output. Read them from the log (Phase 3).

### Output
`inspect_task` with all criteria scored.

### Quality Gate
- `python -c "import inspect_ai.scorer as s;print(dir(s))"` lists every built-in scorer the task imports.
- A 3-sample run shows one metrics column per scorer.

---

## Phase 3: Full Run and Log Reading

### Entry Criteria
- Scorers attached.

### Actions
1. Write the manifest, then run:
   `python evals/tools/make_manifest.py && inspect eval evals/inspect_task.py@main_eval --model <provider/model> --epochs K --log-dir logs/<system_version>`
   Then the adversarial task the same way with `@adversarial_eval`. `K` comes from `evh-repeat-variance-epochs` (use 1 on the first run). Generation parameters can be set with flags such as `--temperature` and `--max-tokens`; confirm names with `inspect eval --help`.
2. Copy `evals/version_manifest.json` into `logs/<system_version>/`.
3. Inspect visually: `inspect view --log-dir logs/<system_version>` and open failing samples; read each failure's transcript.
4. Read programmatically for downstream flows:
   `from inspect_ai.log import read_eval_log`; `log = read_eval_log(path)`; check `log.status == "success"`; iterate `log.samples` reading `s.id`, `s.epoch`, `s.scores`, `s.metadata`, `s.error`. Field availability can vary by version; print `dir(log.samples[0])` once.
5. Samples with `error` set are not failures of the model's quality; count them separately. Never let an API error become a scored `INCORRECT` without being reported as an error.

### Output
`inspect_log` directory with logs and manifest.

### Quality Gate
- `log.status == "success"` for both tasks, printed by a one-line script.
- Count of samples in the log equals dataset size times `K`.
- Count of samples with `error` is printed and stated.

---

## Worked Example

Illustrative only. 197 test items, 64 adversarial items, scorers `json_schema_ok`, `max_words_ok`, `refund_policy_judge` (C2 approved).

- Phase 1: `inspect eval evals/inspect_task.py@main_eval --model anthropic/<model-id> --limit 3` prints a table with `accuracy` and `stderr`.
- Phase 2: three scorer columns appear.
- Phase 3: run with `--epochs 1 --log-dir logs/a41f0c9e2b7d`. `read_eval_log` shows status success, 197 samples, 2 with `error` (overloaded after retries). `refund_policy_judge` accuracy 0.914, stderr 0.020. Adversarial task: 59 of 64 correct, failures match the baseline list in `ADVERSARIAL.md`.

---

## Exit Criteria

DONE when both tasks run end to end, every criterion has a scorer column, logs and the manifest sit in a directory named by `system_version`, and errored samples are counted separately.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `FieldSpec` input is a dict, not a string | **Adjust**: add a rendered `input_text` field or use a `sample_fields` function. |
| Phase 1 | A CLI flag is rejected | **Stop**: read `inspect eval --help`; do not guess flag names. |
| Phase 2 | Scorer raises inside Inspect | **Retry**: run the plain scorer in pytest on the failing output; fix the scorer there first. |
| Phase 3 | Log status `error` or `cancelled` | **Retry**: rerun; Inspect can retry a failed log with `inspect eval-retry <log file>` (check `--help`). |
| Phase 3 | Many sample errors | **Adjust**: lower concurrency (see `--max-connections` in `--help`) and rerun before scoring. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
