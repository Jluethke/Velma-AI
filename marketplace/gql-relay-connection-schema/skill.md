# GraphQL Relay Connection Schema

**One-line description:** Replaces every paginated list field with a spec-conformant Relay Cursor Connection (Connection, Edge, PageInfo, `first`/`after`/`last`/`before`) and writes the cursor contract the resolvers must follow.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `nullable_schema` (string, required): Schema path after nullability review.
- `operation_inventory` (object[], required): Rows with `needs_pagination` flags.

---

## Outputs

- `paginated_schema` (string): Path to the schema with connection types.
- `cursor_spec` (object[]): One row per connection field: field coordinate, sort key columns in order, sort direction, tie-breaker column, cursor encoding.

---

## Phase 1: Select Connection Fields

### Entry Criteria
- `nullable_schema` builds.

### Actions
1. From `operation_inventory`, take every operation with `needs_pagination: true` and find the list field it paginates (for example `Viewer.orders`).
2. Every list field with `needs_pagination: true` becomes a connection. List fields with a documented hard bound (for example the 7 days of a week) stay plain lists.
3. For each connection field, ask the use case owner for the sort order the screen shows. Record the sort key columns and the direction. Always append a unique tie-breaker column (normally the primary key) as the last sort key, so the order is total and cursors are stable.

### Output
Connection field list with sort keys.

### Quality Gate
- Every `needs_pagination: true` operation maps to exactly one connection field.
- Every row's last sort key is a unique column.

---

## Phase 2: Write Connection Types

### Entry Criteria
- Connection field list exists.

### Actions
1. Add `PageInfo` once, exactly as the Relay Cursor Connections spec defines it:
```graphql
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```
2. For each node type `X`, add:
```graphql
type XEdge { cursor: String! node: X! }
type XConnection { edges: [XEdge!]! pageInfo: PageInfo! }
```
The spec requires the Connection name to end in `Connection`, the edge to have `node` and `cursor`, and `pageInfo: PageInfo!`.
3. Replace each list field with the connection and the four spec arguments: `orders(first: Int, after: String, last: Int, before: String): OrderConnection!`. If the client never pages backward (no "previous" button in any use case), you may omit `last` and `before`; record that choice in `cursor_spec`.
4. Do NOT add `totalCount` unless a use case displays a total. Counting needs a separate `COUNT(*)` query on every request.
5. Optional, when a screen needs it: add `nodes: [X!]!` next to `edges` as a shortcut. It is not in the spec; record it.

### Output
Draft `paginated_schema`.

### Quality Gate
- `node -e "require('graphql').buildSchema(require('fs').readFileSync('schema.paginated.graphql','utf8'));console.log('ok')"` prints `ok`.
- `grep -c "Connection!" schema.paginated.graphql` is at least the number of connection fields.

---

## Phase 3: Write the Cursor Contract

### Entry Criteria
- Draft schema builds.

### Actions
1. For each connection, fill a `cursor_spec` row: field, sort keys with direction, tie-breaker, and encoding `base64url(JSON array of sort key values)`, for example `base64url('["2026-10-01T10:00:00Z","ord_91"]')`.
2. Write the opacity rule into the row: clients must treat cursors as opaque strings. Never encode an offset (`OFFSET 40`) into a cursor; offsets skip or repeat rows when rows are inserted between requests.
3. Write the argument rules from the spec into the row so the resolver flow implements them: negative `first` or `last` is an error; `first` and `last` together are allowed by the spec but discouraged, so reject the pair with a `BAD_USER_INPUT` error unless a use case needs it; a page size cap is a user input (`max_page_size`), not a number chosen here.
4. Update operation documents to the final argument names and revalidate: `npx @graphql-inspector/cli validate "operations/*.graphql" schema.paginated.graphql`.
5. Run the graphql-eslint Relay rules if available (`relay-connection-types`, `relay-edge-types`, `relay-page-info`, `relay-arguments`); the lint flow runs them formally.

### Output
`paginated_schema`, `cursor_spec`.

### Quality Gate
- Validate exits 0.
- Every `cursor_spec` row has sort keys, a tie-breaker and an encoding.

---

## Worked Example

Illustrative only.

Input: `CustomerOrders` with `needs_pagination: true`; screen sorts newest first.

Phase 1: `Viewer.orders`, sort keys `placed_at DESC, id DESC`.

Phase 2:
```graphql
type OrderEdge { cursor: String! node: Order! }
type OrderConnection { edges: [OrderEdge!]! pageInfo: PageInfo! }
type Viewer { orders(first: Int, after: String): OrderConnection! }
```
(`last`/`before` omitted: no previous-page button in UC-01, recorded.)

Phase 3 `cursor_spec` row: `{ field: "Viewer.orders", keys: ["placed_at DESC", "id DESC"], tie_breaker: "id", encoding: "base64url(JSON [placed_at, id])", backward: false }`. Validate exits 0.

---

## Exit Criteria

DONE when every paginated list is a spec-shaped connection, the schema builds, operations validate, and each connection has a cursor contract.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sort order unknown | **Return**: ask the use case owner; do not default to id order silently. |
| Phase 1 | Sort key not unique and no primary key available | **Stop**: a stable cursor needs a unique tie-breaker; record as a data model defect. |
| Phase 2 | Existing clients already use the plain list field | **Adjust**: add the connection under a new field name and deprecate the old one with `gql-field-deprecation-rollout`. |
| Phase 3 | Validate fails on old argument names | **Retry**: update the one operation named, rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
