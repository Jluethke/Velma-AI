# Push Down One Slow Test to a Lower Layer

**One-line description:** Moves the assertions of one slow end-to-end or integration test to unit or in-process integration tests, proves with per-test coverage contexts (coverage.py `--cov-context=test`, Istanbul per-file runs, Go `-coverprofile` per test) that the lines the old test uniquely covered are still covered and still asserted, and only then trims the old test to the assertions that must stay at its layer.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `pyramid_inventory` (object, required): From `tsp-pyramid-inventory`; candidates with assertions and target layers.

---

## Outputs

- `pushdown_record` (object): Per candidate: old test id, new test ids, assertion mapping (old assertion to new test), lines uniquely covered by the old test and the new tests that cover them, mutation results, trimmed or kept status of the old test, commit SHAs, and seconds before and after.

---

## Phase 1: Find What Only the Old Test Covers

### Entry Criteria
- One candidate selected from `pyramid_inventory`; suite green.

### Actions
1. Get per-test coverage for the old test and for the rest of the suite:

| `stack` | Command |
|---|---|
| python | `pytest --cov=<pkg> --cov-context=test --cov-report=` then `coverage json --show-contexts -o ctx.json`; lines whose context list contains only the old test id are uniquely covered |
| node | Run the old test file alone with `--coverage --coverageReporters=json` and save `coverage-final.json` as `old.json`; run the suite without that file (`--testPathIgnorePatterns <file>` in Jest, `--exclude <file>` in Vitest) and save `rest.json`; lines with a hit count above zero in `old.json` and zero in `rest.json` are uniquely covered |
| go | `go test -count=1 -run '^TestOld$' -coverpkg=./... -coverprofile=old.out ./<pkg>` and the full suite with `-skip '^TestOld$'` (Go 1.20+) into `rest.out`; compare blocks with count above zero |

2. Write the uniquely covered lines as `file:line` ranges. These lines must stay covered after the change.
3. Do NOT modify the old test yet.

### Output
Uniquely covered line list.

### Quality Gate
- The line list is produced from the two saved coverage files, not by reading code.

---

## Phase 2: Write the Lower-Layer Tests

### Entry Criteria
- Line list exists.

### Actions
1. For each assertion labeled with a lower target layer, write one new test at that layer that asserts the same fact with the same expected value. Use the project's existing unit and integration test locations and helpers. Do NOT invent helper functions; grep for existing ones first.
2. In-process integration test tools by stack: python FastAPI `TestClient(app)`, Django `client` fixture, Flask `app.test_client()`; node `supertest(app)`; go `httptest.NewRecorder()` with the handler, or `httptest.NewServer(handler)`.
3. Run each new test; it must pass.
4. Mutation check per new test: break the production line it covers (flip a comparison, change a message string); the new test must fail; revert.
5. Commit the new tests alone: `git commit -m "test: lower-layer tests for <old test>"`. The old test is still unchanged in this commit.

### Output
New tests committed.

### Quality Gate
- Each mutated run fails and each reverted run passes; record the mutation and the failure line.
- `git show --stat HEAD` shows only test files added or changed, not the old test.

---

## Phase 3: Trim the Old Test and Prove Coverage

### Entry Criteria
- New tests committed.

### Actions
1. Decide with this table:

| Old test's assertions | Action |
|---|---|
| Every assertion now has a lower-layer test | Trim the old test to a single smoke path that proves the layer wiring, or remove it only if another test at the same layer already exercises the same wiring (name that test) |
| Some assertions must stay at the current layer | Remove only the assertions that moved; keep the rest |

2. Rerun the Phase 1 coverage commands with the new tests and the trimmed old test. Every line in the uniquely covered list must be covered by at least one test.
3. Run the full suite. Total covered lines must be greater than or equal to the count in `coverage_baseline` recorded by `tsp-baseline-lock` (checked again by `tsp-coverage-parity-gate`).
4. Commit the trim separately: `git commit -m "test: trim <old test> after push-down"`.
5. Do NOT delete a test because it is slow or flaky without the mapping in place. Do NOT remove assertions without a mapped replacement.

### Output
`pushdown_record` row.

### Quality Gate
- Each assertion of the old test maps to a new test id or "kept".
- The rerun coverage shows zero uncovered lines from the uniquely covered list.
- Full suite has zero failures.

---

## Worked Example

Illustrative. `stack=node`. Candidate `e2e/checkout.spec.ts` "rejects expired card", 14.2 s.

- Phase 1: unique lines: `src/pay/validate.ts:41-44` (expiry branch), `src/routes/pay.ts:77` (402 response).
- Phase 2: `src/pay/validate.test.ts` "rejects expired card" expects `{ ok: false, error: 'Card expired' }`; `src/routes/pay.test.ts` uses `supertest(app).post('/pay')` and expects `402`. Mutation: `<` to `<=` on line 42 fails the unit test; reverted passes.
- Phase 3: the e2e test keeps only "page stays on /checkout and shows an error region"; coverage rerun covers 41-44 and 77; e2e 14.2 s to 5.1 s, new tests 0.09 s.

---

## Exit Criteria

DONE when each pushed-down candidate has mapped assertions, mutation-proven new tests, uniquely covered lines still covered, a separate trim commit, and a green suite.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--cov-context` not supported | **Adjust**: upgrade `pytest-cov` (dev dependency) or use the two-run comparison method from the node row. |
| Phase 2 | Logic cannot be reached without the browser | **Adjust**: label the assertion `e2e` and keep it; record why. |
| Phase 3 | A uniquely covered line becomes uncovered | **Stop**: revert the trim commit; add a test for that line first. |
| Phase 3 | Full suite fails after trim | **Return**: revert the trim; the old test set up state another test relied on, which is an order dependency to fix separately. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
