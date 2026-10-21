# Django ORM N+1 Query Fix

**One-line description:** Detects N+1 query patterns in a Django code path with `assertNumQueries` and `CaptureQueriesContext`, fixes each with `select_related`, `prefetch_related`, `Prefetch` or `annotate`, and locks the fix in with a query-count test that fails if the N+1 returns.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Django project root (the directory containing `manage.py`).
- `test_command` (string, required): The project's test command, for example `python manage.py test` or `pytest`.
- `suspect_endpoint` (string, required): The view, URL, serializer, management command or Celery task suspected of N+1, for example `GET /api/orders/`.

---

## Outputs

- `n_plus_one_fixes` (object[]): Per fix: file and line, the queryset before and after, the query count before and after for a stated number of rows, and the test that pins the count.

---

## Phase 1: Measure the Query Count

### Entry Criteria
- `repo_path` contains `manage.py`.
- `test_command` runs and passes on the current code. Run it first; if it fails before you change anything, stop and report.

### Actions
1. Find the code: search for the URL in `urls.py`, then the view, then its queryset and serializer or template.
2. Write a test that builds a fixture with a known number of parent rows (for example 10) with children, calls the code path, and captures queries:
```python
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext

class OrdersListQueries(TestCase):
    def test_orders_list_query_count(self):
        make_orders(n=10, items_per_order=3)          # your fixture helper
        with CaptureQueriesContext(connection) as ctx:
            self.client.get("/api/orders/")
        for q in ctx.captured_queries:
            print(q["sql"])
        print("queries:", len(ctx))
```
3. Run only that test: `python manage.py test app.tests.test_queries` or `pytest app/tests/test_queries.py -s`.
4. Run it again with `n=20`. If the count grows with n, it is N+1. Record both counts.
5. Group the printed SQL by shape. The repeated shape (same SQL, different id) names the relation being lazily loaded.

### Output
Query counts at two sizes and the repeated SQL shape.

### Quality Gate
- Two counts at two fixture sizes are recorded from test output.
- The repeated SQL statement is quoted.

---

## Phase 2: Apply the Matching Fix

### Entry Criteria
- An N+1 was confirmed.

### Actions
1. Pick the fix from the relation type in `models.py`:

| Relation accessed per row | Fix |
|---|---|
| ForeignKey or OneToOneField, forward (`order.customer`) | `.select_related("customer")` (SQL JOIN, one query) |
| Reverse ForeignKey (`order.items.all()`) or ManyToMany | `.prefetch_related("items")` (one extra query with `IN (...)`) |
| Reverse relation with a filter or ordering | `.prefetch_related(Prefetch("items", queryset=Item.objects.filter(active=True), to_attr="active_items"))` and read `order.active_items` |
| Nested (`item.product` inside `order.items`) | `.prefetch_related("items__product")` or `Prefetch("items", queryset=Item.objects.select_related("product"))` |
| Count or sum per row (`order.items.count()`) | `.annotate(item_count=Count("items"))` and read `order.item_count` |
| Field excluded by `.only()` or `.defer()` and then read | add the field to `.only()`; deferred fields load one query per row |

2. Common traps:
   - Calling `.filter()`, `.order_by()` or `.count()` on a prefetched relation inside the loop runs a new query and ignores the prefetch. Use `Prefetch(..., to_attr=...)` or sort in Python.
   - `.iterator()` ignores `prefetch_related` unless `chunk_size` is given (Django 4.1 and later); check your version.
   - Django REST Framework: put `select_related`/`prefetch_related` in the view's `get_queryset()`, and check `SerializerMethodField` methods for queries.
   - Templates: `{{ order.customer.name }}` in a loop is the same N+1.
3. Edit one queryset in one file. Do not change unrelated querysets in the same edit.

### Output
Queryset changed at one call site.

### Quality Gate
- The diff touches only the queryset at the recorded call site (check with `git diff --stat`).

---

## Phase 3: Pin the Count and Run the Suite

### Entry Criteria
- Phase 2 edit made.

### Actions
1. Rerun the Phase 1 test at both sizes. The count must now be the same at n=10 and n=20.
2. Convert the test to an assertion so it fails if the N+1 returns:
```python
with self.assertNumQueries(EXPECTED):
    self.client.get("/api/orders/")
```
   `EXPECTED` is the constant count you observed after the fix (for example 3: session, orders, items). Do not set it higher than observed to leave slack.
3. Run the full `test_command`. All tests that passed before must pass. Do not delete or loosen another test to get green.
4. Optional: check in a running dev server with django-debug-toolbar's SQL panel, which marks duplicated and similar queries.

### Output
`n_plus_one_fixes`.

### Quality Gate
- The query count is equal at both fixture sizes in test output.
- `assertNumQueries` test exists and passes.
- Full `test_command` exit code is 0.

---

## Worked Example

Illustrative only.

Input: `suspect_endpoint` = `GET /api/orders/`, DRF `OrderSerializer` with nested `customer` and `items`.

Phase 1: n=10 gives 22 queries; n=20 gives 42. Repeated SQL: `SELECT ... FROM "shop_customer" WHERE "shop_customer"."id" = 8812 LIMIT 21` and `SELECT ... FROM "shop_orderitem" WHERE "shop_orderitem"."order_id" = 5531`.

Phase 2, `shop/views.py` line 41:
```python
# before
queryset = Order.objects.filter(status="shipped")
# after
queryset = (Order.objects.filter(status="shipped")
            .select_related("customer")
            .prefetch_related("items__product"))
```
Phase 3: n=10 gives 4 queries; n=20 gives 4. Test pinned with `assertNumQueries(4)`. `python manage.py test` ran 312 tests, OK.

---

## Exit Criteria

DONE when the query count no longer grows with row count, an `assertNumQueries` test pins it, and the full test suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test suite fails before any change | **Stop**: report the failing tests; do not start tuning on a red suite. |
| Phase 1 | Count does not grow with n | **Return**: no N+1 on this path; report the per-request count and pass slow SQL to the EXPLAIN flow. |
| Phase 2 | `prefetch_related` on a large reverse relation loads too many rows | **Adjust**: use `Prefetch` with a filtered queryset or paginate the parent. |
| Phase 3 | Another test fails | **Retry**: read the failure; fix the queryset (often a missing `to_attr` or changed ordering); never edit the failing test to pass. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
