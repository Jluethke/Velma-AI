# GraphQL Nullability Review

**One-line description:** Decides `!` (non-null) for every field, argument, list and list item in the SDL with a fixed decision table based on how GraphQL propagates nulls on error, and records why for each one.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `schema_sdl` (string, required): Path to the draft `schema.graphql`.
- `existing_data_model` (string, optional): Storage schema used to confirm NOT NULL constraints.

---

## Outputs

- `nullable_schema` (string): Path to the schema with nullability applied.
- `nullability_decisions` (object[]): One row per field or argument: coordinate (`Type.field` or `Type.field(arg:)`), chosen type, and the table rule that decided it.

---

## Phase 1: Learn the Propagation Rule

### Entry Criteria
- `schema_sdl` builds with `buildSchema`.

### Actions
1. Read this rule, from the GraphQL spec section "Handling Field Errors": when a resolver for a non-null field throws or returns null, the null propagates to the nearest nullable parent field. If no parent is nullable, the whole `data` becomes `null`.
2. Consequence: a `!` on a field that can fail (network call, other service, permission check) can erase sibling data the client could have shown. A missing `!` on a field that cannot fail forces every client to write null checks for nothing.
3. Second rule: changing an output field from nullable to non-null is safe for clients; changing it from non-null to nullable is breaking. For input fields and arguments it is the reverse: required to optional is safe, optional to required is breaking. So when unsure on output, start nullable; when unsure on input, start optional only if a default exists.

### Output
Rules understood; no file changes.

### Quality Gate
- The decision table in Phase 2 is used for every row (each row in `nullability_decisions` cites a rule id R1 to R9).

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Phase 1 complete.

### Actions
1. List every field and argument coordinate. With graphql-js: `node -e "const {buildSchema,isObjectType,isInputObjectType}=require('graphql');const s=buildSchema(require('fs').readFileSync('schema.graphql','utf8'));for(const t of Object.values(s.getTypeMap())){if(t.name.startsWith('__'))continue;if(isObjectType(t)||isInputObjectType(t))for(const f of Object.values(t.getFields())){console.log(t.name+'.'+f.name);for(const a of f.args||[])console.log(t.name+'.'+f.name+'('+a.name+':)')}}"`.
2. Decide each coordinate with this table. Take the first rule that matches.

| Rule | Coordinate | Decision |
|---|---|---|
| R1 | `id` on any type | `ID!` |
| R2 | Root `Query` field that looks up by id or key (`node`, `order(id:)`) | nullable: not found is a normal result |
| R3 | Output field resolved from another service, cache, or an authorization check that can deny | nullable |
| R4 | Output field read from the same row as the parent, NOT NULL in storage, and with no per-field permission | non-null |
| R5 | Output list of items from one query (`[Order]`) | `[Order!]!` when R4 holds for the list source; otherwise `[Order]` |
| R6 | Mutation root field returning a payload | non-null payload `CancelOrderPayload!` only when the resolver never fails without throwing; otherwise nullable |
| R7 | Payload field that holds the changed entity | nullable (a failed mutation returns `null` here plus an error or user error) |
| R8 | Argument or input field the operation cannot run without | non-null (`ID!`) |
| R9 | Argument or input field with a sensible server default | nullable with a default value in SDL (`first: Int = 20` only if the default is a user-supplied product decision; otherwise no default) |

3. If `existing_data_model` is given, confirm R4 by reading the column definition. If the column allows NULL, R4 does not apply.
4. Write each decision to `nullability_decisions` with its rule id.

### Output
Complete `nullability_decisions`.

### Quality Gate
- Row count in `nullability_decisions` equals the line count printed by the listing command in action 1.
- Every row has a rule id.

---

## Phase 3: Apply and Verify

### Entry Criteria
- Decisions complete.

### Actions
1. Copy `schema.graphql` to `schema.nullable.graphql` and edit only the type markers there, following the decisions. Do not rename or add fields in this flow.
2. Rebuild: `node -e "require('graphql').buildSchema(require('fs').readFileSync('schema.nullable.graphql','utf8'));console.log('ok')"`.
3. Revalidate operations: `npx @graphql-inspector/cli validate "operations/*.graphql" schema.nullable.graphql`. A non-null argument the operation does not pass produces `Field "x" argument "y" of type "Int!" is required`; fix the operation variable type (`$y: Int!`) or revisit the rule.
4. Diff the two files with `npx @graphql-inspector/cli diff schema.graphql schema.nullable.graphql` and confirm every change listed is a type change, not an add or remove.
5. Set `nullable_schema` to the new path.

### Output
`nullable_schema`, `nullability_decisions`.

### Quality Gate
- Build prints `ok`.
- Inspector validate exits 0.
- The diff output contains only "changed type" entries (no "added" or "removed" field lines).

---

## Worked Example

Illustrative only.

| Coordinate | Decision | Rule |
|---|---|---|
| `Order.id` | `ID!` | R1 |
| `Query.node(id:)` | `ID!` | R8 |
| `Query.node` | `Node` | R2 |
| `Order.number` | `String!` (column `number text NOT NULL`) | R4 |
| `Order.shippingEta` | `DateTime` (from carrier API) | R3 |
| `Viewer.orders` | `[Order!]!` before pagination | R5 |
| `CancelOrderPayload.order` | `Order` | R7 |

Phase 3 diff excerpt: `Field 'Order.number' changed type from 'String' to 'String!'`. Validate exits 0.

---

## Exit Criteria

DONE when every field and argument has a recorded rule-based decision, the new schema builds, and all operations still validate.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | No storage schema to confirm R4 | **Adjust**: treat R4 as not matching (nullable) and list the field as an open question. |
| Phase 3 | Diff shows added or removed fields | **Retry**: revert to the copy and reapply only type markers. |
| Phase 3 | Operation fails on a new required argument | **Adjust**: update the operation variable to non-null if the client always has the value; otherwise change the argument back under R9. |
| Any | Tempted to mark everything non-null "for type safety" | **Stop**: apply R3; a failing non-null field nulls its parent. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
