# SQLAlchemy N+1 Query Fix

**One-line description:** Detects lazy-load N+1 queries in a SQLAlchemy 2.x code path with an engine event counter and `raiseload`, fixes each with `selectinload`, `joinedload` or `contains_eager`, and pins the query count in a pytest test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the project using SQLAlchemy.
- `test_command` (string, required): Test command, usually `pytest`.
- `suspect_endpoint` (string, required): The route, service function or job suspected of N+1.

---

## Outputs

- `n_plus_one_fixes` (object[]): Per fix: file and line, the statement before and after, query counts at two data sizes, and the test that pins the count.

---

## Phase 1: Count Queries

### Entry Criteria
- `test_command` passes on the current code. Run it first.
- SQLAlchemy version recorded: `python -c "import sqlalchemy; print(sqlalchemy.__version__)"`. This flow uses 2.x `select()` style; for 1.4 the same loader options exist.

### Actions
1. Add a query counter fixture in `conftest.py`:
```python
import pytest
from sqlalchemy import event

@pytest.fixture
def query_counter(engine):
    statements = []
    def before(conn, cursor, statement, parameters, context, executemany):
        statements.append(statement)
    event.listen(engine, "before_cursor_execute", before)
    yield statements
    event.remove(engine, "before_cursor_execute", before)
```
   For `AsyncEngine`, attach to `async_engine.sync_engine`.
2. Write a test that seeds a known number of parents (10, then 20), calls the code path, and prints `len(query_counter)` and the statements.
3. If the count grows with the number of parents, it is N+1. The repeated statement names the relationship.
4. Faster detection: run the code path with `.options(raiseload("*"))` on the top query. Every lazy load then raises `sqlalchemy.exc.InvalidRequestError` naming the attribute, for example `'Order.items' is not available due to lazy='raise'`.
5. With `AsyncSession`, an implicit lazy load raises `sqlalchemy.exc.MissingGreenlet`; that error is itself an N+1 signal.

### Output
Counts at two sizes and the lazily loaded attributes.

### Quality Gate
- Two counts at two sizes are recorded from test output.
- Each lazily loaded attribute is named (from the repeated SQL or the raiseload error).

---

## Phase 2: Apply the Loader Option

### Entry Criteria
- N+1 confirmed.

### Actions
1. Choose from the relationship type:

| Relationship accessed | Option | SQL produced |
|---|---|---|
| many-to-one (`order.customer`) | `joinedload(Order.customer)` | LEFT OUTER JOIN in the same query |
| one-to-many or many-to-many collection (`order.items`) | `selectinload(Order.items)` | one extra `SELECT ... WHERE order_id IN (...)` |
| nested (`order.items` then `item.product`) | `selectinload(Order.items).joinedload(Item.product)` | |
| already joined in the query for filtering | `.join(Order.customer).options(contains_eager(Order.customer))` | reuses the join |
| count per row | add a scalar subquery or `func.count()` with `group_by` to the query | |

2. Example:
```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

stmt = (select(Order)
        .where(Order.status == "shipped")
        .options(joinedload(Order.customer),
                 selectinload(Order.items).joinedload(Item.product)))
orders = session.scalars(stmt).all()
```
3. Traps:
   - `joinedload` on a collection with `select()` requires `.unique()` on the result in 2.x (`session.scalars(stmt).unique().all()`); otherwise it raises an error. Prefer `selectinload` for collections.
   - `joinedload` on a collection combined with `LIMIT` limits joined rows, not parents; SQLAlchemy wraps it in a subquery, which can be slow. Use `selectinload`.
   - Setting `lazy="selectin"` on the relationship changes every query in the app. Prefer per-query options unless the user wants a global default.
4. Change one statement in one file.

### Output
Loader options added at one call site.

### Quality Gate
- `git diff --stat` shows only the intended file changed.

---

## Phase 3: Pin and Run

### Entry Criteria
- Phase 2 edit made.

### Actions
1. Rerun the counting test at 10 and 20 parents. Counts must be equal.
2. Turn it into an assertion: `assert len(query_counter) == EXPECTED` with `EXPECTED` equal to the count observed after the fix.
3. To guard against future lazy loads, add `raiseload("*")` after your eager options in the test's call path, or set `lazy="raise"` on relationships the user agrees to lock.
4. Run the full `test_command`. All previously passing tests must pass. Do not delete or weaken tests.

### Output
`n_plus_one_fixes`.

### Quality Gate
- Counts are equal at both sizes in test output.
- The count assertion test passes.
- Full `test_command` exit code is 0.

---

## Worked Example

Illustrative only.

Input: FastAPI route `GET /orders` in `app/routes/orders.py`.

Phase 1: 10 orders gives 21 statements; 20 gives 41. `raiseload("*")` raised `'Order.items' is not available due to lazy='raise'`.

Phase 2, `app/repositories/orders.py` line 18: added `.options(joinedload(Order.customer), selectinload(Order.items))`.

Phase 3: 10 orders gives 2 statements (orders with customer join, items IN); 20 gives 2. `assert len(query_counter) == 2`. `pytest` ran 188 passed.

---

## Exit Criteria

DONE when the count is constant across sizes, a count assertion pins it, and the full suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Suite red before changes | **Stop**: report the failures. |
| Phase 1 | No growth with size | **Return**: no N+1 here; pass slow statements to the EXPLAIN flow. |
| Phase 2 | `InvalidRequestError` about `unique()` | **Adjust**: add `.unique()` to the result or switch to `selectinload`. |
| Phase 3 | IN list too large for very many parents | **Adjust**: paginate the parent query; check the dialect's bound parameter limits in its docs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
