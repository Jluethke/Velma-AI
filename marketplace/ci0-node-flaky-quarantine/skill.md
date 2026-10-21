# Quarantine Flaky Jest, Vitest or Playwright Tests

**One-line description:** Quarantines confirmed flaky JavaScript and TypeScript tests using the runner's real selection mechanism (Playwright tags with `--grep-invert`, a Jest or Vitest quarantine file list with `testPathIgnorePatterns` or `--exclude`), runs them in a non-blocking CI job, and links each to an issue.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `flaky_tests` (object[], required): From `ci0-flaky-detect-junit`; only `confirmed: true` entries.
- `ci_platform` (string, required): `github` or `gitlab`.

---

## Outputs

- `quarantine_record` (object): `{marked_tests: [{test_id, issue_url}], mechanism, blocking_count_before, blocking_count_after, quarantine_job_name, diff}`.

---

## Phase 1: Choose the Mechanism

### Entry Criteria
- At least one confirmed entry; runner known from `package.json` scripts.

### Actions
1. Pick by runner. Use only these mechanisms:

| Runner | Granularity | Exclude from blocking job | Run only quarantined |
|---|---|---|---|
| Playwright (1.42 or later) | single test | `npx playwright test --grep-invert @quarantine` | `npx playwright test --grep @quarantine` |
| Jest | test file | `--testPathIgnorePatterns` with the quarantined paths, or a `quarantine.json` list read by `jest.config.js` | `npx jest $(jq -r '.[]' quarantine.json)` |
| Vitest | test file | `npx vitest run --exclude <path>` per file (or `test.exclude` in config built from `quarantine.json`) | `npx vitest run $(jq -r '.[]' quarantine.json)` |

2. Jest and Vitest have no built-in tag filter. If only one test in a big file is flaky, move it to a new file named `<name>.quarantine.test.ts` with its setup, rather than inventing a tag mechanism. Moving is one edit per test.
3. Confirm flags with `npx playwright test --help`, `npx jest --help`, `npx vitest --help`.
4. Record the blocking count before: Playwright `npx playwright test --list | tail -1`; Jest `npx jest --listTests | wc -l` (files); Vitest `npx vitest list | wc -l` (check that `vitest list` exists in your version with `--help`).

### Output
Mechanism and baseline count.

### Quality Gate
- The chosen flag appears in the tool's `--help` output.
- The before count is recorded with the command used.

---

## Phase 2: Mark Tests

### Entry Criteria
- Mechanism chosen.

### Actions
1. Create a tracking issue per test (`gh issue create` or `glab issue create`) with failure messages and rerun counts.
2. Playwright: add the tag in the details object: `test('exports CSV', { tag: '@quarantine' }, async ({ page }) => { ... })`, with `// Quarantined: <issue URL>` on the line above. (Older Playwright: append ` @quarantine` to the title.)
3. Jest or Vitest: add the file path to `quarantine.json` (an array of paths relative to the repo root) with the issue URL in a sibling `quarantine.md` table, or as a comment at the top of the test file.
4. One file per edit; after each, rerun the "run only quarantined" command and confirm the count grows by exactly one test or file.
5. Do not use `test.skip`, `it.skip`, `xit`, `test.fixme`, or delete tests. Do not raise `retries` globally in `playwright.config` to hide the flake; that is a separate policy decision.

### Output
Marked tests and quarantine list.

### Quality Gate
- The "run only quarantined" command selects exactly the confirmed tests or files.
- Every quarantined item has an issue URL.

---

## Phase 3: Split CI Jobs

### Entry Criteria
- Tests marked.

### Actions
1. Change the blocking test command to the exclude form from the table.
2. Add a quarantine job running the "only quarantined" form with a JUnit reporter, non-blocking: GitHub `continue-on-error: true` and not in the aggregate check's `needs`; GitLab `allow_failure: true`.
3. If `quarantine.json` is empty, the "only quarantined" command would run the whole suite for Jest. Guard it: `test "$(jq length quarantine.json)" -gt 0 && npx jest $(jq -r '.[]' quarantine.json) || echo "no quarantined tests"`.
4. Lint the CI file and push.
5. Compare counts: blocking after + quarantined == before.

### Output
`quarantine_record`.

### Quality Gate
- Count equation holds.
- The CI run shows the quarantine job executed and uploaded its report.

---

## Worked Example

Illustrative only. Playwright 1.47, one flaky test `checkout.spec.ts > applies coupon`.

Phase 1: `npx playwright test --help` lists `--grep-invert <grep>`. Before: `Total: 214 tests in 31 files`.
Phase 2: issue #97; `test('applies coupon', { tag: '@quarantine' }, ...)`. `npx playwright test --grep @quarantine --list` prints `Total: 1 test in 1 file`.
Phase 3: blocking `--grep-invert @quarantine --list` prints `Total: 213 tests`; 213 + 1 = 214. CI: `e2e success`, `e2e-quarantine failure (allowed)`.

---

## Exit Criteria

DONE when every confirmed flaky test is excluded from the blocking job by a real runner mechanism, runs in a non-blocking job, and links to an issue, with counts adding up.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Playwright older than tag support | **Adjust**: use the ` @quarantine` title suffix, which `--grep` matches. |
| Phase 2 | Moving a test to its own file breaks shared setup | **Adjust**: copy the needed `beforeEach` into the new file; rerun it alone. |
| Phase 3 | Quarantine job runs entire suite | **Stop**: the empty-list guard is missing; add it. |
| Phase 3 | Counts do not match | **Stop**: the exclude pattern matches more files than intended; narrow it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
