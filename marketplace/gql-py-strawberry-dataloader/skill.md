# Batch N+1 Fields With Strawberry DataLoader (Python)

**One-line description:** Replaces each per-item lookup with a `strawberry.dataloader.DataLoader` created per request in the context getter, whose async `load_fn` issues one `IN` query and returns values in key order.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `n_plus_one_fields` (object[], required): Offending fields from `gql-n-plus-one-detect`.
- `project_dir` (string, required): Python server project root.

---

## Outputs

- `loader_code` (string): Path to the loaders module (for example `app/loaders.py`).
- `query_count_after` (object[]): Statement counts at the same two sizes after batching.

---

## Phase 1: Write Load Functions

### Entry Criteria
- The detection regression test fails; resolvers are `async def` (Strawberry's DataLoader is asyncio based and needs a running event loop).

### Actions
1. Create `app/loaders.py`:
```python
from strawberry.dataloader import DataLoader
from sqlalchemy import select

def make_loaders(session):
    async def load_customers(keys: list[int]) -> list[Customer | None]:
        rows = (await session.execute(select(CustomerRow).where(CustomerRow.id.in_(keys)))).scalars().all()
        by_id = {r.id: r for r in rows}
        return [by_id.get(k) for k in keys]
    return {"customer_by_id": DataLoader(load_fn=load_customers)}
```
2. Contract: `load_fn` receives a list of keys and must return a list of the same length in the same order. Values may be an `Exception` instance for a key that failed. Always re-map through a dict; the database does not preserve key order.
3. One-to-many: build `groups: dict[int, list[Row]]` and return `[groups.get(k, []) for k in keys]`.
4. Composite keys: pass tuples as keys (hashable) or set `cache_key_fn`.
5. If you use synchronous resolvers or a sync ORM session, Strawberry's DataLoader will not work; convert the resolvers to `async def` with an async session first.

### Output
`app/loaders.py`.

### Quality Gate
- `python -c "import app.loaders"` exits 0.
- Each load function returns a list comprehension over `keys` (`grep -n "for k in keys" app/loaders.py` lists one per loader).

---

## Phase 2: Create Per Request and Use

### Entry Criteria
- Loaders import.

### Actions
1. In the FastAPI context getter create a new session and new loaders per request:
```python
async def get_context(session=Depends(get_session)):
    return {"session": session, "loaders": make_loaders(session)}
```
2. NEVER create a DataLoader at module import time; its cache would persist across requests and users.
3. Change each offending field: `@strawberry.field async def customer(self, info: strawberry.Info) -> Customer | None: return await info.context["loaders"]["customer_by_id"].load(self.customer_id)`.
4. After a mutation changes an entity, call `loader.clear(key)` or `loader.prime(key, value)` before reading it again in the same request.
5. Change one field, run the regression test, then the next.

### Output
Fields using loaders.

### Quality Gate
- `grep -rn "DataLoader(" app/ | grep -v loaders.py` prints nothing.
- The context getter calls `make_loaders(` (grep shows it inside the function body).

---

## Phase 3: Prove the Batch

### Entry Criteria
- All offending fields use loaders.

### Actions
1. Rerun the two-size measurement; record counts in `query_count_after`.
2. Count at N2 must equal count at N1, and the log must show one `... WHERE customers.id IN (...)` statement (SQLAlchemy renders `IN (__[POSTCOMPILE_id_1])` in some logs; the statement is still one).
3. Run `pytest -q`. The regression test passes and nothing is skipped.

### Output
`loader_code`, `query_count_after`.

### Quality Gate
- Equal counts at both sizes for each fixed operation.
- `pytest -q` exits 0; the summary shows no new `skipped` or `xfailed` tests.

---

## Worked Example

Illustrative only.

Before: `CustomerOrders` logs 3 statements at 2 orders and 6 at 5 orders. After:
```
SELECT orders.* FROM orders WHERE orders.customer_id = ? ORDER BY ... LIMIT ?
SELECT customers.* FROM customers WHERE customers.id IN (?, ?, ?, ?, ?)
```
`query_count_after`: counts 2 and 2. `pytest -q`: `14 passed in 1.12s`.

---

## Exit Criteria

DONE when each offending field loads through a per-request Strawberry DataLoader and counts no longer grow with item count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `RuntimeError: no running event loop` | **Adjust**: the loader is used from sync code; make the resolver `async def`. |
| Phase 1 | Wrong values appear on wrong parents | **Return**: `load_fn` returned rows in database order; re-map by key. |
| Phase 2 | Stale data after a mutation | **Adjust**: call `clear(key)` or `prime(key, value)` after the write. |
| Phase 3 | Count still grows | **Adjust**: the ORM lazy-loads the relation; load through the DataLoader instead of `self.customer` relationship access. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
