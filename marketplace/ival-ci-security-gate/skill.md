# CI Gate for Input Validation Regressions

**One-line description:** Adds one required CI job that runs the custom Semgrep rules plus registry rules, the stack's security linter (Bandit, gosec, or ESLint with the regexp plugin), and the negative security test suite on every pull request, uploads SARIF, fails on any finding or test failure, and proves the gate blocks a deliberately vulnerable commit before it is made required.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `semgrep_rules` (object, required): Output of `ival-semgrep-taint-rules`.
- `negative_tests` (object, required): Output of `ival-negative-test-suite`.
- `ci_platform` (string, optional): `github` (default) or `gitlab`.

---

## Outputs

- `ci_gate` (object): `workflow_file`, `job_name`, `commands` (list run by the job), `proof_run` (URL or log of the failing run on the vulnerable commit), `green_run` (URL or log of the passing run).

---

## Phase 1: Assemble the Job Commands Locally

### Entry Criteria
- `semgrep_rules.baseline_findings` is 0 and `negative_tests.test_run` shows 0 failed.

### Actions
1. Build the command list for the stack and run each locally from `repo_path`. Every command must exit 0 on the current code:

| Step | python | node | go |
|---|---|---|---|
| custom + registry rules | `semgrep scan --config .semgrep/ --config p/owasp-top-ten --error --metrics=off --sarif -o semgrep.sarif` | same | same |
| stack linter | `bandit -r <src> -ll -f sarif -o bandit.sarif` (needs `bandit[sarif]`; `-ll` = medium severity and above) | `npx eslint . --max-warnings=0` (with `eslint-plugin-regexp` enabled) | `gosec -fmt=sarif -out=gosec.sarif ./...` |
| negative tests | `python -m pytest tests/security -q` | `npx vitest run test/security` (or `npx jest test/security`) | `go test ./... -run Security` |

2. Record each command and its local exit code. If any exits non-zero, fix the cause through the relevant class flow; do not add the command with `|| true` or `continue-on-error`.

### Output
Verified command list.

### Quality Gate
- Every command in the list has a recorded local exit code of 0.

---

## Phase 2: Write the CI Job

### Entry Criteria
- Command list verified.

### Actions
1. GitHub Actions: create `.github/workflows/input-validation.yml`:

```yaml
name: input-validation
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
  security-events: write
jobs:
  ival:
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep
    steps:
      - uses: actions/checkout@v4
      - name: Semgrep
        run: semgrep scan --config .semgrep/ --config p/owasp-top-ten --error --metrics=off --sarif -o semgrep.sarif
      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep.sarif
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # setup step for the stack: actions/setup-python, actions/setup-node or actions/setup-go, then install deps
      - name: Stack linter
        run: <stack linter command from Phase 1>
      - name: Negative security tests
        run: <negative test command from Phase 1>
```
   Check the current major versions of the referenced actions on their GitHub pages before committing.
2. GitLab: add a `ival` job in `.gitlab-ci.yml` with `image: semgrep/semgrep` running the same Semgrep command, and a second job for linter plus tests; publish SARIF or the GitLab SAST report format per GitLab docs.
3. Service dependencies the negative tests need (database, local listener) go in the job's `services:` block, matching what the tests used locally.
4. Do NOT add `continue-on-error: true`, `allow_failure: true`, `|| true`, or path filters that skip the job when only some directories change.

### Output
Workflow file.

### Quality Gate
- `rg -n "continue-on-error:\s*true|allow_failure:\s*true|\|\|\s*true" .github .gitlab-ci.yml` prints nothing for this job.
- The workflow has no `paths:` or `paths-ignore:` filter.

---

## Phase 3: Prove the Gate Blocks, Then Require It

### Entry Criteria
- Workflow committed on a branch.

### Actions
1. Open a pull request from the branch; confirm both jobs pass. Record the run URL as `green_run`.
2. Push a throwaway commit to a second branch that reintroduces one known bug (for example `cur.execute(f"SELECT * FROM orders WHERE status = '{status}'")`). Open a draft pull request; confirm the Semgrep job fails with the expected rule ID and the negative test job fails. Record the URL as `proof_run`. Close the draft pull request and delete the branch.
3. Make the jobs required: GitHub branch protection or ruleset "Require status checks to pass" with `ival` and `tests` selected (repository settings, needs admin). Do not change branch protection yourself without the owner's approval; give the owner the exact check names.

### Output
`ci_gate`.

### Quality Gate
- `green_run` shows both jobs succeeded.
- `proof_run` shows a failure naming the expected rule ID and a failing negative test.

---

## Worked Example

Illustrative. `stack` = `go`, GitHub.

Phase 1 local:
```
semgrep scan --config .semgrep/ --config p/owasp-top-ten --error --metrics=off   exit=0
gosec -fmt=sarif -out=gosec.sarif ./...                                          exit=0
go test ./... -run Security                                                      exit=0
```
Phase 3 proof run on branch `ival-proof` with `fmt.Sprintf` restored in `internal/store/orders.go`:
```
ival   ✗  ival-go-sql-sprintf  internal/store/orders.go:40
tests  ✗  --- FAIL: TestListOrdersNotInjectable/'_OR_'1'='1
```
Owner adds `ival` and `tests` as required checks.

---

## Exit Criteria

DONE when one CI workflow runs custom and registry Semgrep rules, the stack linter and the negative security tests on every pull request without failure suppression, a recorded run shows it failing on a reintroduced bug, and the owner has the check names to make it required.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Registry rules produce findings on unrelated legacy code | **Adjust**: use `semgrep ci` with a baseline (`--baseline-commit <sha>`) so only new findings fail, and record the legacy count as a separate task. Do not drop the registry config. |
| Phase 2 | Container image lacks the stack toolchain | **Adjust**: keep Semgrep in its own job (as in the template) and run linter and tests in a job with the setup action. |
| Phase 3 | Proof run passes | **Stop**: the job is not running the rules or tests you think; read its log. |
| Phase 3 | No admin rights to require checks | **Return**: hand the owner the check names and the proof run URL. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
