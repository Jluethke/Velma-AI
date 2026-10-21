# E2E Flake Triage: Reproduce, Classify, Fix or Quarantine

**One-line description:** Takes a test reported as flaky, reproduces it with repeated runs at the runner's own repeat option (`--repeat-each`, pytest-repeat `--count`, or a shell loop for Cypress) with retries off, compares single-worker and parallel runs to separate timing from isolation causes, classifies it from a cause table, fixes it, and quarantines with a tag and an issue only when no fix is ready.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `stack` (string, required): `playwright-node`, `playwright-python` or `cypress`.
- `retry_policy` (object, required): From `e2e-retries-policy`.
- `failure_diagnosis` (object, optional): From `e2e-pw-trace-read` when a trace was read.
- `flaky_tests` (object[], optional): Tests reported flaky: `{test_id, source (CI run URL or report), failure_messages[]}`. When absent, Phase 1 extracts them from the last CI reports.
- `repeat_count` (integer, optional): How many repeated runs the user accepts as a reproduction attempt. No standard value exists; ask the user if absent and record it.

---

## Outputs

- `flake_report` (object[]): Per test: `{test_id, reproduced: bool, fail_rate: "<fails>/<runs>", serial_vs_parallel, cause_class, evidence, fix_commit|null, quarantine: {tag, issue_url}|null, verification_output}`.

---

## Phase 1: Collect and Reproduce

### Entry Criteria
- `repeat_count` is set.

### Actions
1. If `flaky_tests` is absent, extract them: Playwright reports `flaky` status (`grep -c "flaky" ` in the list output, or JSON reporter `.suites[].specs[].tests[].status == "flaky"`); pytest-rerunfailures shows `R` and `rerun`; Cypress shows tests with more than one attempt.
2. Reproduce each test with retries off:

| stack | Command |
|---|---|
| playwright-node | `npx playwright test <file> -g "<title>" --repeat-each=<repeat_count> --retries=0` |
| playwright-python | `pip install pytest-repeat`, then `pytest "<file>::<test>" --count=<repeat_count> -p no:rerunfailures` |
| cypress | `for i in $(seq 1 <repeat_count>); do npx cypress run --spec <file> --config retries=0 \|\| echo FAIL $i; done` |

3. Run step 2 twice: once single-worker (`--workers=1` / without `-n` / Cypress is already serial) and once parallel (`--workers=<ci value>` / `-n auto`) with the rest of the suite, using `--repeat-each` on the whole file or suite. Record fail counts for both.
4. If it does not reproduce locally, reproduce inside the CI container image from `e2e-ci-container-run` with the same command.

### Output
Fail rates per test and mode.

### Quality Gate
- Each test has `fail_rate` recorded for single and parallel modes from actual command output.

---

## Phase 2: Classify

### Entry Criteria
- Fail rates recorded.

### Actions
1. Use `failure_diagnosis` if present; otherwise reproduce a failure with tracing on (`--trace on`, `--tracing on`, or Cypress screenshots/video) and read it.
2. First matching row:

| Signal | `cause_class` | Fix pattern |
|---|---|---|
| Fails only in parallel, passes single-worker | `data_collision` | Unique data per test (data seeding flow) |
| Fails only when run after a specific other test | `order_dependence` | Remove shared state; each test sets up its own |
| Assertion on a value read once (`textContent()`, `isVisible()`, `cy.then` reading text) | `non_retrying_assertion` | Web-first assertion: `expect(locator).toHaveText()` / `.should('have.text', ...)` |
| `waitForTimeout`, `time.sleep`, `cy.wait(<ms>)` in the test | `fixed_sleep` | Wait for a response alias or UI state |
| Trace shows request pending or slow 3rd party | `network_timing` | Wait on the response, or mock per backend plan |
| Fails near midnight, month end or in another timezone | `clock` | Fix time: `page.clock`, `cy.clock`, or set `timezoneId`/`locale` in config |
| Click registered no effect, hydration warning in console | `hydration_race` | Wait for app-ready signal |
| Only in CI container, crash or "browser closed" | `environment` | Container flags (`--ipc=host`), resources |
| Animation or `element is not stable` | `animation` | Wait for end state; `reducedMotion: 'reduce'` |

3. If no row matches, record the evidence and leave `cause_class` as `unknown`. Do not guess.

### Output
Classified list.

### Quality Gate
- Every test has a `cause_class` from the table or `unknown`, with evidence quoted.

---

## Phase 3: Fix, Verify or Quarantine

### Entry Criteria
- Classified.

### Actions
1. Fix one test per commit using the row's pattern. Do not raise timeouts, add retries, add `force: true`, or delete assertions.
2. Verify: rerun the Phase 1 command in the mode that failed. The fix is accepted only when it reports 0 failures across `repeat_count` runs.
3. If no fix is possible now, quarantine with a tag so it keeps running in a non-blocking job:
   - Playwright: `test('title', { tag: '@quarantine' }, async ...)`; blocking job `--grep-invert @quarantine`, separate job `--grep @quarantine` with `continue-on-error: true`.
   - pytest: register marker `quarantine` in config, `@pytest.mark.quarantine`, blocking job `-m "not quarantine"`.
   - Cypress: `@cypress/grep` plugin with `{ tags: '@quarantine' }` and `--env grepTags=-@quarantine` in the blocking job.
4. Every quarantine needs an issue: `gh issue create --title "Flaky E2E: <test_id>" --body "<fail_rate, cause_class, evidence>"`. Record the URL next to the tag in a comment.
5. Do not use `test.skip`, `test.fixme`, `@pytest.mark.skip` or `it.skip` as quarantine; skipped tests stop running and nobody sees when they are fixed.

### Output
`flake_report`.

### Quality Gate
- Every fixed test has `verification_output` with 0 failures over `repeat_count` runs.
- Every quarantined test has an `issue_url` and still runs in a non-blocking job (visible in the CI config with `grep -n quarantine .github/workflows/*.yml`).
- `git diff` of the fix contains no added `waitForTimeout`, `time.sleep`, `cy.wait(<number>)`, `force: true` or `retries`.

---

## Worked Example

Illustrative only. `stack=playwright-node`, `repeat_count=30` (user's choice).
```
$ npx playwright test e2e/cart.spec.ts -g "updates count" --repeat-each=30 --retries=0 --workers=1
  30 passed
$ npx playwright test e2e/ --repeat-each=30 --retries=0 --workers=4
  4 failed, 266 passed     (cart.spec.ts › updates count)
```
Parallel-only failure: `data_collision`. Evidence: the test used fixed email `cart@example.test` shared by `checkout.spec.ts`. Fixed with a per-test user from the data fixture.
```
$ npx playwright test e2e/ --repeat-each=30 --retries=0 --workers=4
  270 passed
```
`flake_report`: `fail_rate 4/30 -> 0/30`, `fix_commit a1b2c3d`, `quarantine: null`.

---

## Exit Criteria

DONE when every reported flaky test has a measured fail rate, a cause class with evidence, and either a verified fix with 0 failures over the agreed repeat count or a tagged quarantine with an issue that still runs non-blocking.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Does not reproduce locally or in the container | **Return**: report 0/N with the commands used; keep monitoring via the retry reports; do not mark it fixed. |
| Phase 1 | `unrecognized arguments: --count` | **Adjust**: install `pytest-repeat`. |
| Phase 2 | `cause_class` unknown | **Return**: quarantine with an issue containing the verbatim evidence. |
| Phase 3 | Fix passes once but fails in repeat | **Retry** classification with a new trace; the first cause was wrong or incomplete. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
