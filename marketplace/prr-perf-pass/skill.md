# PR Performance Pass

**One-line description:** Checks the changed code for the performance defect classes reviewers can see in a diff (queries in loops and ORM lazy loading, unbounded reads, quadratic membership tests, blocking calls on async paths, per-call setup in hot loops, caches without bounds), extracts every new database query for plan review, and requires a benchmark before any claim of regression.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diff_file` (string, required): Saved PR diff.
- `reading_plan` (object[], required): Ordered files from `prr-diff-reading-order`.
- `findings_dir` (string, required): Findings directory.
- `database` (string, optional): `postgres`, `mysql`, `sqlite`, or empty. Decides whether new queries are sent to a plan review flow.

---

## Outputs

- `perf_findings` (object[]): Performance findings, written to `<findings_dir>/prr-perf-pass.json`.
- `new_queries` (object[]): Every new or changed query: `{ "file": "...", "line": N, "kind": "raw_sql|orm", "text": "...", "called_in_loop": true|false }`.

---

## Phase 1: Locate Hot Paths and New Queries

### Entry Criteria
- `reading_plan` exists.

### Actions
1. Mark a changed function as hot if any of these hold: it is a request handler, it is called inside a loop, it processes every row or message of a batch, or the PR description says it is performance related. Otherwise mark it cold; cold code gets only Phase 2 rows marked "always".
2. Extract new queries from added lines:
   - Raw SQL: `rg -n -i -e '\b(SELECT|INSERT|UPDATE|DELETE)\b' ../added.txt` (create `../added.txt` with `git diff -U0 origin/<base>...<head> | grep -nE '^(\+\+\+ |@@|\+)' > ../added.txt` if missing).
   - ORM calls: Django `.objects.`, `.filter(`, `.get(`, `.all()`; SQLAlchemy `session.query(`, `select(`, `session.execute(`; ActiveRecord `.where(`, `.find(`; Prisma `prisma.<model>.find`; TypeORM `getRepository(`, `.createQueryBuilder(`; GORM `db.Where(`, `db.Find(`.
3. For each query, set `called_in_loop` true if it sits inside a `for`, `while`, `.map(`, `.forEach(`, list comprehension, or a function called from one.
4. Record every query in `new_queries`, with the SQL text for raw SQL or the ORM expression for ORM calls.

### Output
Hot function list and `new_queries`.

### Quality Gate
- Every query-shaped added line from step 2 is in `new_queries` or recorded as a false match.
- Every changed function is marked hot or cold.

---

## Phase 2: Apply the Performance Checklist

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Answer each row for every hot function, and the "always" rows for every changed function:

| Check | Applies | Defect | Fix to suggest |
|---|---|---|---|
| Query inside a loop (`called_in_loop`) | always | N+1 queries | Batch: `WHERE id IN (...)`, Django `select_related` / `prefetch_related`, SQLAlchemy `selectinload` / `joinedload`, ActiveRecord `includes` |
| Attribute access on a related object inside a loop (ORM lazy load) | always | Hidden N+1 | Same as above |
| Query or API list call with no `LIMIT`, pagination, or streaming | always | Unbounded memory and time as data grows | Paginate or stream (`iterator()`, server-side cursor, `yield_per`) |
| Membership test `x in list` or `.includes(`/`.indexOf(` inside a loop | hot | Quadratic time | Build a `set`/`Set`/`map` once before the loop |
| Regex compiled, client created, or file opened per call or per iteration | hot | Repeated setup cost | Create once at module or object scope |
| Blocking call in async code: `time.sleep`, `requests.`, sync DB driver inside `async def`; `fs.readFileSync` in a request handler | always | Stalls the event loop for every request | `asyncio.sleep`, `httpx.AsyncClient`, async driver, `fs.promises` |
| String concatenation in a loop building large output | hot | Repeated copying | `''.join(...)`, array join, `strings.Builder` |
| Whole file or response read into memory (`read()`, `readFileSync`, `io.ReadAll`) for large inputs | always | Memory spike | Stream or chunk |
| New cache with no size bound or TTL (`dict` at module scope, `functools.lru_cache(maxsize=None)`, `Map` that only grows) | always | Memory leak | Bounded LRU with explicit `maxsize`, or TTL |
| Logging or serialization of large objects inside a hot loop | hot | CPU and I/O cost | Log counts or IDs, guard with level check |
| New `WHERE`, `ORDER BY` or `JOIN` column without an index | always | Full scans | Send to the database plan flow |

2. For each "suspect" answer, write the input size condition that makes it costly, for example "an order with many line items issues one query per item".

### Output
Suspect list with conditions.

### Quality Gate
- Every hot function has every row answered; every cold function has every "always" row answered.
- Every suspect names the input condition that triggers it.

---

## Phase 3: Require Measurement and Record Findings

### Entry Criteria
- Phase 2 complete.

### Actions
1. Never claim a measured regression from reading code. Label with this table:

| Evidence | Label |
|---|---|
| N+1 or unbounded query on a request path, visible in code | blocking (structural, no benchmark needed) |
| Blocking call inside async code on a request path | blocking |
| Unbounded cache or unbounded read of user-controlled size | blocking |
| Algorithmic or setup cost in a hot path, no benchmark provided | question: ask for a benchmark and give the command |
| Same, in cold code | nit or drop |

2. Give the stack's benchmark command in the question: Python `pytest --benchmark-only` (pytest-benchmark) or `python -m timeit`; Go `go test -bench=<Name> -benchmem -count=<n> ./pkg/` on base and head, compared with `benchstat base.txt head.txt`; JS `hyperfine '<cmd>'` for CLI paths or the project's benchmark script. To count queries: Django `assertNumQueries`, SQLAlchemy `create_engine(..., echo=True)`, or a test that counts `cursor.execute` calls.
3. If `database` is set, pass `new_queries` on unchanged for plan review.
4. Write `<findings_dir>/prr-perf-pass.json` (fields `flow`, `category`="performance", `file`, `line`, `evidence`, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`perf_findings`, `new_queries`.

### Quality Gate
- No finding claims a numeric slowdown unless `evidence` contains benchmark output from base and head.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Diff in `orders/views.py`:
```
+    orders = Order.objects.filter(customer=request.user)
+    return JsonResponse({"orders": [
+        {"id": o.id, "items": [i.sku for i in o.items.all()], "ship_to": o.address.city}
+        for o in orders]})
```
- Phase 1: request handler, hot. `new_queries`: `Order.objects.filter(customer=...)` (orm, not in loop), `o.items.all()` (orm, in loop), `o.address` (lazy load, in loop).
- Phase 2: N+1 on items and address; no pagination on orders.
- Phase 3: blocking: "use `.select_related('address').prefetch_related('items')`, verified in a test with `assertNumQueries`"; blocking: "paginate the orders list".

---

## Exit Criteria

DONE when every changed function is classified hot or cold and checked, every new query is extracted, structural defects are labeled from code evidence, and every non-structural claim is a question with the benchmark command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Query built dynamically (string assembled across functions) | **Adjust**: record `text` as the best reconstruction and mark it `kind`=raw_sql with a note. |
| Phase 2 | Cannot tell whether code is hot | **Adjust**: treat it as hot. |
| Phase 3 | Author disputes a structural finding | **Return**: ask for a query count test result; keep the finding until it is provided. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
