# SDK Offset Pagination

**One-line description:** Wraps offset/limit and page/per_page list endpoints in a lazy iterator with the correct stop condition (short page, total reached, or empty page), respects the spec's maximum page size, and documents and tests the skip and duplicate hazard when data changes during iteration.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`; `pagination_styles.offset` lists the operations.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `offset_paginator` (object): Parameters and total field per operation, variant (offset or page number), stop rule, iterator type, documentation note, and test results.

---

## Phase 1: Pin the Contract

### Entry Criteria
- `pagination_styles.offset` is non-empty.

### Actions
1. For each operation record: variant (`offset`+`limit` or `page`+`per_page`/`page_size`); whether `page` is 0-based or 1-based (read the parameter's `default` and `minimum`, then the description); the page size `maximum` and `default`; the items field; any total field (`total`, `total_count`, `count`) or `X-Total-Count` header.
2. Stop rule, first matching row:

| Evidence | Stop when |
|---|---|
| Total field present | `offset + len(items) >= total` (page variant: `page * per_page >= total` using the right base) |
| No total | `len(items) < requested limit` |
| Any case | `len(items) == 0` |

3. The short-page rule is wrong if the server may return fewer items than requested on a non-final page (some APIs filter after paging). If the docs say so, require the empty-page rule only and accept one extra request.

### Output
Contract and stop rule per operation.

### Quality Gate
- Every operation records variant, base (0 or 1 for page variant), maximum, and the chosen stop rule row.

---

## Phase 2: Implement

### Entry Criteria
- Contract recorded.

### Actions
1. Reuse the iterator shape from the cursor flow (Python `SyncOffsetPage` / `AsyncOffsetPage`, TypeScript async generator, Go `iter.Seq2` or `Pager`), with the page state being `offset` or `page` instead of a cursor.
2. Advance by the number of items actually returned, not by the requested limit, for the offset variant. If the server capped `limit` silently, advancing by the requested value skips items.
3. Keep all filters and sort parameters on every request. If the API supports an explicit stable sort (for example `sort=id`), set it by default in the iterator and document it; unstable ordering makes offset paging return duplicates and gaps.
4. Add to the method's docstring: "Offset pagination can skip or repeat items if records are created or deleted during iteration." If a cursor endpoint exists for the same resource, say so in the docstring.
5. Do NOT parallelize page fetches; it multiplies the consistency hazard and rate-limit hits.

### Output
Offset paginator implementation.

### Quality Gate
- Type checker passes.
- The docstring note is present (`grep -n "skip or repeat" <file>`).

---

## Phase 3: Test

### Entry Criteria
- Implementation compiles.

### Actions
1. Tests:
   - Total present: 5 items, limit 2: 3 requests with offsets 0, 2, 4.
   - No total: pages of 2, 2, 1: stops after the short page (3 requests).
   - No total, exact multiple: pages of 2, 2, 0: 3 requests, 4 items.
   - Server caps limit (asked 100, returns 50 per page): offsets advance by 50.
   - Page variant 1-based: first request `page=1`.
   - Filters and sort present on every request.
2. Run the suite.

### Output
`offset_paginator`.

### Quality Gate
- All six tests pass, each asserting request count and params.
- Mutation check: advance by requested limit; the server-cap test must fail; restore.

---

## Worked Example

Illustrative only. `stack = python`, `GET /v1/invoices?offset=&limit=` with `limit.maximum = 100`, response `{ "items": [...], "total": 230 }`.

```python
for inv in client.invoices.list(status="open", limit=100):
    process(inv)
```
Requests: `offset=0`, `offset=100`, `offset=200` (30 items, `200 + 30 >= 230`, stop).
```
$ pytest tests/test_pagination_offset.py -q
......                                                       [100%]
6 passed in 0.08s
```

---

## Exit Criteria

DONE when every offset operation iterates lazily with a stop rule from the table, advances by items returned, keeps filters and sort, documents the consistency hazard, and tests assert request counts and params.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Page base unclear | **Adjust**: call the sandbox with `page=0` and `page=1` and compare first items; record the result. |
| Phase 2 | No stable sort available | **Adjust**: document the hazard in the docstring and README; do not invent a sort parameter. |
| Phase 3 | Test passes with wrong offsets | **Stop**: the mock ignores query params; make it read `offset` and slice. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
