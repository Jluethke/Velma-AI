# E2E Network Plan: Real Backend, Sandbox or Mock per Dependency

**One-line description:** For every external dependency of every critical journey, decides from a fixed table whether the E2E test hits the real owned backend, a provider sandbox, a local capture service, or a network-level mock, and records for each mock where its response body comes from and how drift from the real API is caught.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `critical_journeys` (object[], required): From `e2e-journey-select`; each has `external_dependencies`.
- `repo_dir` (string, required): Absolute path to the repository.

---

## Outputs

- `backend_plan` (object[]): One row per `(journey_id, dependency)`: `{journey_id, dependency, decision: "real"|"sandbox"|"capture"|"mock", rule, mock_source|null, drift_check|null, error_cases_to_mock[]}`.

---

## Phase 1: List Every Network Call per Journey

### Entry Criteria
- `critical_journeys` has entries with `external_dependencies` filled.

### Actions
1. Walk each journey with network recording on. With Playwright installed: `npx playwright open --save-har=journey.har --save-har-glob="**/*" <app_url>` (Python: `playwright open --save-har=journey.har <app_url>`); complete the journey and close the browser. Otherwise use the browser DevTools Network tab, "Save all as HAR".
2. List the distinct hosts: `jq -r '.log.entries[].request.url' journey.har | awk -F/ '{print $3}' | sort | uniq -c`.
3. Classify each host as owned (your backend), third-party with sandbox, third-party without sandbox, analytics/ads, or messaging (email/SMS).

### Output
Host list per journey.

### Quality Gate
- Every host in the HAR is classified; none is "unknown".

---

## Phase 2: Decide per Dependency

### Entry Criteria
- Hosts classified.

### Actions
1. Apply the first matching rule:

| # | Dependency | Decision | Why |
|---|---|---|---|
| 1 | Your own backend on the journey's main path | `real` | The point of E2E is to prove UI and backend work together. |
| 2 | Payment, identity or maps provider with an official test mode or sandbox | `sandbox` | Real protocol, no real money; use the provider's documented test credentials. |
| 3 | Email or SMS sent by your backend | `capture` | Run a local catcher such as Mailpit and read the message through its API. |
| 4 | Analytics, ads, chat widgets, error reporting | `mock` (abort or empty 204) | Not part of the journey; slows and destabilizes runs. |
| 5 | Third party with no sandbox, rate limits or per-call cost | `mock` | Only option that is repeatable. |
| 6 | Error states of your own backend (500, timeout, 409) that cannot be triggered with real data | `mock` in a separate test, never in the happy path test | Keeps the happy path real. |

2. For every `mock`, set `mock_source`: a response recorded from the real or sandbox API (HAR file or saved JSON), or the provider's published OpenAPI example. Never a hand-written body with guessed fields.
3. For every `mock`, set `drift_check`: a scheduled job that re-records the HAR against the sandbox and diffs field names, or a contract test against the provider schema. If neither is possible, record "no drift check" as an open risk.
4. List `error_cases_to_mock` per journey from rule 6, each with the status code and the UI message the user should see.

### Output
`backend_plan`.

### Quality Gate
- Every `(journey, host)` pair has one row with a rule number.
- Every `mock` row has a non-null `mock_source` and either a `drift_check` or an explicit open risk.
- No row mocks the owned backend on a happy path (rule 1 rows are all `real`).

---

## Worked Example

Illustrative only. Journey `checkout-card`.
```
$ jq -r '.log.entries[].request.url' journey.har | awk -F/ '{print $3}' | sort | uniq -c
     41 localhost:3000
      9 js.stripe.com
      4 api.stripe.com
      6 www.google-analytics.com
      1 api.taxrates.example
```
`backend_plan` rows:
```
checkout-card  localhost:3000         real     rule 1
checkout-card  js/api.stripe.com      sandbox  rule 2  test card 4242 4242 4242 4242
checkout-card  www.google-analytics.com mock   rule 4  abort
checkout-card  api.taxrates.example   mock     rule 5  source: recorded tax.har; drift: nightly re-record + jq key diff
checkout-card  error: POST /api/orders 409 (stock gone) -> "This item just sold out"   mock rule 6
```

---

## Exit Criteria

DONE when every dependency of every journey has a rule-backed decision, every mock has a recorded source, and drift checks or open risks are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Journey cannot be completed (provider blocks automation) | **Return**: report the host; ask whether a sandbox key exists. |
| Phase 2 | Owned backend is too slow or unstable to use | **Return**: report it as a product or environment problem; do not mock the owned backend on the happy path to hide it. |
| Phase 2 | Provider sandbox needs keys the user has not given | **Stop**: list the env var names needed; wait for them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
