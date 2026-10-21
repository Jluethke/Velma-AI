# Python PR Security Scan with Bandit, Semgrep and pip-audit

**One-line description:** Runs Bandit and Semgrep's Python and OWASP rulesets on the changed Python files with a baseline at the merge base so only new findings appear, audits added or bumped dependencies with pip-audit, and checks every new `# nosec` and `nosemgrep` suppression.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `base_branch` (string, required): PR target branch.
- `changed_files` (object[], required): Rename-aware file list.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `py_sast_findings` (object[]): New Bandit, Semgrep and dependency findings, written to `<findings_dir>/prr-py-bandit-semgrep.json`.

---

## Phase 1: Bandit on Changed Files

### Entry Criteria
- At least one changed `.py` file. `bandit --version` succeeds.

### Actions
1. List changed production Python files: `git diff --name-only --diff-filter=ACMR origin/<base_branch>...HEAD -- '*.py'`, excluding test files (Bandit's `B101 assert_used` is noise in tests).
2. If the project configures Bandit (`[tool.bandit]` in `pyproject.toml` read with `-c pyproject.toml`, or `.bandit`), use that config.
3. Run with JSON output: `bandit -f json -o ../bandit.json <files>` (add `-c pyproject.toml` if configured there).
4. Each result has `test_id` (for example `B602` subprocess with `shell=True`, `B608` SQL built from strings, `B301` pickle, `B506` `yaml.load`, `B105` hardcoded password string, `B324` weak hash, `B501` request with `verify=False`), `issue_severity`, `issue_confidence`, `filename`, `line_number`.
5. Keep results whose line is a changed line (from `git diff -U0` hunk headers).

### Output
New Bandit results.

### Quality Gate
- `../bandit.json` parses with `python -m json.tool`.
- Each kept result is on a changed line.

---

## Phase 2: Semgrep with a Baseline and Dependency Audit

### Entry Criteria
- Phase 1 complete. `semgrep --version` succeeds.

### Actions
1. Run Semgrep registry rulesets with a baseline at the merge base so only findings introduced by the PR are reported:
   `semgrep scan --config p/python --config p/owasp-top-ten --baseline-commit $(git merge-base origin/<base_branch> HEAD) --json --output ../semgrep.json`
   If the repository has its own `.semgrep.yml` or `.semgrep/` rules, add `--config .semgrep.yml`.
2. Each result has `check_id`, `path`, `start.line`, `extra.message`, `extra.severity` (`ERROR`, `WARNING`, `INFO`).
3. If a dependency manifest changed (`requirements*.txt`, `pyproject.toml`, `poetry.lock`, `uv.lock`, `Pipfile.lock`), audit it:
   `pip-audit -r requirements.txt --format json --output ../pip-audit.json` for requirements files, or `pip-audit --format json --output ../pip-audit.json` inside the installed project environment.
   Run the same on the base worktree and keep only vulnerabilities whose package was added or whose version changed in the PR.
4. Do not upgrade or pin packages yourself. Report the fixed version from pip-audit's `fix_versions` field.

### Output
New Semgrep results and new dependency vulnerabilities.

### Quality Gate
- `../semgrep.json` parses and its `errors` array is empty, or each error is recorded.
- If a manifest changed, the pip-audit head and base results are both recorded.

---

## Phase 3: Suppressions and Findings

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. Find added suppressions: `git diff -U0 origin/<base_branch>...HEAD -- '*.py' | grep -nE '^\+.*(# nosec|nosemgrep)'`.
2. A `# nosec` must name the test ID (`# nosec B602`) and a reason; a bare `# nosec` silences every Bandit check on the line. Label bare suppressions `suggestion`; a suppression on a line where you can trace untrusted input to the sink is `blocking`.
3. Label results:

| Result | Label |
|---|---|
| Bandit HIGH severity, or Semgrep ERROR, on a line reachable from request data | blocking |
| Bandit MEDIUM, or Semgrep WARNING | question: ask the author to confirm the input is trusted |
| Bandit LOW, or Semgrep INFO | nit |
| pip-audit vulnerability in an added or bumped package | blocking if a `fix_versions` entry exists, else question |

4. Write `<findings_dir>/prr-py-bandit-semgrep.json` (fields `flow`, `category`="sast", `file`, `line`, `evidence` = test or check ID plus message, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`py_sast_findings`.

### Quality Gate
- Every finding has a tool rule ID in `evidence`.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Changed: `reports/export.py`, `requirements.txt`.

- Phase 1: `bandit -f json -o ../bandit.json reports/export.py` reports `B602` HIGH at line 31: `subprocess.call(cmd, shell=True)` where `cmd` contains `request.args["fmt"]`.
- Phase 2: `semgrep scan --config p/python --config p/owasp-top-ten --baseline-commit 7c1d2e3 --json --output ../semgrep.json` reports `python.lang.security.audit.subprocess-shell-true` at the same line. `pip-audit -r requirements.txt` on head shows `jinja2 3.1.2` with `fix_versions: ["3.1.3"]`; base had 3.1.4, so the PR downgraded it.
- Phase 3: findings: B602 blocking (fix: `subprocess.run(["exporter", "--format", fmt], check=True)` with `fmt` checked against an allowlist), jinja2 downgrade blocking.

---

## Exit Criteria

DONE when Bandit, Semgrep with a baseline, and pip-audit (if manifests changed) ran, only PR-introduced results are reported with rule IDs, and every new suppression is audited.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Bandit not installed | **Adjust**: `pip install bandit` into a separate tool environment (`pipx install bandit`), not the project environment. |
| Phase 2 | Semgrep registry unreachable (offline) | **Adjust**: run only the repository's local rules and Bandit; record that registry rules did not run. |
| Phase 2 | `--baseline-commit` fails because of a dirty tree | **Retry**: run in a clean worktree at the PR head. |
| Phase 3 | Many results on unchanged lines | **Adjust**: ignore them in this review; they are pre-existing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
