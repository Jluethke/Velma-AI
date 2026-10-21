# Strawberry Permission Classes for Authorization (Python)

**One-line description:** Enforces an access rule table in a Strawberry schema with `BasePermission` classes attached through `permission_classes` (or `PermissionExtension`), owner-filtered queries, and a test per rule row using `schema.execute`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_schema` (string, required): Contract schema.
- `project_dir` (string, required): Python server root.
- `access_rules` (object[], required): User-supplied rules per coordinate (role, owner, public).

---

## Outputs

- `authz_code` (string[]): Paths of the permissions module, context getter and changed fields.
- `authz_tests` (string): Path to the authorization tests and their passing run output.

---

## Phase 1: Authenticate in the Context Getter

### Entry Criteria
- Every schema coordinate has a rule row or a user-confirmed public mark.

### Actions
1. In the FastAPI context getter, verify the token and put the user on the context. With PyJWT: `jwt.decode(token, key, algorithms=["RS256"], audience=AUD, issuer=ISS)` (pass `algorithms` explicitly; never accept the algorithm from the token header).
```python
async def get_context(request: Request, session=Depends(get_session)):
    user = await authenticate(request.headers.get("authorization"))
    return {"request": request, "session": session, "user": user, "loaders": make_loaders(session)}
```
2. A missing token gives `user = None`. An invalid token raises `HTTPException(status_code=401)` in the getter, before GraphQL execution.

### Output
Context with `user`.

### Quality Gate
- A request with a garbage `Authorization` header returns HTTP 401: `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer x" -X POST .../graphql -H 'content-type: application/json' -d '{"query":"{ __typename }"}'` prints `401`.

---

## Phase 2: Write and Attach Permissions

### Entry Criteria
- Context has `user`.

### Actions
1. Create `app/permissions.py`:
```python
from strawberry.permission import BasePermission

class IsAuthenticated(BasePermission):
    message = "Not signed in"
    error_extensions = {"code": "UNAUTHENTICATED"}
    def has_permission(self, source, info: strawberry.Info, **kwargs) -> bool:
        return info.context["user"] is not None

class HasRole(BasePermission):
    message = "Forbidden"
    error_extensions = {"code": "FORBIDDEN"}
    def __init__(self, role: str):
        self.role = role
    def has_permission(self, source, info, **kwargs) -> bool:
        u = info.context["user"]
        return u is not None and self.role in u.roles
```
`error_extensions` and `PermissionExtension` exist in recent Strawberry releases; check the Permissions page of the Strawberry docs for your version.
2. Attach by rule kind:

| Rule kind | Strawberry mechanism |
|---|---|
| Signed in | `@strawberry.field(permission_classes=[IsAuthenticated])` |
| Role (parameterized) | `@strawberry.field(extensions=[PermissionExtension(permissions=[HasRole("SUPPORT")])])` (instances need the extension form) |
| Owner of an object | filter in the query: `select(Order).where(Order.id == id, Order.customer_id == user.id)`; return `None` when absent |
| Sensitive field, return null instead of error | `PermissionExtension(permissions=[...], fail_silently=True)` on a nullable field |

3. `has_permission` receives `source` (the parent object) and the field arguments in `kwargs`; use `source` for field-level ownership checks (`source.customer_id == user.id`).
4. Route `node(id:)` through the same owner-filtered loaders as the typed lookups.
5. Change one field at a time and run tests.

### Output
Permissions attached.

### Quality Gate
- `python -c "from app.schema import schema"` exits 0.
- For every non-public rule row, `grep -n` finds the permission class or owner filter on the named field.

---

## Phase 3: Test Every Rule Row

### Entry Criteria
- Permissions attached.

### Actions
1. Write `tests/test_authz.py` using the schema directly:
```python
@pytest.mark.asyncio
async def test_refund_requires_support(session):
    res = await schema.execute(REFUND, variable_values={"id": "1"},
                               context_value={"user": customer_user, "session": session, "loaders": make_loaders(session)})
    assert res.errors[0].extensions["code"] == "FORBIDDEN"
```
2. Three callers per rule row: anonymous, allowed, other user. Add a `node(id:)` test with another user's id.
3. Run `pytest -q tests/test_authz.py` (with `pytest-asyncio` installed, or `anyio` markers).

### Output
`authz_code`, `authz_tests`.

### Quality Gate
- Test count is at least 3 times the number of non-public rule rows.
- `pytest -q` exits 0; no `skip` markers were added.

---

## Worked Example

Illustrative only.

`access_rules`: `Mutation.refundOrder` role `SUPPORT`; `Customer.email` owner or `SUPPORT`, null when denied.

Phase 2: `refundOrder` gets `extensions=[PermissionExtension(permissions=[HasRole("SUPPORT")])]`; `email` gets a permission class checking `source.id == user.id or "SUPPORT" in user.roles` with `fail_silently=True`.

Phase 3:
```
tests/test_authz.py ......                                   [100%]
6 passed in 0.41s
```

---

## Exit Criteria

DONE when every rule is enforced by a permission class or owner filter and each has passing tests for allowed, denied and anonymous callers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `TypeError` passing an instance to `permission_classes` | **Adjust**: `permission_classes` takes classes; use `PermissionExtension(permissions=[HasRole(...)])` for instances. |
| Phase 2 | `fail_silently` on a non-null field | **Adjust**: the field must be nullable for a null result; otherwise raise. |
| Phase 3 | Other user's object returned | **Stop**: add the owner filter to the query before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
