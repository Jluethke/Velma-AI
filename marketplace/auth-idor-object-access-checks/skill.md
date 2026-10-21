# Auth IDOR Object Access Checks

**One-line description:** Finds and fixes insecure direct object references (OWASP API Security Top 10 2023 API1, Broken Object Level Authorization) by enumerating every route that takes an object identifier, scoping each lookup by owner or tenant in the query itself (Django ORM, DRF `get_queryset`, SQLAlchemy, Prisma `findFirst`, raw SQL, Go `database/sql`), optionally adding PostgreSQL row-level security, and proving each fix with a two-user cross-access test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `authz_model_decision` (object, required): Output of `auth-rbac-vs-abac-decision`; gives the permission matrix and ownership or tenant conditions.

---

## Outputs

- `object_access_findings` (object): Every route with an object ID, its lookup code, the scoping status (scoped in query, checked after fetch, unchecked), the fix applied, and the cross-user test results.

---

## Phase 1: Enumerate Object-ID Routes

### Entry Criteria
- `authz_model_decision.matrix` exists.

### Actions
1. List routes that carry an identifier in path, query or body:
   - Django: `rg -n "<(int|uuid|slug|str):[a-z_]*(pk|id)>|<pk>|<id>" --type py .` in `urls.py` files; DRF routers register `<pk>` implicitly for every `ModelViewSet` (`rg -n "router\.register" .`).
   - Flask/FastAPI: `rg -n "@(app|router|bp)\.(get|post|put|patch|delete)\(['\"][^'\"]*\{|<int:|<uuid:" --type py .`
   - Express: `rg -n "\.(get|post|put|patch|delete)\(['\"][^'\"]*:[A-Za-z]+" --glob "*.{js,ts}" .`
   - Go: `rg -n "\{[a-zA-Z]+\}|r\.PathValue\(|chi\.URLParam\(|mux\.Vars\(" --type go .`
2. Also list body or query fields that reference other objects (`project_id`, `account_id`, `invoice_id` in request schemas). These are IDOR sinks on create and update.
3. For each route, open the handler and copy the exact lookup line.

### Output
Route list with lookup lines.

### Quality Gate
- Every `ModelViewSet` and every path parameter route appears.
- Each route has its lookup line quoted with file and line.

---

## Phase 2: Classify Each Lookup

### Entry Criteria
- Route list exists.

### Actions
1. Classify:

| Class | Pattern | Status |
|---|---|---|
| A: scoped in query | `Invoice.objects.get(pk=pk, account=request.user.account)`; `WHERE id = $1 AND tenant_id = $2`; `prisma.invoice.findFirst({ where: { id, accountId: user.accountId } })` | OK |
| B: fetched then checked | `obj = get(pk)` followed by `if obj.owner_id != user.id: 403` on every path | OK but fragile; prefer A |
| C: DRF object permission | `has_object_permission` on a view | OK only for detail routes using `self.get_object()`; DRF does not call it for list views or for objects fetched manually |
| D: unchecked | `Model.objects.get(pk=pk)`, `findUnique({ where: { id } })`, `SELECT ... WHERE id = $1` with no owner or tenant term | IDOR |

2. Also mark as IDOR:
   - Create or update that accepts a foreign key (`project_id`) without checking the subject may access that project.
   - Bulk endpoints (`ids=[...]`) that check only the first ID.
   - Nested routes `/orgs/:orgId/projects/:projectId` that check `orgId` membership but not that the project belongs to `orgId`.
3. Random UUIDs instead of integers are not a fix; they only make guessing harder.

### Output
Classified route list.

### Quality Gate
- Every route has exactly one class.
- Every class D route has a finding entry.

---

## Phase 3: Fix by Scoping the Query

### Entry Criteria
- Classified list exists.

### Actions
1. Fix one route at a time, then run its test, then move on.
2. Stack patterns:
   - Django: `get_object_or_404(Invoice, pk=pk, account=request.user.account)`. DRF: override `get_queryset()` to `return Invoice.objects.filter(account=self.request.user.account)`; then both list and detail are scoped.
   - SQLAlchemy: `session.execute(select(Invoice).where(Invoice.id == id, Invoice.account_id == user.account_id)).scalar_one_or_none()`.
   - Prisma: `findUnique` accepts only unique fields; use `findFirst({ where: { id, accountId } })`, or a compound unique `@@unique([id, accountId])` with `findUnique({ where: { id_accountId: { id, accountId } } })`. For updates use `updateMany({ where: { id, accountId }, data })` and check `count === 1`.
   - Go `database/sql`: `db.QueryRowContext(ctx, "SELECT ... FROM invoices WHERE id = $1 AND account_id = $2", id, acct)`; `sql.ErrNoRows` returns 404.
3. Return 404 (not 403) when the object exists but belongs to someone else, so existence does not leak, unless the matrix requires 403.
4. Optional PostgreSQL row-level security as a second layer:
   ```sql
   ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
   ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON invoices
     USING (account_id = current_setting('app.account_id')::bigint);
   ```
   The app runs `SET LOCAL app.account_id = '<id>'` at the start of each transaction. Superusers and roles with `BYPASSRLS` skip policies; the app's DB role must have neither. `FORCE` makes the table owner subject to the policy.
5. Do NOT fix IDOR in the frontend (hiding buttons); the server must enforce.

### Output
Patched lookups.

### Quality Gate
- Rerun the Phase 1 searches and reclassify: zero class D routes.

---

## Phase 4: Two-User Tests

### Entry Criteria
- Patches applied.

### Actions
1. Fixtures: user A in tenant 1 owning object X; user B in tenant 2 owning object Y.
2. For each route: as B, request X with every method the route supports; expect 404 (or the matrix status) and confirm X is unchanged by reading it as A.
3. For each create or update with a foreign key: as B, create an object pointing at A's parent; expect rejection.
4. For list routes: as B, the list does not contain X.
5. Run the stack test command.

### Output
`object_access_findings`.

### Quality Gate
- One cross-user test per route passes.
- Mutation check: revert one scoped query to the unscoped form; its test fails; restore.

---

## Worked Example

Illustrative only. DRF API.

Phase 1: `rg -n "router\.register" .` finds `InvoiceViewSet`, `ProjectViewSet`.

Phase 2: `InvoiceViewSet.queryset = Invoice.objects.all()` with `IsAuthenticated` only: class D for list and detail.

Phase 3: `def get_queryset(self): return Invoice.objects.filter(account=self.request.user.account)`.

Phase 4:
```
$ pytest -q tests/test_idor.py
........                                                 [100%]
8 passed in 1.31s
```
Mutation run with `Invoice.objects.all()` restored: `FAILED tests/test_idor.py::test_user_b_cannot_read_invoice_of_a`.

---

## Exit Criteria

DONE when every object-ID route and foreign-key input is scoped by owner or tenant on the server, no class D lookups remain, and each route has a passing two-user test with a mutation check recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Routes generated dynamically | **Adjust**: list them at runtime (Django `show_urls`, Express router stack dump in a test) and record the method. |
| Phase 2 | Ownership rule unclear for a resource | **Return**: ask for the matrix row; do not guess who owns it. |
| Phase 3 | Scoping breaks an admin feature | **Adjust**: add an explicit admin path checked against the matrix; never remove the scope for everyone. |
| Phase 4 | Cross-user test returns 200 | **Stop**: the route is still vulnerable; fix before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
