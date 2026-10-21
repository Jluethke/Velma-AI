# GraphQL Schema Lint With graphql-eslint

**One-line description:** Lints the SDL and the operation documents with `@graphql-eslint/eslint-plugin` (schema and operations recommended configs plus the Relay rules) and fixes each reported rule violation one at a time until ESLint exits 0.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `paginated_schema` (string, required): Schema path with connection types.
- `operation_documents` (string, required): Directory of operation files.

---

## Outputs

- `validated_schema` (string): Path to the final `schema.graphql` that passes lint and operation validation. All server flows read this file.
- `lint_report` (object[]): Rule violations found on the first run, each with rule id, file, line, and the fix applied.

---

## Phase 1: Install and Configure

### Entry Criteria
- Node.js 18 or newer: `node --version`.

### Actions
1. Copy the schema to its final name: `cp schema.paginated.graphql schema.graphql` (keep the earlier files untouched for history).
2. Install: `npm i -D eslint @graphql-eslint/eslint-plugin graphql`.
3. Create `eslint.config.mjs` (flat config). Check the plugin README for your installed major version; for v4 the shape is:
```js
import graphqlPlugin from '@graphql-eslint/eslint-plugin';
export default [
  { files: ['schema.graphql'], languageOptions: { parser: graphqlPlugin.parser },
    plugins: { '@graphql-eslint': graphqlPlugin },
    rules: { ...graphqlPlugin.configs['flat/schema-recommended'].rules,
             ...graphqlPlugin.configs['flat/schema-relay'].rules } },
  { files: ['operations/**/*.graphql'], languageOptions: { parser: graphqlPlugin.parser },
    plugins: { '@graphql-eslint': graphqlPlugin },
    rules: graphqlPlugin.configs['flat/operations-recommended'].rules },
];
```
4. Create `graphql.config.yml` so operation rules can see the schema:
```yaml
schema: schema.graphql
documents: operations/**/*.graphql
```
5. Do NOT turn rules off to get a clean run. A rule may be disabled only with a written reason in `lint_report` (for example `require-description` on generated scalars).

### Output
Lint tooling configured.

### Quality Gate
- `npx eslint --print-config schema.graphql` prints a JSON config that contains `@graphql-eslint/relay-connection-types`.

---

## Phase 2: Run and Fix

### Entry Criteria
- Config in place.

### Actions
1. Run `npx eslint schema.graphql "operations/**/*.graphql"`. Each line shows `line:col  error  message  @graphql-eslint/<rule>`.
2. Save the full first-run output into `lint_report`.
3. Fix violations in this order, rerunning after each rule group:

| Rule | Typical fix |
|---|---|
| `relay-connection-types`, `relay-edge-types`, `relay-page-info`, `relay-arguments` | Correct the connection shape to the spec (see `gql-relay-connection-schema`) |
| `strict-id-in-types` | Give the type an `id: ID!` or add it to the rule's exceptions with a reason |
| `naming-convention` | Rename to PascalCase types, camelCase fields, UPPER_CASE enum values |
| `require-description` | Add `"""..."""` above the named type or field |
| `require-deprecation-reason` | Add `reason:` to every `@deprecated` |
| `no-typename-prefix` | Remove the type name from field names (`Order.orderNumber` to `Order.number`) |
| operations: `no-unused-fragments`, `known-type-names`, `fields-on-correct-type` | Fix the one operation file named |

4. Change one file at a time, then rerun. If a schema rename breaks an operation, update the operation in the same step and rerun both.
5. Rerun inspector validation: `npx @graphql-inspector/cli validate "operations/**/*.graphql" schema.graphql`.

### Output
Lint-clean schema and operations.

### Quality Gate
- `npx eslint schema.graphql "operations/**/*.graphql"; echo $?` prints `0` as its last line.
- Inspector validate exits 0.

---

## Phase 3: Record and Wire Into CI

### Entry Criteria
- Lint exit 0.

### Actions
1. Add an npm script: `"lint:graphql": "eslint schema.graphql \"operations/**/*.graphql\""`.
2. Add a CI step that runs `npm run lint:graphql` on every pull request.
3. Complete each `lint_report` row with the fix applied.
4. Set `validated_schema` to the absolute path of `schema.graphql`.

### Output
`validated_schema`, `lint_report`.

### Quality Gate
- `npm run lint:graphql` exits 0.
- Every `lint_report` row has a fix or a written disable reason.

---

## Worked Example

Illustrative only.

First run excerpt:
```
schema.graphql
  14:6  error  Type "OrderEdge" must contain a field "cursor" that return either String, Scalar, or a non-null wrapper  @graphql-eslint/relay-edge-types
  22:3  error  Field "orderNumber" starts with the name of the parent type "Order"  @graphql-eslint/no-typename-prefix
```
Fixes: added `cursor: String!` to `OrderEdge`; renamed `orderNumber` to `number` and updated `operations/CustomerOrders.graphql`. Rerun: no output, exit 0.

---

## Exit Criteria

DONE when ESLint and inspector validation both exit 0 on the final `schema.graphql` and operations, and the lint script is in CI.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `configs['flat/schema-relay']` is undefined | **Adjust**: your plugin version names configs differently; print `Object.keys(graphqlPlugin.configs)` and use the matching key. |
| Phase 2 | Rule message is unclear | **Adjust**: read the rule page in the plugin docs for that rule id; do not guess. |
| Phase 2 | Fixing one rule creates violations elsewhere | **Retry**: revert that single change, apply the fix plus the dependent operation edit together, rerun. |
| Phase 2 | Tempted to add `// eslint-disable` or delete the operation | **Stop**: fix the source; disables need a recorded reason. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
