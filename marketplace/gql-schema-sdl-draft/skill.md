# GraphQL Schema SDL Draft From Operations

**One-line description:** Derives a schema-first SDL file from the named client operations, using the Node interface, input/payload mutations and standard naming rules, and proves every operation validates against it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operation_inventory` (object[], required): Operation rows from `gql-use-case-inventory`.
- `operation_documents` (string, required): Directory of `.graphql` operation files.
- `existing_data_model` (string, optional): Path to the storage schema, used only to confirm each field has a source.

---

## Outputs

- `schema_sdl` (string): Path to `schema.graphql` that every operation in `operation_documents` validates against.

---

## Phase 1: Extract Types From Selections

### Entry Criteria
- `operation_documents` exists and every file parses.

### Actions
1. For each operation file, walk the selection set and write down each object you select fields from, with its fields. Example: `node { id number placedAt }` under `orders` means type `Order` with fields `id`, `number`, `placedAt`.
2. Merge fields for the same object across all operations into one type.
3. Name types in PascalCase singular (`Order`, not `Orders` or `order_row`). Name fields in camelCase. Name enum values in SCREAMING_SNAKE_CASE (`PENDING`, `CANCELLED`).
4. For every scalar-looking field decide its type with this table:

| Data | GraphQL type |
|---|---|
| Identifier | `ID` |
| Whole number that fits in 32 bits signed | `Int` (the spec limits `Int` to 32-bit signed) |
| Whole number that can exceed 32 bits (byte counts, cents over about 21 million units) | `String` or a custom scalar such as `BigInt`; never `Int` |
| Money | an object `Money { amount: String!, currency: String! }` or a decimal custom scalar; never `Float` |
| Timestamp | custom scalar `DateTime` (RFC 3339 string) |
| Fixed set of states | an `enum` |
| Free text | `String` |

5. Leave nullability for the next flow: write every field type without `!` except `id: ID!` for now. Nullability is decided field by field in `gql-nullability-review`.

### Output
A type list with fields and scalar types.

### Quality Gate
- Every field selected in any operation file appears on exactly one type in the list.
- No `Float` is used for money and no `Int` is used for values that can exceed 2147483647.

---

## Phase 2: Write the SDL

### Entry Criteria
- Type list exists.

### Actions
1. Create `schema.graphql`. Add the scalars you used: `scalar DateTime`.
2. Add the Node interface and root lookup, following the GraphQL Global Object Identification spec: `interface Node { id: ID! }` and on `Query`: `node(id: ID!): Node`. Make every entity type `implements Node`.
3. Add each query root field the operations call, with the exact arguments they pass. Single lookups take `id: ID!`. Lists keep `first: Int, after: String` for now; the pagination flow replaces them with connection types.
4. For each mutation, write the input/payload pattern: `cancelOrder(input: CancelOrderInput!): CancelOrderPayload` with `input CancelOrderInput { orderId: ID! }` and `type CancelOrderPayload { order: Order }`. One input object and one payload type per mutation, even when the input has one field, so fields can be added later without a breaking change.
5. Add a description string (`"""..."""`) above every type and every root field, written from the use case.
6. If `existing_data_model` is given, confirm each field has a storage source or a computed rule; list any that have neither as open questions instead of inventing a source.

### Output
Draft `schema.graphql`.

### Quality Gate
- The SDL builds: `node -e "const {buildSchema}=require('graphql');buildSchema(require('fs').readFileSync('schema.graphql','utf8'));console.log('ok')"` prints `ok`.
- `grep -c "implements Node" schema.graphql` is at least the number of entity types.

---

## Phase 3: Validate Operations Against the SDL

### Entry Criteria
- `schema.graphql` builds.

### Actions
1. Run GraphQL Inspector validate: `npx @graphql-inspector/cli validate "operations/*.graphql" schema.graphql`.
2. Read the output. Each error names the file, the operation and the message, for example `Cannot query field "totl" on type "Order"`.
3. Fix one error at a time. If the operation asked for a field the schema lacks, add the field to the schema. If the operation has a typo, fix the operation. Rerun after each fix.
4. Do NOT delete an operation file to make validation pass. Every file represents a use case.
5. Set `schema_sdl` to the schema path.

### Output
`schema_sdl`.

### Quality Gate
- `npx @graphql-inspector/cli validate "operations/*.graphql" schema.graphql` exits 0 (check `echo $?`).
- `ls operations/*.graphql | wc -l` equals the count before this phase.

---

## Worked Example

Illustrative only.

Input: `operations/CustomerOrders.graphql` and `operations/CancelOrder.graphql` from the inventory example.

Phase 1 types: `Order { id, number, placedAt, total, status }`, `Money { amount, currency }`, enum `OrderStatus { PENDING, PAID, CANCELLED }`, `Viewer { orders }`.

Phase 2 excerpt:
```graphql
scalar DateTime
interface Node { id: ID! }
enum OrderStatus { PENDING PAID CANCELLED }
type Money { amount: String currency: String }
"""An order placed by a customer."""
type Order implements Node { id: ID! number: String placedAt: DateTime total: Money status: OrderStatus }
type Query { node(id: ID!): Node viewer: Viewer }
input CancelOrderInput { orderId: ID! }
type CancelOrderPayload { order: Order }
type Mutation { cancelOrder(input: CancelOrderInput!): CancelOrderPayload }
```
Phase 3 first run: `[CustomerOrders] Cannot query field "orders" on type "Viewer"`. Fix: add `type Viewer { orders(first: Int, after: String): [Order] }`. Rerun: exit 0.

---

## Exit Criteria

DONE when `schema.graphql` builds, every operation file validates against it with exit code 0, and no operation was removed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Field has no clear scalar type | **Adjust**: use `String` and record an open question naming the field. |
| Phase 2 | `buildSchema` throws `Unknown type` | **Retry**: declare the missing type or scalar, rerun. |
| Phase 3 | `@graphql-inspector/cli` fails to install | **Adjust**: validate with `graphql-js` instead: `parse` each file and run `validate(schema, doc)`; report each error. |
| Phase 3 | Validation passes only after deleting an operation | **Stop**: restore the file; fix the schema instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
