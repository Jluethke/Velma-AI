# Resolver Authorization (Node, Apollo or Yoga)

**One-line description:** Authenticates once in the context function and enforces an access rule table in resolvers and the data layer, covering role checks, object ownership, list filtering and the `node(id:)` bypass, with a test per rule row.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_schema` (string, required): Contract schema.
- `project_dir` (string, required): Node server root.
- `access_rules` (object[], required): The product's rules: field or type coordinate, who may read or write it (role, owner, public). Supplied by the user; this flow enforces rules, it does not invent them.

---

## Outputs

- `authz_code` (string[]): Paths of the context, guard helpers and changed resolvers.
- `authz_tests` (string): Path to the authorization test file and its passing run output.

---

## Phase 1: Build the Rule Table and Context

### Entry Criteria
- Every root field and every type in `validated_schema` either appears in `access_rules` or is marked public by the user.

### Actions
1. List schema coordinates: every `Query`, `Mutation` field and every object type. Join with `access_rules`. Any coordinate with no rule is an open question for the user; do not default it to public.
2. Authenticate in the context function only: parse and verify the token (for example with `jose` `jwtVerify(token, key, { issuer, audience })`) and return `{ user: { id, roles } }` or `{ user: null }`. Do NOT throw for a missing token here unless the whole API is private; anonymous callers may reach public fields.
   - Apollo: `context: async ({ req }) => ({ user: await authenticate(req.headers.authorization), ... })`.
   - Yoga: `context: async ({ request }) => ({ user: await authenticate(request.headers.get('authorization')), ... })`.
3. If the token is present but invalid, throw `new GraphQLError('Invalid token', { extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } } })` in the context function (Apollo honors `extensions.http.status`; Yoga does too for errors thrown from context; verify in your version's docs).

### Output
Rule table with no unassigned coordinates; context with `user`.

### Quality Gate
- Every schema coordinate has a rule row (count of coordinates equals count of rows).
- A request with a garbage `Authorization` header returns an error with `extensions.code == "UNAUTHENTICATED"`.

---

## Phase 2: Enforce in Resolvers and Data Layer

### Entry Criteria
- Context provides `user`.

### Actions
1. Write `src/authz.ts` with small guards:
```ts
export function requireUser(ctx: Context) {
  if (!ctx.user) throw new GraphQLError('Not signed in', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.user;
}
export function requireRole(ctx: Context, role: Role) {
  const u = requireUser(ctx);
  if (!u.roles.includes(role)) throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
  return u;
}
```
2. Apply by rule kind:

| Rule kind | Where to check |
|---|---|
| Role on a root field | first line of the root resolver: `requireRole(ctx, 'ADMIN')` |
| Owner of an object | in the data access function, filter by owner: `WHERE id = $1 AND customer_id = $2`; return `null` when not found or not owned |
| List of owned objects | always filter in the query by the caller; never fetch all and filter in JavaScript |
| Sensitive field on an allowed object (`Customer.email`) | field resolver checks role or ownership; return `null` (field must be nullable per R3) or throw `FORBIDDEN` |

3. `node(id:)` reaches every type: route it through the same per-type loaders that apply ownership, so `node(id: "Order:91")` cannot bypass `Query.order` rules.
4. Return `null` for "not yours" on lookups instead of `FORBIDDEN` when revealing existence is itself a leak; record the choice per rule.
5. DataLoader caches: loaders are per request, so cached objects never cross users. Do not key a shared cache (Redis) by object id alone for owner-filtered data; include the user or tenant.
6. graphql-shield or directive-based auth are alternatives; if the project already uses one, enforce the same table there instead of mixing two systems.

### Output
Guards applied.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- For each rule row, `grep -n` finds the guard or owner filter in the named resolver or data function.

---

## Phase 3: Test Every Rule Row

### Entry Criteria
- Guards applied.

### Actions
1. For each rule row write tests with three callers: anonymous, allowed user, other user (or role). Execute real operations through the server (Apollo `server.executeOperation(..., { contextValue })`, Yoga `yoga.fetch`).
2. Assert codes: anonymous gets `UNAUTHENTICATED` (or `null` for public-with-null rules); other user gets `FORBIDDEN` or `null` as the row says; allowed user gets data.
3. Include a `node(id:)` test with another user's id.
4. Run `npx vitest run` (or `npx jest`).

### Output
`authz_code`, `authz_tests`.

### Quality Gate
- Test count is at least 3 times the number of non-public rule rows.
- Test run exits 0 with no skipped tests.

---

## Worked Example

Illustrative only.

`access_rules`: `Query.order` owner; `Customer.email` owner or `SUPPORT`; `Mutation.refundOrder` role `SUPPORT`.

Phase 2: `orders.findForCustomer(id, ctx.user.id)` runs `WHERE id = $1 AND customer_id = $2`; `refundOrder` starts with `requireRole(ctx, 'SUPPORT')`.

Phase 3 run:
```
 ✓ order: anonymous -> UNAUTHENTICATED
 ✓ order: other customer -> null
 ✓ order: owner -> data
 ✓ node(id) other customer -> null
 ✓ refundOrder: customer -> FORBIDDEN
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

---

## Exit Criteria

DONE when every schema coordinate has a rule, every rule is enforced in a resolver or data function, and each rule has passing tests for allowed, denied and anonymous callers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Coordinates with no rule | **Return**: ask the user; do not mark them public. |
| Phase 2 | Owner filter applied after fetching all rows | **Adjust**: move the filter into the SQL WHERE clause. |
| Phase 3 | `node(id:)` test returns another user's data | **Stop**: route `node` through owner-filtered loaders before anything else. |
| Phase 3 | Tempted to loosen a rule to make a test pass | **Stop**: the rule table is the user's; report the conflict instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
