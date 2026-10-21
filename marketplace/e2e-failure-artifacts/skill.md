# E2E Failure Artifacts: Traces, Videos and Screenshots

**One-line description:** Configures the runner to keep a trace, video and screenshot for failing tests only (choosing `on-first-retry` or `retain-on-failure` from the retry policy), writes them to one known directory, and uploads that directory from CI even when the test step fails, so every red build has evidence to open.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `stack` (string, required): `playwright-node`, `playwright-python` or `cypress`.
- `retry_policy` (object, required): From `e2e-retries-policy`.

---

## Outputs

- `artifact_config` (object): `{trace_mode, video_mode, screenshot_mode, output_dir, ci_upload_step, retention, verified_paths[]}`.

---

## Phase 1: Choose Modes

### Entry Criteria
- `retry_policy.ci_retries` is set.

### Actions
1. Pick modes:

| stack | `ci_retries` > 0 | `ci_retries` == 0 |
|---|---|---|
| playwright-node | `trace: 'on-first-retry'`, `video: 'on-first-retry'`, `screenshot: 'only-on-failure'` | `trace: 'retain-on-failure'`, `video: 'retain-on-failure'`, `screenshot: 'only-on-failure'` |
| playwright-python | `--tracing=retain-on-failure --video=retain-on-failure --screenshot=only-on-failure` (pytest-playwright has no on-first-retry mode) | same |
| cypress | `video: true`, `screenshotOnRunFailure: true`, delete passing-spec videos in `after:spec` (Phase 2) | same |

2. Do not use `trace: 'on'` or `video: 'on'` for the whole suite in CI; every passing test then writes files, which slows the run and fills artifact storage.
3. A Playwright trace includes DOM snapshots, network log, console log and source; it is more useful than video for diagnosis. Video helps for animation and timing issues.

### Output
Mode choice.

### Quality Gate
- The chosen row matches `retry_policy.ci_retries` and `stack`.

---

## Phase 2: Configure Output Locations

### Entry Criteria
- Modes chosen.

### Actions
1. Apply:

| stack | Where |
|---|---|
| playwright-node | `use: { trace, video, screenshot }` in `playwright.config.ts`; artifacts go to `outputDir` (default `test-results/`); HTML report to `playwright-report/` |
| playwright-python | flags in `addopts`; artifacts under `--output` (default `test-results/`) |
| cypress | `video: true`, `videosFolder` (default `cypress/videos`), `screenshotsFolder` (default `cypress/screenshots`) |

2. Cypress: keep videos only for specs with failures. In `setupNodeEvents`:
```ts
import fs from 'node:fs';

on('after:spec', (spec, results) => {
  if (results && results.video) {
    const failed = results.tests.some((t) => t.attempts.some((a) => a.state === 'failed'));
    if (!failed) fs.unlinkSync(results.video);
  }
});
```
   This is the recipe from the Cypress video docs.
3. Do not commit these directories; confirm they are in `.gitignore`.

### Output
Configured runner.

### Quality Gate
- A forced failure produces the expected files: Playwright `ls test-results/*/trace.zip`, Python `ls test-results/*/trace.zip`, Cypress `ls cypress/screenshots/*/` and `ls cypress/videos/`.
- A passing run leaves no trace or video files (`find test-results cypress/videos \( -name "trace.zip" -o -name "*.webm" -o -name "*.mp4" \) 2>/dev/null | wc -l` is 0 after a clean passing run).

---

## Phase 3: Upload from CI on Failure

### Entry Criteria
- Local verification done.

### Actions
1. GitHub Actions step after the test step:
```yaml
- uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: e2e-artifacts-${{ github.run_attempt }}
    path: |
      test-results/
      playwright-report/
    retention-days: ${{ vars.E2E_ARTIFACT_RETENTION_DAYS }}
```
   For Cypress use `cypress/screenshots/` and `cypress/videos/`. `if: ${{ !cancelled() }}` runs the upload even when tests failed; without it the step is skipped exactly when needed.
2. GitLab CI: `artifacts: { when: always, paths: [test-results/, playwright-report/], expire_in: <user value> }`.
3. `retention` is a user input (storage cost and policy); if not given, leave the platform default and record that.
4. When sharding, give each shard's artifact a unique name (`-${{ matrix.shardIndex }}`); `upload-artifact@v4` refuses duplicate names in one run.

### Output
`artifact_config`.

### Quality Gate
- A CI run with a forced failure shows the artifact in the run's Artifacts list; downloading it yields a `trace.zip` (Playwright) or PNG/MP4 (Cypress).

---

## Worked Example

Illustrative only. `stack=playwright-node`, `ci_retries=2`.
```ts
use: { baseURL, trace: 'on-first-retry', video: 'on-first-retry', screenshot: 'only-on-failure' },
```
Forced failure with `CI=true`:
```
$ ls test-results/checkout-places-order-chromium-retry1/
trace.zip  video.webm  test-failed-1.png
```
Clean passing run: `find test-results \( -name "trace.zip" -o -name "*.webm" \) | wc -l` prints `0`. CI run 4812 shows artifact `e2e-artifacts-1` (3.1 MB).

---

## Exit Criteria

DONE when failing tests keep a trace (or video and screenshot for Cypress), passing tests keep nothing, and CI uploads the artifact directory even when tests fail.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | No trace after a failure with `on-first-retry` | **Adjust**: retries are 0 in that run; traces only record on retry. Use `retain-on-failure` or run with `CI=true`. |
| Phase 3 | Upload step skipped on failure | **Adjust**: add `if: ${{ !cancelled() }}` (or `when: always` in GitLab). |
| Phase 3 | `Conflict: an artifact with this name already exists` | **Adjust**: include the shard index in the artifact name. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
