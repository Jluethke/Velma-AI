# Ledger Python Hypothesis Property Tests

**One-line description:** Writes Hypothesis property tests and a rule-based state machine for a Python ledger that check every journal entry balances per currency, allocations sum to the total, reversals net to zero, idempotent replays write nothing, and stored balances equal posting sums, with database isolation per example and reproducible failures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `posting_service` (object, required): Output of `ledg-pg-idempotent-posting` (the `post_entry` API under test).
- `allocation_function` (object, required): Output of `ledg-allocate-remainder`.

---

## Outputs

- `py_property_tests` (object): Test file paths, the list of properties with the strategy each uses, the pytest command, the run summary with `--hypothesis-show-statistics` output, and any failing example found with its fix.

---

## Phase 1: Pure Properties

### Entry Criteria
- `pip show hypothesis` prints a version inside the project environment (install with `pip install hypothesis` if missing, after the user approves the dependency).
- `pytest -q` passes before adding tests.

### Actions
1. Create `tests/test_ledger_properties.py`. Bound generated amounts from the storage type, not from a guess: with `bigint` columns and at most `n` postings per entry, use `max_abs = (2**63 - 1) // n`, where `n` is the largest posting count your API accepts.
2. Allocation property:
```
from hypothesis import given, strategies as st
@given(total=st.integers(-max_abs, max_abs),
       weights=st.lists(st.integers(0, 10**6), min_size=1).filter(lambda w: sum(w) > 0))
def test_allocate_sums(total, weights):
    parts = allocate(total, weights)
    assert sum(parts) == total
    assert len(parts) == len(weights)
    assert all(p == 0 for p, w in zip(parts, weights) if w == 0)
```
The weight bound `10**6` is a test-input range, not a business constant; set it to the largest weight your callers send.
3. Balanced entry builder property: generate a list of debit amounts, build postings with a matching credit set (for example via `allocate` of the total over credit accounts), and assert the per-currency sum is 0 before any database call. This tests your builder, not the trigger.
4. Canonical hash property: shuffling postings or dict key order never changes the hash; changing any amount by 1 always does.
5. Run `pytest -q tests/test_ledger_properties.py --hypothesis-show-statistics`. The default `max_examples` is 100; raise it with `@settings(max_examples=...)` only by user choice for CI time.

### Output
Pure property tests passing.

### Quality Gate
- `pytest -q tests/test_ledger_properties.py` exits 0.
- The statistics output shows each property ran with passing examples and no `Unsatisfiable` error (too much filtering).

---

## Phase 2: Database State Machine

### Entry Criteria
- Phase 1 passes; a test PostgreSQL database with the ledger schema is reachable.

### Actions
1. Do not use a function-scoped pytest fixture for the database connection inside `@given`; Hypothesis raises a `HealthCheck.function_scoped_fixture` failure because the fixture is not reset between examples. Open a transaction per example inside the test and roll it back at the end, or use a session-scoped connection with a `SAVEPOINT` per example.
2. Write a `RuleBasedStateMachine` from `hypothesis.stateful`:
   - `@initialize` creates 2 to 4 accounts in one currency.
   - `@rule` `post`: random balanced entry with a fresh key; record the key and payload.
   - `@rule` `replay`: pick a recorded key and payload, call `post_entry` again, assert `replayed` and no new rows.
   - `@rule` `reverse`: pick an unreversed entry, call `ledger_reverse_entry`.
   - `@invariant` `balanced`: `SELECT currency, sum(amount_minor) FROM postings GROUP BY currency` all zero.
   - `@invariant` `balances_match`: if `account_balances` exists, it equals posting sums per account.
3. Expose it with `TestLedger = LedgerMachine.TestCase` and run `pytest -q -k TestLedger`.
4. When a test fails, Hypothesis prints the shrunk failing example and a `@reproduce_failure(...)` decorator line. Copy the shrunk example into a plain regression test, fix the code, keep the regression test.
5. Do not weaken the properties to get green: never narrow a strategy, add `assume()`, or drop an invariant to hide a failure. A fix changes the code under test.

### Output
`py_property_tests`.

### Quality Gate
- `pytest -q -k "properties or TestLedger"` exits 0.
- Every failure found during development has a matching regression test in the file (search with `rg -n "def test_regression"`).

---

## Worked Example

Illustrative only.
```
$ pytest -q tests/test_ledger_properties.py --hypothesis-show-statistics
....
tests/test_ledger_properties.py::test_allocate_sums:
  - during generate phase (0.41 seconds):
    - Typical runtimes: < 1ms, of which < 1ms in data generation
    - 100 passing examples, 0 failing examples, 3 invalid examples
4 passed in 1.37s
```
During development the state machine found that `reverse` then `replay` of the reversal key raised a conflict because the reversal hash included `now()`; the fix removed the timestamp from the hash and a regression test was added.

---

## Exit Criteria

DONE when pure properties and the database state machine pass, failures found were fixed in code with regression tests, and no property was narrowed to pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Unsatisfiable` or `filter_too_much` health check | **Adjust**: build valid inputs directly (for example generate weights then set one positive) instead of filtering. |
| Phase 2 | `function_scoped_fixture` health check | **Adjust**: move the connection setup into the test body or a session fixture with savepoints. |
| Phase 2 | Flaky failure | **Retry**: rerun with the printed seed (`--hypothesis-seed=<n>`); if it reproduces, it is a real bug. |
| Phase 2 | Property fails | **Stop**: fix the code; never delete the property. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
