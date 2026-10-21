# Docs CI Workflow on GitHub Actions

**One-line description:** Wires every docs check built in this domain (markdownlint, Vale, executable samples, strict API reference build, strict site build, offline link check) into one GitHub Actions workflow per stack and site generator, validates the YAML with actionlint, and proves the gate is live by pushing a deliberately broken link on a throwaway branch and watching the job fail.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node`, `go` or `rust`.
- `site_generator` (string, required): `mkdocs`, `docusaurus`, `sphinx` or `none`.
- `link_report` (object[], required): Result of `dfc-lychee-link-check`; its offline command is reused verbatim.
- `markdownlint_config` (string, required): Config path from `dfc-markdownlint-config`; the CI step runs `npx markdownlint-cli2` with no globs so it reads `globs` and `ignores` from this file.

---

## Outputs

- `docs_workflow_path` (string): Path to the workflow file (`.github/workflows/docs.yml`).
- `docs_ci_run` (object[]): Evidence per check: job and step name, run URL of a passing run, run URL of the failing mutation run, and the step that failed in it.

---

## Phase 1: Assemble the Commands

### Entry Criteria
- Every earlier flow that applies to `stack` and `site_generator` finished with its gate passing.
- The repository is on GitHub (`git remote get-url origin` contains `github.com`).

### Actions
1. Collect the exact commands from the earlier flows. Use this table; copy flags exactly:

   | Check | python | node | go | rust |
   |---|---|---|---|---|
   | Docstring lint | `ruff check --select D <pkg_dir>` and `pydoclint <pkg_dir>` | `npx eslint src` | `staticcheck ./...` | `cargo clippy --all-targets -- -D warnings` |
   | Samples | the `sample_test_command` from `dfc-py-doctest-samples` | `npm run test:samples` | `go test -run '^Example' ./...` | `cargo test --doc --all-features` |
   | API reference | `sphinx-build -W --keep-going -n -b html docs docs/_build/html` | `npx typedoc` | `go vet ./...` (rendering is checked on pkg.go.dev, not in CI) | `RUSTDOCFLAGS="-D warnings" cargo doc --no-deps --all-features` |

   | Check | Command |
   |---|---|
   | Markdown lint | `npx markdownlint-cli2` |
   | Prose lint (only if `.vale.ini` exists) | `vale sync && vale --minAlertLevel=error docs README.md` |
   | Site build, mkdocs | `mkdocs build --strict` |
   | Site build, docusaurus | `npm ci --prefix website && npm run build --prefix website` |
   | Site build, sphinx | covered by the API reference command |
   | Links | offline command recorded in `link_report` |

2. Run each command locally once more before writing YAML. A command that fails locally will fail in CI; fix it in its own flow first.

### Output
Command list per job.

### Quality Gate
- Every command in the list exited 0 in a local run in this phase.

---

## Phase 2: Write and Lint the Workflow

### Entry Criteria
- Command list complete.

### Actions
1. Write `.github/workflows/docs.yml`. Example for `stack == 'python'`, `site_generator == 'mkdocs'`:
   ```yaml
   name: docs
   on:
     pull_request:
     push:
       branches: [main]
   permissions:
     contents: read
   jobs:
     docs:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-python@v5
           with:
             python-version-file: pyproject.toml
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: pip install -e . -r docs/requirements.txt ruff pydoclint pytest
         - name: Docstring lint
           run: ruff check --select D src/tidyconf && pydoclint src/tidyconf
         - name: Markdown lint
           run: npx markdownlint-cli2
         - name: Doc samples
           run: pytest --doctest-modules src/tidyconf --doctest-glob='*.md' README.md
         - name: Site build
           run: mkdocs build --strict
         - name: Links (offline)
           uses: lycheeverse/lychee-action@v2
           with:
             args: --offline --include-fragments --no-progress './**/*.md' site
             fail: true
   ```
   Check the current major version of each action on its GitHub page and use that tag; pin to a commit SHA if the repository's policy requires it. `python-version-file` reads `requires-python`; confirm support in the `setup-python` README.
2. Put the online link check in a separate workflow with `on: schedule:` (cron chosen by the user) so external outages never block pull requests.
3. Do NOT add a `paths:` filter to `pull_request` if the docs job is a required status check; a skipped required check leaves the PR waiting.
4. Do NOT add `continue-on-error: true` to any docs step.
5. Lint the YAML: `actionlint .github/workflows/docs.yml` (install from the actionlint releases page or `go install github.com/rhysd/actionlint/cmd/actionlint@latest`).

### Output
`docs_workflow_path`.

### Quality Gate
- `actionlint .github/workflows/docs.yml; echo $?` prints `0` last.
- `grep -c 'continue-on-error' .github/workflows/docs.yml` prints `0`.

---

## Phase 3: Prove the Gate Is Live

### Entry Criteria
- Workflow linted; the user has approved pushing a branch.

### Actions
1. Push the workflow on a branch, open a PR (`gh pr create --draft --fill`), and watch: `gh run watch` (or `gh run list --workflow docs.yml --limit 1` then `gh run view <id>`). Record the passing run URL.
2. Mutation check: on a second throwaway branch from the first, change one internal link in `docs/` to a missing file, push, and confirm the Links step fails: `gh run view <id> --log-failed | head -40`.
3. Repeat the mutation for one sample (change an expected output) and confirm the Samples step fails.
4. Close the mutation PR and delete its branch with the user's approval (`gh pr close <n> --delete-branch`). Never merge it.
5. A gate that stays green on a mutation is not running; find why (wrong path, wrong glob, step skipped) before reporting success.

### Output
`docs_ci_run`.

### Quality Gate
- `docs_ci_run` has a passing run URL and, for each mutated check, a failing run URL whose failed step is that check.

---

## Worked Example

Illustrative only. Phase 2:
```
$ actionlint .github/workflows/docs.yml
.github/workflows/docs.yml:21:9: unexpected key "with" for "run" step [syntax-check]
```
The `with:` block was under a `run:` step; moved under the `uses: actions/setup-python` step. Rerun prints nothing, exit 0.

Phase 3 mutation:
```
$ gh run view 9182736455 --log-failed | head -5
docs  Links (offline)  [ERROR] file:///home/runner/work/tidyconf/tidyconf/docs/how-to/ci-validation.md | Cannot find file
docs  Links (offline)  🔍 44 Total ✅ 43 OK 🚫 1 Error
```
The Links step fails as intended; the sample mutation fails the Doc samples step with `1 failed`.

---

## Exit Criteria

DONE when one docs workflow runs every applicable check on pull requests, passes actionlint, has a passing run, and each mutated check produced a failing run at its own step.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repository is on GitLab or another CI | **Adjust**: use the same commands in that system's pipeline file; keep Phase 3's mutation proof. |
| Phase 2 | A step passes locally but fails in CI only | **Adjust**: compare tool versions (`<tool> --version` in both); pin versions in the requirements or lock file. |
| Phase 3 | User does not approve pushing branches | **Return**: hand back the linted workflow with Phase 3 marked not run; do not claim the gate is live. |
| Phase 3 | Mutation run stays green | **Stop**: the check is not executing; fix the workflow before anything else. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
