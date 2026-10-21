# Lint GitHub Actions Workflows With actionlint and zizmor

**One-line description:** Adds a workflow-lint job that runs actionlint (syntax, expression types, action inputs, embedded shellcheck) and zizmor (security audits) on every change to `.github/`, fixes findings one rule at a time, and makes the lint job fail the PR.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gha_workflow_path` (string, required): The main CI workflow file; the lint covers every file in `.github/workflows/`.

---

## Outputs

- `lint_report` (object): `{actionlint_before, actionlint_after, zizmor_before, zizmor_after, fixed_rules[], deferred_findings[], lint_job_id}`.

---

## Phase 1: Run Both Linters Locally

### Entry Criteria
- `actionlint -version` and `zizmor --version` both print a version. Install actionlint from its GitHub releases (or `go install github.com/rhysd/actionlint/cmd/actionlint@<version>`) and zizmor with `pipx install zizmor`.

### Actions
1. Run `actionlint -color=never > /tmp/actionlint.txt; echo "exit $?"` from the repo root (it finds `.github/workflows/*.yml` itself). Each line reads `path:line:col: message [rule]`. If `shellcheck` is on PATH, actionlint also checks `run:` scripts and reports them under rule `shellcheck`.
2. Run `zizmor --format plain .github/workflows/ > /tmp/zizmor.txt; echo "exit $?"`. Confirm the `--format` values with `zizmor --help`; if `plain` is not offered, use the default output. Each finding names an audit (for example `unpinned-uses`, `template-injection`, `excessive-permissions`, `artipacked`, `cache-poisoning`).
3. Count findings per rule: `grep -oE '\[[a-z-]+\]$' /tmp/actionlint.txt | sort | uniq -c` and, for zizmor, `grep -oE '^(error|warning|help|note)\[[a-z-]+\]' /tmp/zizmor.txt | sort | uniq -c`.
4. Save both raw files as `actionlint_before` and `zizmor_before`.

### Output
Baseline findings grouped by rule.

### Quality Gate
- Both raw output files exist and the exit codes are recorded.
- The per-rule counts are recorded.

---

## Phase 2: Fix One Rule at a Time

### Entry Criteria
- Baseline recorded.

### Actions
1. Fix order: actionlint `syntax-check` and `expression` first (the workflow may not even run), then `action` (unknown inputs), then `shellcheck`, then zizmor audits.
2. Common fixes, exact:

| Finding | Fix |
|---|---|
| actionlint `[expression]` property not defined | Correct the context path (for example `github.event.pull_request.head.sha`); read the GitHub contexts reference, do not guess |
| actionlint `[action]` input not defined | Use the input name from the action's `action.yml` |
| shellcheck SC2086 (unquoted variable) | Quote it: `"$VAR"` |
| shellcheck SC2046 (unquoted command substitution) | Quote it or use an array |
| zizmor `artipacked` | Add `persist-credentials: false` to `actions/checkout` |
| zizmor `unpinned-uses` | Run `ci0-gha-pin-actions-sha` |
| zizmor `template-injection` / `excessive-permissions` | Run `ci0-gha-secrets-permissions` |

3. After each rule's fixes, rerun the matching linter and confirm that rule's count dropped to 0 with no new rules appearing.
4. Do not disable a check to pass. Suppressions (actionlint `-ignore '<regex>'`, shellcheck `# shellcheck disable=SCxxxx`, zizmor `# zizmor: ignore[<audit>]`) are allowed only for a finding the user reviewed, with a comment giving the reason. Each one goes in `deferred_findings[]`.

### Output
Fixed workflows.

### Quality Gate
- `actionlint` exits 0 and prints nothing.
- zizmor reports no finding that is not in `deferred_findings[]` with a reason.

---

## Phase 3: Add the Lint Job

### Entry Criteria
- Both linters clean locally.

### Actions
1. Add a job to `gha_workflow_path` (or a separate `workflow-lint.yml`, with no `paths:` filter if it will be a required check):
```yaml
  workflow-lint:
    runs-on: ubuntu-latest
    timeout-minutes: <user value>
    steps:
      - uses: actions/checkout@<sha> # <version>
        with:
          persist-credentials: false
      - name: actionlint
        run: |
          bash <(curl -sSfL https://raw.githubusercontent.com/rhysd/actionlint/<release tag>/scripts/download-actionlint.bash) <version>
          ./actionlint -color
      - name: zizmor
        run: pipx run zizmor==<version> .github/workflows/
```
   Pin versions; never `latest`. The actionlint download script and its arguments are documented in the actionlint README; read it for the current form.
2. Run `actionlint` on the edited file locally.
3. Push to a PR branch, then `gh run watch --exit-status`.
4. Record `lint_job_id` (`workflow-lint`) so it can be added as a required check.

### Output
`lint_report`.

### Quality Gate
- The CI run shows the `workflow-lint` job with conclusion `success`.
- The job references pinned versions only: `grep -n 'latest' <file>` prints no line inside the lint job.

---

## Worked Example

Illustrative only.

Phase 1:
```
.github/workflows/ci.yml:31:9: shellcheck reported issue in this script: SC2086:info:1:8: Double quote to prevent globbing and word splitting [shellcheck]
.github/workflows/release.yml:12:15: property "ref_nam" is not defined in object type ... [expression]
```
zizmor: `warning[artipacked]: credential persistence through GitHub Actions artifacts` at `ci.yml:14`.
Phase 2: fix `ref_nam` to `ref_name`, quote `$REPORT_DIR`, add `persist-credentials: false`. Reruns print nothing.
Phase 3: run 8842 shows `workflow-lint success`.

---

## Exit Criteria

DONE when actionlint is clean, every zizmor finding is fixed or deferred with a reason, and a `workflow-lint` job runs green in CI.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | shellcheck not installed | **Adjust**: install it (`apt-get install shellcheck`) so actionlint checks scripts; record if impossible. |
| Phase 2 | Fixing one rule creates another | **Retry**: revert that edit, fix more narrowly, rerun. |
| Phase 2 | Finding is a false positive | **Return**: show it to the user; suppress only with their approval and a reason comment. |
| Phase 3 | Download step fails in CI (network or URL change) | **Adjust**: read the actionlint README for the current install method; or use its official Docker image pinned by digest. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
