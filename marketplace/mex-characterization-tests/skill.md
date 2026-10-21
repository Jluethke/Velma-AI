# Characterization Tests at the Seam

**One-line description:** Pins the candidate's current observable behavior at every public API function and entry point with snapshot (golden master) tests in the stack's standard snapshot tool, before any code moves, so every later refactor and the final cutover can be checked against recorded outputs rather than memory.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Monolith working tree at `baseline_sha`.
- `seam_map` (object, required): From `mex-seam-identification`; supplies `public_api` and the entry points.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `characterization_suite` (object): Test file paths, the command that runs only them, the snapshot tool and version, the list of covered API functions and entry points, and the list of volatile fields scrubbed.
- `baseline_outputs` (object): Path to the committed snapshot files and the commit SHA that recorded them.

---

## Phase 1: Choose Inputs Worth Recording

### Entry Criteria
- `seam_map.public_api` is non-empty.

### Actions
1. For each public API function and entry point, collect input cases from real usage, in this order of preference: (a) existing test fixtures in the repo, (b) request logs or recorded payloads the user provides, (c) one case per branch you can see in the function body (`if`, `match`, `switch`, early `return`, `raise`/`throw`).
2. Include at least one error case per function: the input that produces the function's documented error (not found, validation error, permission denied).
3. List volatile output fields that differ run to run: timestamps, generated IDs, UUIDs, random tokens, ordering of unordered collections. These must be scrubbed or frozen, not left in snapshots.

### Output
Input cases per API function and the volatile field list.

### Quality Gate
- Every `public_api` entry has at least one success case and one error case, or an open question explaining why an error case cannot be built.

---

## Phase 2: Write the Snapshot Tests

### Entry Criteria
- Input cases chosen.

### Actions
1. Use the stack's established snapshot tool. If the repo already uses one, use that one.

   | Stack | Tool | Record | Verify |
   |---|---|---|---|
   | python | `syrupy` (pytest plugin): `assert result == snapshot` | `pytest tests/characterization --snapshot-update` | `pytest tests/characterization` |
   | python (no pytest) | `approvaltests`: `verify(result)` | run once, rename `.received.txt` to `.approved.txt` after reading it | run tests |
   | node | Jest `expect(result).toMatchSnapshot()` or Vitest same API | `npx jest tests/characterization -u` | `npx jest tests/characterization --ci` |
   | go | golden files under `testdata/` with an `-update` test flag defined in the test file (`var update = flag.Bool("update", false, "update golden files")`) | `go test ./internal/billing/characterization -update` | `go test ./internal/billing/characterization` |
   | java | ApprovalTests.Java `Approvals.verify(result)` or JSON comparison with `JSONAssert.assertEquals(expected, actual, true)` | rename `.received.` to `.approved.` after reading | `./mvnw test -Dtest='*CharacterizationTest'` |

2. Put the tests in a new directory (`tests/characterization`, `internal/billing/characterization`, `src/test/java/.../characterization`). Do not edit existing tests.
3. Serialize results deterministically before snapshotting: sorted keys (`json.dumps(obj, sort_keys=True, default=str)`, `JSON.stringify` after sorting keys, Go `json.MarshalIndent` on structs, Jackson `ORDER_MAP_ENTRIES_BY_KEYS`).
4. Freeze or scrub volatile fields: freeze time with `freezegun` (python), `jest.useFakeTimers().setSystemTime(...)` (node), an injected clock (go, java); replace generated IDs with placeholders before asserting.
5. For entry points (HTTP routes), call through the framework's test client (Django `Client`, FastAPI `TestClient`, `supertest`, `httptest.NewRecorder`, Spring `MockMvc`) and snapshot status code, selected headers and the body.
6. Record snapshots once, then read every snapshot file before committing. A snapshot containing a stack trace, `None`/`null` where data was expected, or an empty list for a case that should return data means the test setup is wrong.

### Output
Characterization tests and recorded snapshots.

### Quality Gate
- The verify command passes twice in a row with no snapshot changes: `git status --porcelain` shows no modified snapshot files after the second run.
- No snapshot contains a real timestamp or UUID: `rg -n "\d{4}-\d{2}-\d{2}T\d{2}:|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}" <snapshot dir>` returns nothing.

---

## Phase 3: Prove the Tests Detect Change

### Entry Criteria
- Snapshots committed.

### Actions
1. Mutation check: change one returned value in one public API function by hand (for example add 1 to a total), run the verify command, and confirm it fails. Revert with `git checkout -- <that file>` and confirm it passes again.
2. Repeat for one entry point.
3. Commit the suite alone in one commit: `git add tests/characterization && git commit -m "Add characterization tests for billing public API"`. Record the SHA in `baseline_outputs`.

### Output
`characterization_suite`, `baseline_outputs`.

### Quality Gate
- The mutation run printed a failing assertion naming the snapshot.
- After revert, the verify command exits 0.

---

## Worked Example

Illustrative. Python, `pytest` plus `syrupy`.

```python
# tests/characterization/test_billing_api.py
from freezegun import freeze_time
@freeze_time("2026-01-15")
def test_create_invoice_two_lines(snapshot, order_with_two_lines):
    inv = create_invoice(order_with_two_lines.id)
    assert scrub_ids(invoice_to_dict(inv)) == snapshot
```
```
$ pytest tests/characterization --snapshot-update
14 snapshots generated.
$ pytest tests/characterization
14 passed in 2.31s
```
Mutation: changed `tax = round(subtotal * rate, 2)` to `+ 1`; result `1 snapshot failed`. Reverted; `14 passed`.

---

## Exit Criteria

DONE when every public API function and entry point has success and error snapshots, the suite is stable across two runs, a deliberate mutation makes it fail, and the snapshots are committed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Function has side effects only (sends email, enqueues job) | **Adjust**: snapshot the calls made to a fake of the outbound dependency instead of a return value. |
| Phase 2 | Snapshots change between runs | **Adjust**: find the volatile field in the diff and scrub or freeze it; do not loosen to "any value" for business fields. |
| Phase 2 | Recorded behavior looks like a bug | **Return**: keep the snapshot as is and report the suspected bug; characterization pins current behavior, it does not fix it. |
| Phase 3 | Mutation does not fail the suite | **Retry**: the case does not reach that code; add an input that does. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
