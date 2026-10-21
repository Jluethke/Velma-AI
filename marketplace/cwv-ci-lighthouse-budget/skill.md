# Lighthouse CI Performance Budget

**One-line description:** Adds Lighthouse CI (`@lhci/cli`) to GitHub Actions or GitLab CI with a `lighthouserc.json` that collects several runs per URL against a production build and asserts LCP, CLS, TBT and resource sizes with `maxNumericValue` limits taken from the Google thresholds or the measured baseline, so a regression fails the build.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `ci_platform` (string, required): `github-actions` or `gitlab-ci`.
- `page_urls` (string[], required): Paths to test (used as `http://localhost:<port><path>` in CI).
- `field_baseline` (object, required): From `cwv-field-crux-baseline`; used to document which metrics fail in the field.

---

## Outputs

- `lhci_config` (object): The `lighthouserc.json` content and the source of every assertion limit.
- `lhci_ci_job` (object): The CI workflow file path and job definition, plus the result of the first CI run.

---

## Phase 1: Choose Limits

### Entry Criteria
- The app builds and starts locally in production mode.

### Actions
1. Run the collection locally to get a lab baseline: `npx @lhci/cli collect --url=http://localhost:3000/ --numberOfRuns=5 --startServerCommand="npm run start"` (adjust the start command and port). Then `npx @lhci/cli assert --preset=lighthouse:no-pwa` once to see which audits exist; ignore its failures.
2. Set each limit from a named source. Record the source beside it:
   | Assertion | Limit source |
   |---|---|
   | `largest-contentful-paint` | Google "good" LCP 2500 ms, or the current lab median if the lab median is already above it (a no-regression budget to tighten later) |
   | `cumulative-layout-shift` | Google "good" CLS 0.1 |
   | `total-blocking-time` | Current lab median (no Google field threshold exists for TBT; it is a lab proxy) |
   | `resource-summary:script:size` | Current measured script bytes from the lab run (no-regression) |
3. Do not pick round numbers that come from nowhere. Every limit is a published threshold or a measured baseline.
4. Use `aggregationMethod: "median-run"` so one noisy run does not fail the build.

### Output
Limit table with sources.

### Quality Gate
- Every limit in the table names its source: a web.dev threshold or a value read from the local run's `.lighthouseci/` JSON.

---

## Phase 2: Write the Config

### Entry Criteria
- Limits chosen.

### Actions
1. Create `lighthouserc.json` in `repo_dir`:
   ```json
   {
     "ci": {
       "collect": {
         "startServerCommand": "npm run start",
         "url": ["http://localhost:3000/", "http://localhost:3000/p/blue-mug"],
         "numberOfRuns": 5
       },
       "assert": {
         "assertions": {
           "largest-contentful-paint": ["error", {"maxNumericValue": 2500, "aggregationMethod": "median-run"}],
           "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1, "aggregationMethod": "median-run"}],
           "total-blocking-time": ["warn", {"maxNumericValue": 0, "aggregationMethod": "median-run"}],
           "resource-summary:script:size": ["error", {"maxNumericValue": 0}]
         }
       },
       "upload": { "target": "filesystem", "outputDir": ".lighthouseci-reports" }
     }
   }
   ```
   Replace each `0` placeholder with the measured baseline from Phase 1. Leave no placeholder in the committed file.
2. If an assertion id does not exist in your Lighthouse version, `lhci assert` reports it; replace it with the id the report contains (check `jq -r '.audits | keys[]'` on a collected report).
3. Use `"preset": "desktop"` under `collect.settings` only if the budget is for desktop; mobile is the default.
4. Add `.lighthouseci/` and `.lighthouseci-reports/` to `.gitignore`.

### Output
`lighthouserc.json`.

### Quality Gate
- `npx @lhci/cli autorun` runs locally and prints assertion results; no placeholder `0` limits remain (`grep -n '"maxNumericValue": 0' lighthouserc.json` returns nothing unless a 0 limit is intended and sourced).

---

## Phase 3: Add the CI Job

### Entry Criteria
- Local autorun works.

### Actions
1. Write the job by platform:
   | `ci_platform` | File and job |
   |---|---|
   | `github-actions` | `.github/workflows/lighthouse.yml`: on `pull_request`; steps: `actions/checkout`, `actions/setup-node` with the repo's Node version, `npm ci`, `npm run build`, `npx @lhci/cli autorun`. Upload `.lighthouseci-reports` with `actions/upload-artifact` so failures can be inspected. |
   | `gitlab-ci` | `.gitlab-ci.yml` job `lighthouse` with an image that has Node and Chrome (or install Chrome in `before_script`); `script`: `npm ci`, `npm run build`, `npx @lhci/cli autorun`; `artifacts: paths: [.lighthouseci-reports]`. |
2. Pin the `@lhci/cli` version in `devDependencies` so audit ids do not change under you: `npm install --save-dev @lhci/cli` and call `npx lhci autorun`.
3. Open a pull request (or push a branch) and read the job log.

### Output
`lhci_ci_job`.

### Quality Gate
- The first CI run completes and its log shows the assertion table.
- A deliberate regression on a throwaway branch (for example an added large script) makes the job fail; record the run link, then delete the branch.

---

## Worked Example

Illustrative only. GitHub Actions, Next.js.

Phase 1 local medians: LCP 2210 ms, CLS 0.02, TBT 310 ms, script size 412,880 bytes. Limits: LCP 2500 (web.dev good), CLS 0.1 (web.dev good), TBT 310 (measured), script size 412,880 (measured).

Phase 3 job log:
```text
Checking assertions against 2 URL(s), 5 total run(s)
All results processed!
```
Regression test branch adds a 200 KB library to the home page:
```text
X  resource-summary:script:size failure for maxNumericValue assertion
     expected: <=412880
     found: 618223
```

---

## Exit Criteria

DONE when `lighthouserc.json` has sourced limits, the CI job runs on pull requests with reports uploaded, and a deliberate regression is shown to fail it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Server never becomes ready | **Adjust**: set `startServerReadyPattern` to a line the server prints when ready. |
| Phase 2 | Unknown assertion id | **Adjust**: use the id present in the collected report; never invent one. |
| Phase 3 | Chrome missing on the CI runner | **Adjust**: use a runner image with Chrome or install it in the job. |
| Phase 3 | Job flaky near the limit | **Adjust**: keep `median-run` and more runs; do not raise the limit without a recorded reason. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
