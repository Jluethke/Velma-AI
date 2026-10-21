# Read a Playwright Trace to Find Why a Test Failed

**One-line description:** Opens a failing test's `trace.zip` with `show-trace`, locates the failing action, reads its actionability log, Before/After DOM snapshots, Network, Console and Errors tabs in a fixed order, and maps the evidence to one cause class from a table, so the fix targets the real cause instead of adding a wait.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `trace_path` (string, optional): Path or CI artifact URL of a `trace.zip`. When absent, the flow reproduces a failure to get one.
- `artifact_config` (object, required): From `e2e-failure-artifacts`; tells where traces are written.

---

## Outputs

- `failure_diagnosis` (object): `{test_id, failing_action, error_message, actionability_log_excerpt, network_evidence[], console_errors[], cause_class, proposed_fix, evidence_screens[]}`.

---

## Phase 1: Get and Open the Trace

### Entry Criteria
- A failing test is known.

### Actions
1. If `trace_path` is absent, reproduce with tracing forced on: Node `npx playwright test <file> -g "<title>" --trace on --retries=0`; Python `pytest <file>::<test> --tracing on`. The trace lands under `artifact_config.output_dir`.
2. Open it: Node `npx playwright show-trace <trace.zip>`; Python `playwright show-trace <trace.zip>`. Without a local install, drag the file into https://trace.playwright.dev (it loads in the browser; the file is not uploaded to a server according to the page).
3. From CI, download the artifact first (`gh run download <run-id> -n <artifact-name>`), then open the `trace.zip` inside the failing test's folder.

### Output
Trace open.

### Quality Gate
- The Actions list is visible and shows the failing action marked red.

---

## Phase 2: Read the Evidence in Order

### Entry Criteria
- Trace open.

### Actions
1. Click the red action. Read the **Errors** tab: copy the exact error (for example `locator.click: Timeout 30000ms exceeded`).
2. Read the **Log** tab (the actionability log). Copy the last lines. Key messages:
   - `waiting for getByRole('button', { name: 'Pay' })` repeated: the element never appeared.
   - `element is not visible` / `element is not enabled`: present but not interactable.
   - `element is not stable`: animating.
   - `<div class="overlay"> intercepts pointer events`: something covers it.
   - `resolved to 2 elements`: strict mode violation, locator is ambiguous.
3. Open the **Before** and **After** DOM snapshots of the failing action and of the action before it. Inspect what the page actually showed (use the snapshot's pick-locator tool to test a locator against it).
4. **Network** tab: filter by `Fetch`; note any 4xx/5xx, any request still pending, and any request that came back after the failing action.
5. **Console** tab: copy errors (uncaught exceptions, hydration warnings).
6. **Source** tab confirms which line failed.

### Output
Evidence set.

### Quality Gate
- `error_message` and `actionability_log_excerpt` are copied verbatim from the trace.
- `network_evidence` lists status codes for requests made between the previous action and the failure.

---

## Phase 3: Classify and Propose the Fix

### Entry Criteria
- Evidence collected.

### Actions
1. First matching row:

| Evidence | `cause_class` | Fix |
|---|---|---|
| Backend request 4xx/5xx right before failure | `backend_error` | Investigate the server or test data; not a test timing issue |
| Request still pending at failure | `slow_dependency` | Wait for the response (`waitForResponse`) or the UI state it produces; check if it should be mocked per backend plan |
| `intercepts pointer events` | `overlay` | Dismiss or wait for the overlay to disappear (`expect(overlay).toBeHidden()`) |
| `resolved to N elements` | `ambiguous_locator` | Scope the locator per selector policy |
| `element is not stable` | `animation` | Wait for the end state; set `reducedMotion: 'reduce'` in `use` if the app honors it |
| Element present in After snapshot but test read a value too early (assertion on `textContent()` result) | `non_retrying_assertion` | Replace with a web-first assertion: `await expect(locator).toHaveText(...)` |
| Click happened but nothing changed, console shows hydration warning | `hydration_race` | Wait for an app-ready signal before interacting |
| Data from another test visible | `data_collision` | Apply unique data per test |

2. Never propose `waitForTimeout`, a larger global timeout, or `force: true` as the fix. `force: true` skips the actionability checks that just found the real problem.
3. Record `proposed_fix` naming the file and line.

### Output
`failure_diagnosis`.

### Quality Gate
- `cause_class` is one value from the table and the matching evidence is quoted.
- `proposed_fix` contains no `waitForTimeout`, `force: true` or timeout increase.

---

## Worked Example

Illustrative only.
```
$ npx playwright test e2e/checkout.spec.ts -g "places order" --trace on --retries=0
  1 failed
$ npx playwright show-trace test-results/checkout-places-order-chromium/trace.zip
```
Errors: `locator.click: Timeout 30000ms exceeded.`
Log: `<div class="cookie-banner"> intercepts pointer events` then `retrying click action`.
Network: all 200. Console: empty.
Diagnosis: `cause_class=overlay`; fix in `e2e/fixtures.ts`: an auto fixture that clicks `getByRole('button', { name: 'Accept cookies' })` when visible, or sets the consent cookie through `context.addCookies` before `goto`.

---

## Exit Criteria

DONE when the failing action, its error, its actionability log, network and console evidence are recorded verbatim and mapped to one cause class with a fix that does not add waits or force.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No trace in artifacts | **Adjust**: trace mode is `on-first-retry` and the run had no retry; reproduce with `--trace on`. |
| Phase 1 | Failure does not reproduce locally | **Return**: hand to the flake triage flow with the CI trace. |
| Phase 3 | Evidence matches no row | **Return**: report the verbatim evidence; do not guess a cause. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
