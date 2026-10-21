# Prompt and Model Version Pinning for Evals

**One-line description:** Moves prompts into versioned files, pins dated model snapshot ids instead of moving aliases, hashes the prompt, dataset, rubric and harness version into a `version_manifest.json`, and makes every eval run write that manifest next to its results so any score can be traced to exactly what produced it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `model_ids` (object, required): The model id strings for the system under test and for the judge, exactly as the provider's API accepts them, plus generation parameters (temperature, max tokens).
- `golden_set` (string, required): Path to `evals/data/golden.jsonl`; its hash goes into the manifest.

---

## Outputs

- `version_manifest` (string): Path to `evals/version_manifest.json` with prompt file paths and sha256, model ids, generation parameters, dataset and rubric sha256, harness name and version, git commit, and a single `system_version` id derived from all of them.

---

## Phase 1: Put Prompts in Files

### Entry Criteria
- `project_dir` is a git repository (`git rev-parse --is-inside-work-tree` prints `true`).

### Actions
1. Find inline prompts: `git grep -nE "(system|prompt)\s*=\s*(f?\"\"\"|f?'''|`)"` and read each hit. Move each prompt text into `prompts/<feature>/<name>.txt` (or `.md`, or `.jinja` if it uses Jinja2 templating).
2. Change the code to load the file at startup. Change ONE call site, run the existing tests, then the next. Do not move all prompts in one edit.
3. Keep template variables identical to before (`{customer_message}` stays `{customer_message}`). Diff the rendered prompt before and after the move for one sample input; the bytes must match.

### Output
Prompts in `prompts/`, code loading them, tests passing.

### Quality Gate
- `git grep -nE "(system|prompt)\s*=\s*(f?\"\"\"|f?''')"` returns no prompt bodies in application code.
- The project's test command (for example `pytest -q` or `npm test`) exits 0 after the move.
- Rendered prompt diff for the sample input is empty.

---

## Phase 2: Pin Model Snapshots

### Entry Criteria
- `model_ids` provided.

### Actions
1. For each model id, check on the provider's model documentation page whether it is a dated snapshot or an alias that can move to a newer snapshot. Record `pinned: true` only for snapshot ids. If only an alias exists, record `pinned: false` and add an open question; scores from an alias can change without any code change.
2. Put model ids and generation parameters in config (`config/llm.yaml` or environment variables), not scattered literals. `git grep -n "<model id string>"` must show only the config file.
3. Record SDK versions: `pip show anthropic` or `npm ls @anthropic-ai/sdk` (or the provider SDK in use), and the harness version: `pip show inspect_ai` or `npx promptfoo@latest --version`. Pin the harness in `requirements-eval.txt` or `package.json` with an exact version.

### Output
Config file with pinned ids and parameters; pinned dependency versions.

### Quality Gate
- `git grep -n "<model id>"` lists only config files.
- `requirements-eval.txt` or `package.json` lists the harness with an exact `==` or exact semver version.

---

## Phase 3: Write and Enforce the Manifest

### Entry Criteria
- Prompts in files and model ids in config.

### Actions
1. Create `evals/tools/make_manifest.py` (or `.mjs`) that computes sha256 of each prompt file, `evals/data/golden.jsonl`, `evals/data/adversarial.jsonl`, and `evals/rubric.yaml`; reads model ids and parameters from config; reads `git rev-parse HEAD` and `git status --porcelain` (non-empty means a dirty tree); and writes `evals/version_manifest.json`.
2. Compute `system_version` as the first 12 hex characters of sha256 over the sorted JSON of prompt hashes, model ids and generation parameters. Two runs with the same `system_version` ran the same system.
3. Make every eval entry point call the manifest writer first and copy the manifest into the run's log directory. Refuse to run a scored eval on a dirty tree unless `--allow-dirty` is passed, and record `dirty: true` in that case.
4. Tag releases: `git tag prompt/<feature>/v<N>` when a prompt version ships.

### Output
`version_manifest`.

### Quality Gate
- Running the manifest script twice without changes prints the same `system_version`.
- Editing one character in a prompt file changes `system_version` (verify, then revert with `git checkout -- <file>`).
- The run log directory of the next eval contains `version_manifest.json`.

---

## Worked Example

Illustrative only. Inline prompt in `app/reply.py`; system model and judge model given as two snapshot ids in `model_ids`.

- Phase 1: `git grep` finds `SYSTEM = """You are a support...` in `app/reply.py`; moved to `prompts/support/reply_system.txt`; `pytest -q` prints `42 passed`; rendered diff empty.
- Phase 2: provider docs confirm both ids are dated snapshots; `pinned: true`. `inspect_ai==` exact version written to `requirements-eval.txt`.
- Phase 3: manifest shows `system_version: "a41f0c9e2b7d"`. Changing "support" to "Support" in the prompt gives `"6c03e1d8f2aa"`; reverted.

---

## Exit Criteria

DONE when no prompt bodies remain inline, model ids live in config with pin status recorded, and every eval run writes a manifest whose `system_version` changes when and only when the prompt, model or parameters change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tests fail after moving a prompt | **Retry**: diff the rendered prompt; fix whitespace or escaping differences before moving the next prompt. |
| Phase 1 | Prompt is assembled from many fragments at runtime | **Adjust**: version each fragment file and hash the fully rendered template for a fixed sample input as well. |
| Phase 2 | Provider offers only an alias | **Adjust**: record `pinned: false`, store the model id string the API echoes back in each response, and compare it across runs. |
| Phase 3 | Eval run on a dirty tree | **Stop**: commit or stash first, or rerun with `--allow-dirty` and mark the result non-releasable. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
