# Test Pyramid Inventory

**One-line description:** Classifies every test file into unit, integration or end-to-end by the boundaries it actually crosses (browser, process, network, database, filesystem), joins that with measured durations, and lists the specific end-to-end and integration tests whose assertions can be checked at a lower layer.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `baseline_report` (object, required): From `tsp-baseline-lock`; test count and wall time.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items routed here (process, browser, CPU).

---

## Outputs

- `pyramid_inventory` (object): Per file: layer, boundaries crossed with grep evidence, test count, measured seconds; per layer: file count, test count, seconds and share of serial seconds; and a push-down candidate list with each candidate's assertions enumerated.

---

## Phase 1: Classify Files by Boundary

### Entry Criteria
- `hotspot_plan` exists.

### Actions
1. List test files: python `pytest --collect-only -q | cut -d: -f1 | sort -u`; node `npx jest --listTests` or `npx vitest list --filesOnly` (check `npx vitest list --help`); go `go list -f '{{.Dir}} {{.TestGoFiles}} {{.XTestGoFiles}}' ./...`.
2. For each file, grep for boundary markers and assign the highest layer hit:

| Boundary marker (grep) | Layer |
|---|---|
| `playwright`, `cypress`, `selenium`, `puppeteer`, `chromedp`, `page.goto` | `e2e` |
| Starts the whole app as a process or container: `subprocess.Popen`, `docker compose up`, `testcontainers`, `exec.Command(` running the service binary | `e2e` |
| Real database, queue, or cache connection; real HTTP to another service; in-process app server with real DB (`TestClient(app)` plus DB, `supertest(app)` plus DB, `httptest` plus real DB) | `integration` |
| Filesystem only through temp dirs (`tmp_path`, `t.TempDir()`, `os.tmpdir()`) and nothing above | `unit` |
| None of the above | `unit` |

3. Record the grep line that set each file's layer.

### Output
Per-file layer with evidence.

### Quality Gate
- Every collected test file has one layer and one evidence line (or `unit` with "no marker").
- The sum of per-file test counts equals the test count in `baseline_report`.

---

## Phase 2: Join with Durations

### Entry Criteria
- Layers assigned.

### Actions
1. Join each file with its measured seconds from the stack's duration report referenced by `hotspot_plan`.
2. Compute per layer: files, tests, seconds, and seconds divided by total serial seconds.
3. Write the per-layer table. These shares describe the suite; they are not compared to any ideal ratio, because no standard fixes one.

### Output
Per-layer table.

### Quality Gate
- Per-layer seconds sum to the total serial seconds within rounding.

---

## Phase 3: List Push-Down Candidates

### Entry Criteria
- Per-layer table done.

### Actions
1. For every `e2e` and `integration` file, in descending seconds order, enumerate each test's assertions (each `assert`, `expect(...)`, `t.Errorf`/`require.*`).
2. Label each assertion with the lowest layer that can observe the same fact:

| The assertion checks | Lowest layer |
|---|---|
| A computed value, validation message, formatting, branching logic | `unit` |
| A SQL query result, ORM mapping, transaction behavior | `integration` (DB only, no HTTP or browser) |
| HTTP status, headers, JSON shape of one endpoint | `integration` (in-process app client: `TestClient`, `supertest`, `httptest.NewRecorder`) |
| Navigation, rendering across pages, browser-only behavior (focus, real CSS layout, cookies across redirects) | `e2e` |
| Wiring between deployed services | `e2e` |

3. A test is a push-down candidate when at least one of its assertions can be observed at a lower layer than the test's current one. Record per candidate: assertions, current layer, target layer per assertion, and which assertions must stay at the current layer.
4. Do NOT mark a test for deletion here. This flow only inventories.

### Output
`pyramid_inventory`.

### Quality Gate
- Every candidate lists every assertion with a target layer from the table.
- `git status --porcelain` shows no edits.

---

## Worked Example

Illustrative. `stack=node`, 1,204 tests.

- Phase 1: 9 Playwright files `e2e`; 41 `supertest` plus Postgres files `integration`; 138 files `unit`.
- Phase 2: e2e 9 files, 64 tests, 211 s (58%); integration 41 files, 380 tests, 120 s (33%); unit 138 files, 760 tests, 33 s (9%).
- Phase 3: `e2e/checkout.spec.ts` "rejects expired card" asserts the error text `Card expired` (unit: `validateCard()`), HTTP 402 from `/pay` (integration: `supertest`), and that the page stays on `/checkout` (e2e). Candidate: two assertions move down; one stays.

---

## Exit Criteria

DONE when every test file has a layer with evidence, the per-layer table sums to the serial total, and every e2e and integration test's assertions are labeled with their lowest observing layer.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test counts do not sum to baseline | **Retry**: parametrized tests and subtests count separately; use the same collection command as the baseline. |
| Phase 1 | A file hits markers of two layers | **Adjust**: assign the higher layer; record both markers. |
| Phase 3 | An assertion checks a snapshot of a whole page | **Adjust**: label it `e2e` and record that the snapshot hides what is checked. |
| Phase 3 | No candidates found | **Return**: report the inventory; `tsp-pyramid-push-down` has no work. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
