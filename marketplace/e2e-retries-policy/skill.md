# E2E Retries Policy

**One-line description:** Sets the E2E retry policy so retries exist only in CI, never locally, are configured with the runner's own setting (`retries` in Playwright, `--reruns` from pytest-rerunfailures, `retries.runMode` in Cypress), and every test that passes only on retry is reported as flaky instead of silently counted as passed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `stack` (string, required): `playwright-node`, `playwright-python` or `cypress`.

---

## Outputs

- `retry_policy` (object): `{ci_retries, local_retries: 0, setting_location, flaky_reporting, fail_on_flaky: bool, rationale}`.

---

## Phase 1: Fix the Numbers

### Entry Criteria
- The runner setup flow for `stack` is done.

### Actions
1. Local retries are always 0. A retry on a developer machine hides the failure the developer needs to see.
2. CI retries come from this table:

| Situation | `ci_retries` |
|---|---|
| Playwright, no user preference | 2, the value in the config template that `npm init playwright` generates |
| Cypress or pytest, no user preference | Ask the user; the runner default is 0 and there is no documented recommended value. Record the answer |
| User or team policy gives a number | That number, cited |
| User wants every flake to block | 0 |

3. Never set retries on a single test to get it green. Per-test retries (`test.describe.configure({ retries })`, `@pytest.mark.flaky(reruns=...)`, `it('x', { retries: ... })`) are allowed only for a test listed in the flake triage report with an issue link.

### Output
Chosen numbers with rationale.

### Quality Gate
- `rationale` names the table row.
- `local_retries` is 0.

---

## Phase 2: Configure the Runner

### Entry Criteria
- Numbers fixed.

### Actions
1. Apply one row:

| stack | Setting |
|---|---|
| playwright-node | `retries: process.env.CI ? <ci_retries> : 0` in `playwright.config.ts` |
| playwright-python | Install `pytest-rerunfailures`; do not put `--reruns` in `addopts`; add it only to the CI command: `pytest e2e --reruns <ci_retries>` |
| cypress | `retries: { runMode: <ci_retries>, openMode: 0 }` in `cypress.config.ts` (`runMode` applies to `cypress run`, `openMode` to `cypress open`) |

2. For Playwright, set `forbidOnly: !!process.env.CI` if not present, so a stray `test.only` fails CI instead of silently skipping the suite.
3. Confirm CI sets `CI=true` (GitHub Actions and GitLab CI set it automatically).

### Output
Runner configured.

### Quality Gate
- Locally, a test forced to fail once shows no retry attempt in the output.
- With `CI=true` set in the shell, the same forced failure shows retry attempts equal to `ci_retries`.

---

## Phase 3: Make Flakes Visible

### Entry Criteria
- Runner configured.

### Actions
1. Report flaky passes:

| stack | How flaky shows up |
|---|---|
| playwright-node | Test status `flaky` in the `list` and HTML reporters; summary line `N flaky`. Add `--fail-on-flaky-tests` to the CI command if the user wants flakes to block (check `npx playwright test --help` that the installed version has it) |
| playwright-python | pytest-rerunfailures prints `R` for each rerun and a `rerun` count in the summary (`2 passed, 1 rerun`) |
| cypress | Run summary shows the attempt count per test; failed attempts still produce screenshots |

2. Add a CI step that extracts flaky tests from the JUnit report into the job summary, or at least greps the console summary for `flaky` / `rerun`.
3. Set `fail_on_flaky` from the user's answer; do not decide it.

### Output
`retry_policy`.

### Quality Gate
- A deliberately flaky test (fails on first attempt only, using `test.info().retry === 0` in Playwright or an env flag) shows as `flaky` or `rerun` in the CI-mode output; remove the test afterward.

---

## Worked Example

Illustrative only. `stack=playwright-node`, no user preference.
```ts
retries: process.env.CI ? 2 : 0,
forbidOnly: !!process.env.CI,
```
Probe test failing only when `test.info().retry === 0`:
```
$ npx playwright test e2e/probe.spec.ts
  1 failed
$ CI=true npx playwright test e2e/probe.spec.ts --reporter=list
  ✘  1 probe.spec.ts:3:5 › probe (120ms)
  ✓  1 probe.spec.ts:3:5 › probe (retry #1) (98ms)
  1 flaky
```
Probe deleted.

---

## Exit Criteria

DONE when retries are 0 locally, CI retries come from a cited row, flaky passes appear in reports, and the fail-on-flaky choice is the user's.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User asks for high retries to make CI green | **Return**: show the flaky list from the reports; recommend the flake triage flow; record the user's decision. |
| Phase 2 | `--reruns` unknown option | **Adjust**: install `pytest-rerunfailures` in the CI environment. |
| Phase 3 | Flaky tests never appear although CI is unstable | **Adjust**: the reporter in CI hides retries; switch to `list` plus JUnit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
