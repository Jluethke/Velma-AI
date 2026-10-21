# SDK Cursor Pagination

**One-line description:** Wraps cursor-paginated list endpoints (next cursor or page token plus a has-more flag) in a lazy auto-paging iterator per stack (Python generator and async generator, TypeScript async generator, Go 1.23 `iter.Seq2`), with exact stop conditions, a repeated-cursor guard and per-page access.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`; `pagination_styles.cursor` lists the operations.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `cursor_paginator` (object): Request parameter and response fields per operation, stop rule, iterator type, file path, and test results.

---

## Phase 1: Pin the Cursor Contract per Operation

### Entry Criteria
- `pagination_styles.cursor` is non-empty.

### Actions
1. For each operation, record from the spec (not from habit):
   - request parameter carrying the cursor (`cursor`, `after`, `starting_after`, `page_token`, `pageToken`);
   - page size parameter and its `maximum` (`jq '.paths["/v1/users"].get.parameters[] | select(.name=="limit") | .schema' build/openapi.json`);
   - response field holding items (`data`, `items`, `results`);
   - response field holding the next cursor (`next_cursor`, `next_page_token`), or the rule "cursor = id of last item" (Stripe-style `starting_after`);
   - has-more flag if any (`has_more`).
2. Write the stop rule per operation using this table:

| Response shape | Stop when |
|---|---|
| `next_cursor` field only | `next_cursor` is null, missing, or empty string |
| `has_more` flag plus last-item-id cursor | `has_more` is false |
| `has_more` and `next_cursor` | `has_more` is false OR `next_cursor` is empty |
| Items array empty | Always stop (defends against servers that return an empty page with a cursor) |

3. Do NOT pass a page size above the spec's `maximum`. If the user asks for a larger page, cap it and document that.

### Output
Cursor contract table.

### Quality Gate
- Every cursor operation has all five fields recorded or marked `not present`.

---

## Phase 2: Implement the Iterator

### Entry Criteria
- Contract table exists.

### Actions
1. Implement one generic paginator, used by every cursor operation:

| Stack | Shape |
|---|---|
| python sync | `class SyncCursorPage(Generic[T])` with `.data`, `.has_next_page()`, `.next_page()`, and `__iter__` that yields items across pages lazily |
| python async | `AsyncCursorPage` with `__aiter__` implemented as an `async def` generator; usage `async for user in client.users.list():` |
| typescript | `async function* paginate<T>(fetchPage: (cursor?: string) => Promise<Page<T>>): AsyncGenerator<T>`; list methods return an object that is both `await`-able for the first page and async-iterable via `[Symbol.asyncIterator]` |
| go 1.23 and later | `func (s *UsersService) ListAll(ctx context.Context, p ListUsersParams) iter.Seq2[User, error]`; usage `for u, err := range client.Users.ListAll(ctx, p) { if err != nil { ... } }`; older Go: a `Pager` with `Next(ctx) bool`, `Current() T`, `Err() error` |

2. Loop body: fetch page with current cursor; yield each item; compute next cursor; apply the stop rule; if the next cursor equals any cursor already used in this iteration, raise a pagination error instead of looping forever.
3. Keep all original filters on every page request; only the cursor changes. Losing a filter on page 2 is a common defect.
4. Lazy means the next page is fetched only when the caller consumes past the current page. Do NOT prefetch all pages into a list in the iterator.
5. Go: in `iter.Seq2`, stop immediately when `yield` returns false (caller broke out of the loop).

### Output
Paginator implementation.

### Quality Gate
- Type checker passes.
- `grep -n "yield" <paginator file>` shows the Go code checks `if !yield(` (Go only).

---

## Phase 3: Test

### Entry Criteria
- Paginator compiles.

### Actions
1. Mock three pages (2, 2, 1 items) with cursors `c1`, `c2`, then null.
2. Tests:
   - Iterating all yields 5 items in order and makes exactly 3 requests.
   - Page 2 and 3 requests carry the original filter params and the right cursor.
   - Breaking after 1 item makes exactly 1 request (lazy).
   - A server that returns the same cursor twice raises the pagination error after 2 requests.
   - Empty first page yields nothing and makes 1 request.
   - An error on page 2 surfaces to the caller after page 1 items were yielded (Go: as the `err` value of `range`).
3. Run the suite.

### Output
`cursor_paginator`.

### Quality Gate
- All six tests pass, each asserting the request count.
- Mutation check: drop filters from page 2 requests; the filter test must fail; restore.

---

## Worked Example

Illustrative only. `stack = typescript`, `GET /v1/users?limit=&cursor=&status=` returns `{ data: User[], next_cursor: string | null }`.

```ts
for await (const user of client.users.list({ status: "active", limit: 100 })) {
  console.log(user.id);
}
```
```
$ npx vitest run src/pagination/cursor.test.ts
 ✓ yields all items across 3 pages with 3 requests
 ✓ keeps filters on every page
 ✓ is lazy: break after first item makes 1 request
 ✓ throws on repeated cursor
 ✓ empty first page
 ✓ surfaces page 2 error after page 1 items
 Tests  6 passed (6)
```

---

## Exit Criteria

DONE when every cursor operation returns a lazy auto-paging iterator with a spec-derived stop rule, filter preservation, a repeated-cursor guard, and tests that assert request counts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Spec does not show the next cursor field | **Return**: ask the API owner or read the docs; do not guess field names. |
| Phase 2 | Go version below 1.23 | **Adjust**: use the `Pager` shape. |
| Phase 3 | Lazy test shows extra requests | **Adjust**: the iterator prefetches; fetch the next page only after the last item of the current page is consumed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
