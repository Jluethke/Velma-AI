# promptfoo Eval Configuration

**One-line description:** Builds the eval as a `promptfooconfig.yaml` with file-referenced prompts, a pinned provider, tests generated from the golden and adversarial JSONL, deterministic assertions (`equals`, `regex`, `is-json`, `javascript` file scorers), calibrated `llm-rubric` judge assertions with an explicit grader provider, named metrics, and runs `promptfoo eval` with `--no-cache`, `--repeat` and JSON output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `golden_set` (string, required): `evals/data/golden.jsonl`.
- `adversarial_set` (string, required): `evals/data/adversarial.jsonl`.
- `scorer_module` (string, required): `evals/scorers.ts` plus `evals/assert_*.js` entry files from `evh-node-programmatic-scorers`.
- `judge_prompt` (string, required): `evals/judge/` with approved criteria.
- `version_manifest` (string, required): `evals/version_manifest.json`.
- `project_dir` (string, required): Repository root with Node.js.

---

## Outputs

- `promptfoo_config` (string): Path to `evals/promptfooconfig.yaml` and the generated `evals/tests/*.yaml`.
- `promptfoo_results` (string): Path to `logs/<system_version>/results.json` written by `promptfoo eval -o`, plus the copied manifest.

---

## Phase 1: Config Skeleton and Provider

### Entry Criteria
- promptfoo pinned in `package.json` devDependencies (`npm install --save-dev promptfoo@<exact version>`); run it as `npx promptfoo`.

### Actions
1. Create `evals/promptfooconfig.yaml`:
   ```yaml
   description: support-reply eval
   prompts:
     - file://../prompts/support/reply_prompt.json
   providers:
     - id: anthropic:messages:<model-id from config>
       config:
         temperature: <from config>
         max_tokens: <from config>
   defaultTest:
     options:
       provider: anthropic:messages:<judge model-id from config>
   tests:
     - file://tests/golden.yaml
     - file://tests/adversarial.yaml
   ```
   `file://` paths resolve relative to the config file. A `.json` prompt file can hold a chat message array with `{{variable}}` Nunjucks placeholders; a `.txt` file is a single user message.
2. `defaultTest.options.provider` sets the grader for model-graded assertions such as `llm-rubric`. If you omit it, promptfoo picks a default grader that is NOT the judge you calibrated. Always set it.
3. Prompt variables use Nunjucks `{{var}}` syntax, not Python `{var}`. If production uses `{var}`, convert in the eval prompt file only and diff the rendered output against production for one item.
4. Validate: `npx promptfoo validate -c evals/promptfooconfig.yaml` if your version has the command (check `npx promptfoo --help`); otherwise run step 2 of Phase 3 with `--filter-first-n 1`.

### Output
Config skeleton.

### Quality Gate
- `npx promptfoo eval -c evals/promptfooconfig.yaml --filter-first-n 3 --no-cache` completes and prints a results table.

---

## Phase 2: Tests and Assertions

### Entry Criteria
- Skeleton runs.

### Actions
1. Generate `evals/tests/golden.yaml` from `golden.jsonl` with a small script (one test per item): `vars` = the input fields, `metadata` = `id`, `stratum`, `severity`, and `assert` = the list for that item's criteria. Do not hand-edit generated tests; rerun the script.
2. Assertion types by criterion:

| Criterion | Assertion |
|---|---|
| Exact label | `type: equals`, `value: <target>` (case-sensitive; use `javascript` with the normalized scorer if normalization is needed) |
| Format | `type: regex`, `value: '^...$'` |
| JSON with schema | `type: is-json`, `value: <JSON Schema object>` |
| Custom code scorer | `type: javascript`, `value: file://../assert_json_schema.js` |
| Judge criterion | `type: llm-rubric`, `value: <criterion prompt text>`; or a `javascript` assertion that calls your calibrated runner |
| Canary or injection | `type: not-contains`, `value: CANARY-...` |
| Latency ceiling set by product | `type: latency`, `threshold: <ms from task_spec>` |

3. Name every assertion with `metric: <criterion_id>` so results aggregate per criterion.
4. Judge calibration applies to the exact prompt the grader sees. `llm-rubric` wraps your rubric text in promptfoo's own grading prompt; if you use it, recalibrate it in `evh-judge-calibration` in that form, or override the grading prompt via `defaultTest.options.rubricPrompt` (check the promptfoo docs for the current option name), or call your own runner from a `javascript` assertion.
5. Critical items: add `metadata.severity: critical`; the CI gate reads it.

### Output
Generated test files and assertions.

### Quality Gate
- Number of tests in the generated YAML equals the number of items in `golden.jsonl` plus `adversarial.jsonl` (count with `grep -c "^- " ` or load with `yaml`).
- Every assertion has a `metric`.

---

## Phase 3: Run and Read Results

### Entry Criteria
- Tests generated.

### Actions
1. Write the manifest (`node evals/tools/make_manifest.mjs`), then:
   `npx promptfoo eval -c evals/promptfooconfig.yaml --no-cache --repeat K -j N -o logs/<system_version>/results.json`
   `K` from `evh-repeat-variance-epochs` (1 on the first run). `-j` sets max concurrency. `--no-cache` prevents stale cached outputs from an earlier prompt version.
2. Copy the manifest into `logs/<system_version>/`.
3. View: `npx promptfoo view` and open failing rows.
4. Read the JSON: check top-level keys first with `node -e "const r=require('./logs/<v>/results.json');console.log(Object.keys(r), Object.keys(r.results))"`. In current versions per-row results sit in `results.results[]` with `success`, `score`, `latencyMs`, `cost`, `response.tokenUsage`, `testCase`, `gradingResult.componentResults`, and `error` for provider errors. Confirm against your output before writing parsers.
5. promptfoo exits non-zero when any assertion fails. In local runs that is expected; do not treat the exit code alone as the score.

### Output
`promptfoo_results` with manifest.

### Quality Gate
- Row count in `results.results` equals tests times prompts times providers times `K`.
- Count of rows with `error` set is printed and stated separately from assertion failures.

---

## Worked Example

Illustrative only. 197 golden and 64 adversarial items; criteria C1 (word limit), C2 (judge), canary.

- Phase 1: `--filter-first-n 3 --no-cache` prints a 3-row table, all assertions evaluated.
- Phase 2: `evals/tools/make_tests.mjs` writes 261 tests; C1 uses `javascript` with `assert_max_words.js`; C2 calls the calibrated runner from `assert_c2_judge.js` because `llm-rubric` was not calibrated in its wrapped form.
- Phase 3: `npx promptfoo eval -c evals/promptfooconfig.yaml --no-cache --repeat 1 -j 8 -o logs/a41f0c9e2b7d/results.json`; 261 rows, 3 with provider `error`, 22 assertion failures. Exit code non-zero as expected.

---

## Exit Criteria

DONE when the config runs end to end with a pinned provider and explicit grader, every criterion is a named metric, and results JSON plus manifest sit under `logs/<system_version>/` with errors counted apart from failures.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Option or flag not recognized | **Stop**: run `npx promptfoo eval --help` or read the docs; do not invent options. |
| Phase 1 | Variables render empty | **Adjust**: switch `{var}` to `{{var}}` and check `vars` names match. |
| Phase 2 | `llm-rubric` uses an uncalibrated wrapper prompt | **Adjust**: call the calibrated runner from a `javascript` assertion. |
| Phase 3 | Results differ on rerun with no changes | **Return**: measure variance in `evh-repeat-variance-epochs`; confirm `--no-cache` was used. |
| Phase 3 | Many provider errors | **Adjust**: lower `-j` and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
