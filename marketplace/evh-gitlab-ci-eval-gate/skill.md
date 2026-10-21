# GitLab CI LLM Eval Gate

**One-line description:** Adds GitLab CI jobs that run the offline replay tier on every pipeline and the live LLM eval only in merge request pipelines that change prompts, model config, eval data or LLM code (`rules:changes`), with a masked CI/CD variable for the API key, `interruptible` jobs, JUnit test reports shown in the merge request, logs kept as artifacts, and "Pipelines must succeed" enforcing the gate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): `python` or `node`.
- `project_dir` (string, required): Repository root with `.gitlab-ci.yml` (create it if absent).
- `version_manifest` (string, required): `evals/version_manifest.json`; written and kept as an artifact.
- `ci_platform` (string, required): Must be `gitlab` for this flow.

---

## Outputs

- `ci_workflow` (string): The `llm-eval-offline` and `llm-eval-live` jobs in `.gitlab-ci.yml` and the merge request setting that requires the pipeline to succeed.

---

## Phase 1: Write the Jobs

### Entry Criteria
- Offline and live tiers pass locally.

### Actions
1. Add to `.gitlab-ci.yml`:
   ```yaml
   llm-eval-offline:
     stage: test
     image: python:<version from .python-version>   # node: node:<version from .nvmrc>
     interruptible: true
     script:
       - pip install -r requirements-eval.txt        # node: npm ci
       - pytest -q --junitxml=reports/offline.xml     # node: npm test (add a junit reporter)
     artifacts:
       when: always
       reports:
         junit: reports/offline.xml

   llm-eval-live:
     stage: test
     image: python:<version>
     interruptible: true
     needs: [llm-eval-offline]
     timeout: <from measured live run time plus margin the team sets>
     rules:
       - if: $CI_PIPELINE_SOURCE == "merge_request_event"
         changes:
           - prompts/**/*
           - config/llm.yaml
           - evals/**/*
           - src/llm/**/*
       - if: $CI_PIPELINE_SOURCE == "web"
     script:
       - python evals/tools/make_manifest.py
       - pytest -m llm_eval --junitxml=reports/llm_eval.xml -q
     artifacts:
       when: always
       expire_in: <retention the team sets>
       paths:
         - logs/
         - evals/version_manifest.json
       reports:
         junit: reports/llm_eval.xml
   ```
   Replace the Python commands with the Node ones for `stack == node` (`npm ci`, `node evals/tools/make_manifest.mjs`, `npm run eval:live`).
2. `rules:changes` in a merge request pipeline compares against the target branch. In branch pipelines without a merge request, `changes` evaluates to true in some cases (see GitLab docs on `rules:changes` behavior for new branches); use the `merge_request_event` condition as shown so the live job runs only in MR pipelines.
3. Pin images by version tag (not `latest`) and dependencies by exact version.

### Output
CI jobs in `.gitlab-ci.yml`.

### Quality Gate
- CI Lint passes: in the project, Build, Pipeline editor shows "This GitLab CI configuration is valid", or `glab ci lint` exits 0.
- `grep -n ":latest" .gitlab-ci.yml` returns nothing.

---

## Phase 2: Variables and Protection

### Entry Criteria
- Jobs written.

### Actions
1. Add `ANTHROPIC_API_KEY` under Settings, CI/CD, Variables with "Mask variable" on (or `glab variable set ANTHROPIC_API_KEY --masked`; confirm flags with `glab variable set --help`).
2. Know the documented behavior: a variable marked "Protected" is only passed to pipelines on protected branches and tags. If you protect it, MR pipelines from unprotected feature branches will not get the key and the live job fails at the key check. Decide explicitly: either leave it unprotected and restrict who can push branches, or keep it protected and run the live eval from protected branches only. Record the decision in `evals/README.md`.
3. Merge requests from forks run in the fork's project by default and do not get the parent's variables. Do not work around this by copying the key into the fork.
4. Use a CI-only API key with its own spend limit in the provider console.

### Output
Masked variable and documented protection decision.

### Quality Gate
- `glab variable list` (or the UI) shows `ANTHROPIC_API_KEY` masked.
- `evals/README.md` states the protected or unprotected decision and its reason.

---

## Phase 3: Enforce and Verify

### Entry Criteria
- Variable configured.

### Actions
1. Settings, Merge requests: enable "Pipelines must succeed".
2. Open an MR changing one prompt word. Confirm `llm-eval-live` runs, the merge request widget shows the JUnit test summary, and artifacts include `logs/`.
3. Open an MR changing only `README.md`. Confirm `llm-eval-live` is not created.
4. Push a second commit to the prompt MR while the first live job runs. Confirm the first job is cancelled; `interruptible: true` only takes effect when the project setting "Auto-cancel redundant pipelines" is on, so check it.

### Output
`ci_workflow` enforced.

### Quality Gate
- The prompt MR shows a test report with the live gate test names.
- The README MR pipeline lists no `llm-eval-live` job.
- The superseded live job shows status "canceled".

---

## Worked Example

Illustrative only. `stack: node`, promptfoo plus Vitest.

- Phase 1: jobs use `node:20.17.0` from `.nvmrc`; live job runs `npm run eval:live`; pipeline editor says valid.
- Phase 2: masked, unprotected key; branch push restricted to maintainers and developers; decision written to `evals/README.md`.
- Phase 3: MR !58 shows "Test summary: 3 tests, 0 failed" for the live gates; MR !59 (README) has only `llm-eval-offline`; second push to !58 cancels the earlier live job.

---

## Exit Criteria

DONE when the offline job runs in every pipeline, the live job runs only in behavior-changing MR pipelines with a masked key, JUnit results show in the MR, logs and manifest are kept, and "Pipelines must succeed" is on.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lint error | **Adjust**: fix the line reported by the pipeline editor. |
| Phase 2 | Live job gets an empty key | **Adjust**: check the Protected flag against the branch's protection status. |
| Phase 3 | Live job runs on unrelated MRs | **Adjust**: check the `changes` globs and the `if` condition order. |
| Phase 3 | JUnit report not shown | **Retry**: confirm the report path matches the file the test runner wrote. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
