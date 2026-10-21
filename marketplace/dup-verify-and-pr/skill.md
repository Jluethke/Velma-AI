# Verify Upgrade Against Baseline And Write The PR

**One-line description:** Proves the finished upgrade branch against the baseline with commands (same install mode, same or more tests collected, no new failures, no weakened tests, fewer or equal deprecation warnings, rescanned vulnerabilities, rescanned outdated list) and writes a PR description that lists every commit with its changelog link and rollback command.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `stack`, `install_command`, `build_command`, `test_command`, `branch`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`.
- `rollback_plan` (object, required): From `dup-rollback-plan`.
- `applied_bumps` (object[], required): From `dup-apply-one-bump`. Codemod and framework commits are read from `git log` and `<work_dir>/codemods.json`, `<work_dir>/framework-*.json`, `<work_dir>/node-lts.json`.

---

## Outputs

- `verification_report` (object): one entry per check with command, expected, actual, and PASS or FAIL; overall verdict. Also written to `<work_dir>/verification.json`.
- `pr_description` (string): Markdown PR body. Also written to `<work_dir>/pr.md`.

---

## Phase 1: Clean-Room Reinstall And Test

### Entry Criteria
- All flows that change code have finished; `git status --porcelain` is empty.

### Actions
1. Remove installed artifacts and reinstall from the lock exactly as CI does: node `rm -rf node_modules && npm ci`; python `rm -rf .venv` then the frozen command (`uv sync --locked`, `poetry sync`, `pip-sync`); go `go mod download && go mod verify`; rust `cargo build --locked --all-targets`; jvm `./mvnw -B -U verify -DskipTests` or `./gradlew --refresh-dependencies assemble`.
2. Run `build_command`, then `test_command` twice, saving logs like the baseline did.
3. Count collected tests with the same command the baseline used.

### Output
Fresh install, build and two test logs.

### Quality Gate
- Install exit 0 without modifying the lockfile (`git status --porcelain` still empty).
- Build exit 0.

---

## Phase 2: Compare To The Baseline

### Entry Criteria
- Fresh logs exist.

### Actions
1. Evaluate each check and record PASS or FAIL:

| Check | Command or source | PASS when |
|---|---|---|
| Test failures | both runs vs `baseline_report` | every failing id is in `pre_existing_failures` or `flaky_tests` |
| Tests collected | same count command as baseline | count is greater than or equal to `tests_collected` |
| No weakened tests | `git diff <baseline_sha>..HEAD --stat -- '*test*' '*spec*' '*Test.java' '*_test.go'` and `git diff <baseline_sha>..HEAD -- <those files> \| grep -E '^-\s*(assert\|expect\|it\(\|test\(\|def test_\|func Test)'` | no removed assertion or test lines, or each one is approved by the user and listed |
| No new skips | `git diff <baseline_sha>..HEAD \| grep -E '^\+.*(@pytest.mark.skip\|\.skip\(\|xit\(\|t\.Skip\(\|#\[ignore\]\|@Disabled)'` | prints nothing |
| Deprecations | rerun the baseline deprecation command and count | count less than or equal to `deprecation_warning_count` |
| Vulnerabilities | rerun the stack's scan (`pip-audit`, `npm audit --omit=dev`, `govulncheck ./...`, `cargo audit`) | no priority-1 finding remains except those recorded as accepted |
| Outdated | rerun the stack's outdated command | every item the plan marked applied is no longer listed at its old version |
| One commit per item | `git log --oneline <baseline_sha>..HEAD` | each `applied_bumps` entry, codemod step and framework step maps to its own commit |

2. Overall verdict: PASS only if every row passes. Never report PASS by reasoning; each row cites its log file.

### Output
`verification_report`.

### Quality Gate
- `<work_dir>/verification.json` lists all eight checks with an `actual` value copied from command output.

---

## Phase 3: Write The PR Description

### Entry Criteria
- Verification report exists (PASS or FAIL; a FAIL is reported, not hidden).

### Actions
1. Build `<work_dir>/pr.md` with these sections:
   - Summary: goal, stack, count of packages changed, verdict.
   - Changes table: package, from, to, type (patch/minor/major/security), commit sha, changelog or release URL (from `breaking_changes.source_url` or the package's releases page).
   - Breaking changes handled: each `affects_repo=true` record and the commit that handled it.
   - Not done: every `blocked_bumps` entry and blocked framework step, with its classification and the decision needed from a person.
   - Verification: the table from Phase 2 with PASS/FAIL.
   - Rollback: `git revert <sha>` per item, the full rollback command from `rollback_plan`, and every one-way change.
2. Do not push and do not open the PR unless the user asks. If asked: `git push -u origin <branch>` then `gh pr create --title "<goal>: dependency upgrades" --body-file .dep-upgrade/pr.md`.
3. Clean up only what this run created and the user agrees to remove: `git tag -d dep-baseline-<date>` after merge, and the `.dep-upgrade/` directory.

### Output
`pr_description`.

### Quality Gate
- Every commit in `git log <baseline_sha>..HEAD` appears in the PR changes table or breaking-changes section.
- Every `blocked_bumps` entry appears under "Not done".

---

## Worked Example

Illustrative only. npm run with 4 applied bumps, React 19 framework flow, 1 blocked item.

- Phase 1: `rm -rf node_modules && npm ci` exit 0; `npm run build` exit 0; `npm test` twice: one failure in run 1 (`checkout.spec.ts > applies coupon`), known flaky.
- Phase 2: tests collected 214 vs 212 baseline (React flow added 2): PASS. Removed-assertion grep: none. Skips grep: none. Deprecations 2 vs 3: PASS. `npm audit --omit=dev`: 0: PASS. Outdated: zod still 3.23.8 because it is blocked, recorded. Verdict PASS.
- Phase 3: `pr.md` with 7 commits, "Not done: zod 3.25.76, unknown regression in schema.spec.ts error message, needs a decision", and rollback lines `git revert d1e44a0` etc.

---

## Exit Criteria

DONE when every verification check has a command-backed result, the verdict follows from them, and the PR description lists every commit, every blocked item and the rollback steps.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Clean install modifies the lockfile | **Stop**: a commit left the lock out of sync; find it with `git log -p -- <lockfile>` and fix before verifying. |
| Phase 2 | Any check FAILs | **Return**: report FAIL with the evidence; do not edit tests or filters to turn it PASS. |
| Phase 2 | Collected test count dropped | **Stop**: find which tests vanished (diff the two count outputs); a dropped test file is a blocker. |
| Phase 3 | User asks to push | **Adjust**: push the branch only; never force-push or merge without being told. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
