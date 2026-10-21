# CI Check Triage on a Pull Request

**One-line description:** Reads a pull request's check results with `gh pr checks` and `gh run view --log-failed`, classifies each failure as caused by the change, pre-existing on the base branch, flaky, or infrastructure, and reproduces caused failures locally with the exact CI command before fixing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pr_url` (string, required): Output of `tkt-pr-description`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.

---

## Outputs

- `ci_status` (object): Each required check with its final state, each failure with class (caused, pre-existing, flaky, infrastructure), the log excerpt that shows the cause, the local reproduction command and result, and the fix commit if any.

---

## Phase 1: Read the Checks

### Entry Criteria
- The PR exists and CI has started.

### Actions
1. Watch until checks finish: `gh pr checks <number> --watch`. It exits non-zero if any check fails. List only required checks with `gh pr checks <number> --required` (confirm the flag with `gh pr checks --help`).
2. For each failing GitHub Actions check, get the run id from the check's link (`.../actions/runs/<run-id>/job/<job-id>`) or `gh run list --branch <branch_name> --limit 5`, then print only failing step logs: `gh run view <run-id> --log-failed`.
3. In the log, find the first error, not the last line. Search the log text for markers: `FAILED`, `Error:`, `error[`, `--- FAIL`, `✖`, `##[error]`, `Process completed with exit code`. The first error is usually the cause; later ones are fallout.
4. For non-GitHub CI (GitLab), use `glab ci view` or `glab ci trace <job-id>`; check `glab ci --help` for your version.

### Output
Failure list with first-error excerpts.

### Quality Gate
- Every failing required check has a log excerpt containing its first error line.

---

## Phase 2: Classify

### Entry Criteria
- Failure list exists.

### Actions
1. Classify each failure with this table (first match wins):

| Evidence | Class |
|---|---|
| Runner lost, `No space left on device`, network timeout fetching dependencies, registry 5xx, cancelled by a newer push | infrastructure |
| Same test fails on the base branch's latest CI run (`gh run list --branch <base> --limit 5` then view) or is in the baseline report's pre-existing list | pre-existing |
| Test passes on rerun with no code change, or the test is listed as flaky in the repo (quarantine list, `flaky` marker) | flaky |
| Failure is in a file or test touched by the PR, or a test that exercises changed code | caused |
| None of the above | caused (default; prove otherwise before reclassifying) |

2. To test flakiness, rerun only failed jobs once: `gh run rerun <run-id> --failed`. One rerun only; a second pass/fail flip is still flaky evidence, not a fix.
3. Do not classify as flaky to avoid work. Flaky needs the rerun result or a repo quarantine entry as evidence.

### Output
Classified failures.

### Quality Gate
- Every failure has a class and the evidence row from the table that decided it.

---

## Phase 3: Reproduce and Fix Caused Failures

### Entry Criteria
- At least one `caused` failure, else skip to Action 5.

### Actions
1. Copy the exact command from the failing CI step (the `run:` line) and its environment (`env:` keys, matrix values such as Python or Node version, OS). Run it locally on the PR branch.
2. If it does not reproduce, compare environments: tool versions in the log header (`Run actions/setup-python` prints the version), matrix entry, OS, timezone (`TZ`), locale, and whether CI used a clean install. Reproduce with the same versions before fixing.
3. Fix through `tkt-small-edit-loop` (one file, run the reproducing command, commit). Use a `fix:` or matching type commit, or amend per the repo's merge method.
4. Push: `git push` (or `git push --force-with-lease` if the branch history was rewritten). Rerun Phase 1.
5. For pre-existing failures, comment on the PR with the base-branch run link that shows the same failure. For infrastructure failures, rerun the job once. For flaky failures, comment with the rerun evidence and link or open a ticket for the flaky test; do not fix unrelated flaky tests in this PR unless the team asks.

### Output
`ci_status`.

### Quality Gate
- Every `caused` failure has a local reproduction command with output before the fix and after the fix.
- Final `gh pr checks <number>` shows every required check passing, or each remaining failure is pre-existing or flaky with linked evidence.

---

## Worked Example

Illustrative only.

```
$ gh pr checks 1907
lint        pass   41s   https://github.com/acme/billing/actions/runs/9911/job/1
test (3.12) fail   2m3s  https://github.com/acme/billing/actions/runs/9911/job/2
test (3.11) pass   1m58s https://github.com/acme/billing/actions/runs/9911/job/3
$ gh run view 9911 --log-failed | rg -n 'FAILED|Error' | head -3
212: FAILED tests/api/test_export.py::test_dates_are_utc - AssertionError: '2026-10-19' != '2026-10-20'
```

Classification: test touched by the PR, passes on 3.11, fails on 3.12 job. The log header shows `TZ: America/Chicago` set in the matrix job env. Reproduce: `TZ=America/Chicago uv run pytest tests/api/test_export.py::test_dates_are_utc` fails locally. Cause: the code used `date.today()` (local time). Fixed to `datetime.now(timezone.utc).date()`; rerun passes; pushed; `gh pr checks 1907` all pass.

---

## Exit Criteria

DONE when every required check passes, or each remaining failure is classified pre-existing, flaky or infrastructure with linked evidence, and every caused failure was reproduced locally before and after its fix.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Checks never start | **Adjust**: check whether workflows require approval for this contributor or the branch filter excludes it (`on: pull_request: branches:`); ask a maintainer. |
| Phase 2 | Base branch is red too | **Return**: report pre-existing failures with links; the merge decision belongs to the maintainers. |
| Phase 3 | Cannot reproduce locally after matching versions | **Adjust**: add debug output in a temporary commit, push, read the log, then remove the commit. |
| Phase 3 | Fix would require disabling the check | **Stop**: never edit CI config to skip a failing check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
