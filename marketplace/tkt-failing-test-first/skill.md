# Write the Failing Test First

**One-line description:** Writes one test per acceptance criterion in the planned file and pattern, runs it, and proves it fails for the right reason (an assertion about the missing behavior, not an import error or typo), so the later green run is real evidence.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `test_plan` (object[], required): Output of `tkt-test-level-choose`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.
- `branch_name` (string, required): Output of `tkt-branch-create`; the tests are written on this branch.

---

## Outputs

- `failing_test_evidence` (object[]): One row per acceptance criterion: test id (node id or name), file:line, single-test command, the failure output excerpt, failure class (`assertion` required), and the commit hash after committing the tests.

---

## Phase 1: Write One Test

### Entry Criteria
- `git branch --show-current` equals `branch_name`.
- `test_plan` row selected (work one row at a time).

### Actions
1. Open the pattern test named in `test_plan` and copy its structure: fixtures, setup, naming, assertion style.
2. Name the test after the behavior, not the function: `test_export_respects_status_filter`, `it("rejects users without invoice access")`, `TestExport_RespectsStatusFilter`, `export_respects_status_filter`.
3. Map Given/When/Then directly: Given = arrange (fixtures, data), When = one call (one request, one function call), Then = assertions with the literal values from the criterion.
4. Use only APIs that exist. Before calling any helper, fixture or method, find it: `rg -n -w '<name>' tests/ src/`. If it does not exist, do not call it as if it did. Weak models commonly invent fixtures such as `client.login_as()` that are not in the codebase.
5. One test function per criterion row. For a Scenario Outline, use the stack's parametrization: `@pytest.mark.parametrize`, `test.each` / `it.each` (Jest and Vitest), a table-driven `for _, tc := range cases { t.Run(tc.name, ...) }` loop (Go), or one test per row or the `rstest` crate if the repo already uses it (Rust).
6. Edit only the test file in this step.

### Output
One new test in the planned file.

### Quality Gate
- `git diff --name-only` lists only test files.
- Every helper or fixture used in the new test is found by `rg -n -w '<name>'` outside the new test.

---

## Phase 2: Prove It Fails for the Right Reason

### Entry Criteria
- Test written.

### Actions
1. Run only that test with the planned single-test command.
2. Classify the failure using this table:

| Output shows | Class | Action |
|---|---|---|
| `AssertionError`, `expect(...).toBe` diff, Go `t.Errorf` message, Rust `assertion ... failed` with the expected vs actual values from the criterion | assertion | Correct. Keep the test. |
| HTTP 404 or "route not found" where the criterion expects a new endpoint | assertion | Correct for a new endpoint. |
| `ImportError`, `ModuleNotFoundError`, `Cannot find module`, `undefined: X`, `cannot find function` | compile/import | Expected only if the test calls a symbol the ticket will add. Otherwise fix the test. |
| `fixture 'x' not found`, `TypeError: x is not a function` on a helper | broken-test | Fix the test; the helper does not exist. |
| Test passes | false-green | Behavior already exists or the assertion is wrong. Stop and reread the criterion. |

3. For a compile/import failure because the symbol is new, add the smallest stub in the source so the test compiles and fails on the assertion: Python `raise NotImplementedError`, TS `throw new Error("not implemented")`, Go return the zero value, Rust `todo!()`. Rerun until the class is `assertion` or an explicit not-implemented error from that stub.
4. Copy the failure output excerpt (the assertion line with expected and actual) into the evidence.
5. Repeat Phase 1 and Phase 2 for the next `test_plan` row.

### Output
Evidence rows with class `assertion`.

### Quality Gate
- Every evidence row shows class `assertion` (or not-implemented from a stub) with expected and actual values visible in the excerpt.
- No new test passes before the implementation.

---

## Phase 3: Commit the Red Tests

### Entry Criteria
- All planned tests fail for the right reason.

### Actions
1. Run the whole test file once to confirm the only failures are the new tests: count of failures equals count of new tests.
2. Stage only the test files and any stub: `git add <files>`; check with `git diff --cached --name-only`.
3. Commit with `test(<scope>): add failing tests for <ticket_id> acceptance criteria` if the repo allows failing tests in intermediate commits. If CI runs on every pushed commit and the team requires every commit to pass, do not push yet; keep the commit local and plan to squash (record that).
4. Record the commit hash: `git rev-parse --short HEAD`.

### Output
`failing_test_evidence`.

### Quality Gate
- In the test-file run, failure count equals the number of new tests.
- `git show --stat HEAD` lists only test files and stubs.

---

## Worked Example

Illustrative only. AC3 for PAY-412, pytest.

```python
# tests/api/test_export.py
import pytest

@pytest.mark.integration
def test_export_respects_status_filter(client_as, make_invoice):
    for _ in range(3):
        make_invoice(account_id=77, status="paid")
    for _ in range(2):
        make_invoice(account_id=77, status="open")
    resp = client_as("billing_admin").get("/accounts/77/invoices/export?status=paid")
    assert resp.status_code == 200
    assert len(resp.text.strip().splitlines()) == 4
```

```
$ rg -n -w 'make_invoice|client_as' tests/conftest.py
18:def make_invoice(db):
44:def client_as(app):
$ uv run pytest -m integration tests/api/test_export.py::test_export_respects_status_filter -q
E       assert 404 == 200
1 failed in 0.62s
```

Class: assertion (endpoint does not exist yet). Evidence row recorded with commit `7a8b9c0`.

---

## Exit Criteria

DONE when every `test_plan` row has a test that fails with an assertion about the missing behavior, the failures are recorded, and the tests are committed (or held locally by team rule).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Needed fixture does not exist | **Adjust**: add the fixture to the nearest `conftest.py` or test helper file, following an existing fixture; list it in evidence. |
| Phase 2 | New test passes immediately | **Stop**: the behavior may already exist or the assertion is weak; reread the criterion and check `git log -S '<term>'`. |
| Phase 2 | Failure is an import error for an existing symbol | **Retry**: fix the import path using `rg -n 'def <name>|class <name>'`; rerun. |
| Phase 2 | Test is slow or flaky | **Adjust**: remove sleeps and real clocks; use the repo's time-freezing helper if it has one. |
| Phase 3 | Other tests in the file now fail | **Stop**: the new test changed shared state; fix isolation before committing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
