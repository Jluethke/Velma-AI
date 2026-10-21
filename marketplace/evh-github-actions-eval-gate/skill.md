# GitHub Actions LLM Eval Gate

**One-line description:** Adds a GitHub Actions workflow that runs the offline replay tier on every push and the live LLM eval only on pull requests that touch prompts, model config, eval data or LLM code, with path filters, a concurrency group that cancels superseded runs, repository secrets that are not exposed to fork PRs, uploaded logs as artifacts, a JUnit summary, and a required status check on the default branch.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): `python` (pytest and Inspect) or `node` (Vitest and promptfoo).
- `project_dir` (string, required): Repository root with a `.github/workflows/` directory (create it if absent).
- `version_manifest` (string, required): `evals/version_manifest.json`; the workflow writes and uploads it.
- `ci_platform` (string, required): Must be `github` for this flow.

---

## Outputs

- `ci_workflow` (string): Path to `.github/workflows/llm-eval.yml` plus the branch protection setting that makes the live eval job a required check.

---

## Phase 1: Write the Workflow

### Entry Criteria
- The offline tier passes locally (`pytest -q` or `npm test`).
- The live tier passes locally (`pytest -m llm_eval` or `npm run eval:live`).

### Actions
1. Create `.github/workflows/llm-eval.yml` with two jobs:
   ```yaml
   name: llm-eval
   on:
     push:
       branches: [main]
     pull_request:
       paths:
         - "prompts/**"
         - "config/llm.yaml"
         - "evals/**"
         - "src/llm/**"
     workflow_dispatch:
   concurrency:
     group: llm-eval-${{ github.ref }}
     cancel-in-progress: true
   permissions:
     contents: read
   jobs:
     offline:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         # python: actions/setup-python@v5 with python-version from .python-version, then pip install -r requirements-eval.txt, then pytest -q
         # node: actions/setup-node@v4 with node-version-file: .nvmrc and cache: npm, then npm ci, then npm test
     live:
       if: github.event_name == 'pull_request' || github.event_name == 'workflow_dispatch'
       needs: offline
       runs-on: ubuntu-latest
       timeout-minutes: <from measured live run time plus margin the team sets>
       env:
         ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
       steps:
         - uses: actions/checkout@v4
         # setup as above
         # python: python evals/tools/make_manifest.py && pytest -m llm_eval --junitxml=reports/llm_eval.xml -q
         # node:   node evals/tools/make_manifest.mjs && npm run eval:live
         - uses: actions/upload-artifact@v4
           if: always()
           with:
             name: llm-eval-logs
             path: |
               logs/
               reports/
               evals/version_manifest.json
   ```
   Replace the commented lines with the exact steps for `stack`. Use the action major versions shown in each action's README at the time of writing; check them rather than copying versions from memory.
2. The path filter list must include every file that changes model behavior: prompts, model config, eval data, scorers, judge prompts, and the code that assembles the request. A missing path means a prompt change can merge without an eval.
3. Pin tool versions: `requirements-eval.txt` with `==` versions, or `package-lock.json` with `npm ci`. Do not run `npx promptfoo@latest` in CI; pin the version in `package.json`.

### Output
Workflow file.

### Quality Gate
- `actionlint .github/workflows/llm-eval.yml` exits 0 (install from the rhysd/actionlint releases), or, if actionlint is unavailable, `python -c "import yaml;yaml.safe_load(open('.github/workflows/llm-eval.yml'))"` exits 0 and the workflow appears in the repository Actions tab after push.
- `grep -n "@latest" .github/workflows/llm-eval.yml` returns nothing.

---

## Phase 2: Secrets and Fork Safety

### Entry Criteria
- Workflow file exists.

### Actions
1. Add the key: `gh secret set ANTHROPIC_API_KEY` (paste when prompted) or Settings, Secrets and variables, Actions. Never write the key into the workflow or any file.
2. Know the documented behavior: workflows triggered by `pull_request` from a fork do not receive repository secrets. The live job then fails at the key check from the regression suite. That is correct. Do NOT switch to `pull_request_target` to get secrets for fork PRs; it runs with secrets in the context of the base repository and checking out untrusted PR code there exposes the key.
3. For fork contributions, a maintainer runs the eval through `workflow_dispatch` on a branch after reviewing the code.
4. Set a spend limit on the provider account or a separate API key for CI with its own limit, so a looping job cannot run up cost.

### Output
Secret configured, fork policy documented in `evals/README.md`.

### Quality Gate
- `gh secret list` shows `ANTHROPIC_API_KEY`.
- `grep -rn "pull_request_target" .github/workflows/` returns nothing.

---

## Phase 3: Required Check and First Run

### Entry Criteria
- Secret configured.

### Actions
1. Open a PR that changes one word in a prompt file. Confirm both jobs run and the live job uploads `llm-eval-logs`.
2. Open a PR that changes only `README.md`. Confirm the live job does not run (path filter).
3. Make the check required: Settings, Branches (or Rules, Rulesets), require status checks, select `live`. With path filters, a required check that never ran can block merges of unrelated PRs; if that happens, the documented options are a skipped-job companion workflow with the same job name or moving the path logic into a job-level `if` using a paths-filter step. Check GitHub's docs for "handling skipped but required checks" for your plan.
4. Show results in the PR: publish the JUnit file with a test reporter action of your choice, or write a short markdown summary to `$GITHUB_STEP_SUMMARY` (`cat logs/*/CI.md >> "$GITHUB_STEP_SUMMARY"`).

### Output
`ci_workflow` running as a required check.

### Quality Gate
- The prompt-change PR shows a `live` check result with an artifact named `llm-eval-logs`.
- The README-only PR shows no `live` run.
- The job summary page shows the CI table.

---

## Worked Example

Illustrative only. `stack: python`, Inspect plus pytest, measured live run 11 minutes.

- Phase 1: workflow with `setup-python`, `pip install -r requirements-eval.txt`, `pytest -m llm_eval --junitxml=reports/llm_eval.xml -q`; `timeout-minutes: 25` chosen by the team from the 11-minute measurement. `actionlint` exits 0.
- Phase 2: `gh secret set ANTHROPIC_API_KEY`; CI key has its own monthly limit set in the provider console.
- Phase 3: PR #212 (prompt word change) runs `offline` 41 s and `live` 10 m 52 s, uploads logs; PR #213 (README) runs `offline` only. `live` made required with a companion skip workflow.

---

## Exit Criteria

DONE when the workflow runs offline on every push, live on behavior-changing PRs, never exposes the key to fork code, uploads logs and manifest, shows a summary, and the live check is required.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | actionlint reports errors | **Adjust**: fix each reported line; rerun. |
| Phase 2 | Fork PR live job fails on missing key | **Adjust**: expected; run via `workflow_dispatch` after review. |
| Phase 3 | Required check blocks unrelated PRs | **Adjust**: add the companion skip job or job-level path logic per GitHub docs. |
| Phase 3 | Live job times out | **Retry**: lower dataset size for PR runs only if `evh-sample-size-confidence-intervals` shows the smaller set still detects the agreed effect; otherwise raise the timeout. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
