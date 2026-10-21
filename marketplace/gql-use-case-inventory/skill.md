# GraphQL Use Case Inventory

**One-line description:** Turns client use cases (screens, jobs, integrations) into a numbered inventory of named GraphQL operations, each written as a real `.graphql` document, before any schema type is designed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `use_cases` (object[], required): One entry per client need: actor, screen or job name, the data shown or changed, and the action that triggers it (page load, button, webhook, cron).
- `existing_data_model` (string, optional): Path to the current database schema (SQL DDL, Prisma schema, Django models, Go structs) the service will read. Used only to name entities, never to shape the API.

---

## Outputs

- `operation_inventory` (object[]): One row per operation: operation name, type (query, mutation, subscription), owning use case, fields read, arguments, whether the result is a list, and whether it needs pagination.
- `operation_documents` (string): Path to a directory (for example `operations/`) holding one `.graphql` file per named operation.

---

## Phase 1: Normalize Use Cases

### Entry Criteria
- `use_cases` has at least one entry.

### Actions
1. Create a table with columns: `id` (UC-01, UC-02, ...), `actor`, `trigger`, `reads`, `writes`.
2. For each use case, list every piece of data the client displays or submits, in the client's words ("order total", "customer email"), not in table or column names.
3. Split any use case that both reads and writes into two rows: one read row and one write row. A page load is a read; a button that changes state is a write.
4. Mark a row as `realtime` only when the use case says the client must see changes without a reload. Everything else is request/response.
5. If `existing_data_model` is given, add a column `source_entity` naming the table or model each piece of data comes from. Do not copy column names into the API yet.

### Output
A normalized use case table with one read or write per row.

### Quality Gate
- Every row has exactly one of `reads` or `writes` non-empty.
- Every row has an `id` and a `trigger`.

---

## Phase 2: Name Operations

### Entry Criteria
- Normalized table exists.

### Actions
1. Map each row to one operation type with this table:

| Row kind | Operation type |
|---|---|
| reads, request/response | `query` |
| writes | `mutation` |
| reads, `realtime` | `subscription` (record it; implementing subscriptions is out of scope for this chain) |

2. Name each operation in PascalCase, verb first for mutations and noun first for queries: `OrderDetail`, `CustomerOrders`, `CreateOrder`, `CancelOrder`. The name must describe the client need, not the table ("CustomerOrders", not "SelectOrdersByCustomerId").
3. Mark `is_list: true` when the result can contain more than one item. Mark `needs_pagination: true` when `is_list` is true and the use case does not state a hard upper bound on item count. If the use case gives no bound, the answer is `true`.
4. List arguments the client actually has at the trigger moment (an `id` from the URL, a search string from an input box). Do not add arguments "for later".

### Output
Draft `operation_inventory` rows.

### Quality Gate
- Operation names are unique: sorting the name column and checking adjacent rows finds no duplicates.
- Every use case `id` appears in at least one operation row.

---

## Phase 3: Write Operation Documents

### Entry Criteria
- Draft inventory complete.

### Actions
1. Create the directory `operations/` in the project (or the path the team already uses).
2. Write one file per operation, named after it: `operations/CustomerOrders.graphql`. Contents: the named operation with variables and exactly the fields the screen shows.
3. For paginated lists, write the selection in Relay connection shape now (`edges { cursor node { ... } } pageInfo { hasNextPage endCursor }`) and take `$first: Int` and `$after: String` variables. The schema step will make this shape real.
4. For mutations, use one input variable and select a payload: `mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { order { id } } }`.
5. Do NOT write a schema in this flow. These documents describe demand; the next flow derives the schema from them.
6. Set `operation_documents` to the directory path and fill `operation_inventory`.

### Output
`operation_inventory`, `operation_documents`.

### Quality Gate
- `ls operations/*.graphql | wc -l` equals the number of inventory rows.
- `grep -L "^\(query\|mutation\|subscription\) " operations/*.graphql` prints nothing (every file starts a named operation).
- Each document parses: after `npm i -D graphql`, `node -e "const {parse}=require('graphql');const fs=require('fs');for(const f of fs.readdirSync('operations'))parse(fs.readFileSync('operations/'+f,'utf8'));console.log('parsed')"` prints `parsed`. A syntax error prints `GraphQLError: Syntax Error` with the line and column.

---

## Worked Example

Illustrative only.

Input `use_cases`:
- UC-01: customer opens "My orders" page, sees order number, date, total, status.
- UC-02: customer clicks "Cancel" on a pending order.

Phase 1 table: UC-01 reads (order number, date, total, status), trigger page load. UC-02 writes (order status to cancelled), trigger button.

Phase 2 rows:
| name | type | use case | is_list | needs_pagination |
|---|---|---|---|---|
| CustomerOrders | query | UC-01 | true | true (no bound given) |
| CancelOrder | mutation | UC-02 | false | false |

Phase 3 file `operations/CustomerOrders.graphql`:
```graphql
query CustomerOrders($first: Int, $after: String) {
  viewer {
    orders(first: $first, after: $after) {
      edges { cursor node { id number placedAt total { amount currency } status } }
      pageInfo { hasNextPage endCursor }
    }
  }
}
```
Gate output: `ls operations/*.graphql | wc -l` prints `2`; the parse check prints `parsed`.

---

## Exit Criteria

DONE when every use case maps to at least one named operation, every operation exists as a parsing `.graphql` file, and every list operation has a pagination decision.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A use case names no data, only a goal ("make ordering easy") | **Return**: send it back to the requester asking for the screen or job and the fields it shows. |
| Phase 2 | Two use cases produce the same operation name | **Adjust**: if the field sets are equal, merge into one operation listing both use case ids; otherwise rename by screen. |
| Phase 3 | A document fails to parse | **Retry**: fix the one file the parser names, rerun the parse check; do not edit other files in the same pass. |
| Phase 3 | Weak-model temptation to also write the schema here | **Stop**: schema design belongs to `gql-schema-sdl-draft`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
