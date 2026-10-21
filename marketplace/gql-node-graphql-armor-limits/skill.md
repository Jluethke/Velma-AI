# Depth, Cost and Alias Limits With GraphQL Armor (Node)

**One-line description:** Adds query depth, cost, alias, directive and token limits to Apollo Server or GraphQL Yoga with `@escape.tech/graphql-armor`, sets each limit from the measured maximum of the real client operations, and proves an abusive query is rejected while every real operation passes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operation_documents` (string, required): Directory of the real client operations; limits are derived from them.
- `project_dir` (string, required): Node server root.

---

## Outputs

- `limit_config` (object): Each limit, its value, and how the value was derived.
- `limit_tests` (string): Path to tests showing real operations pass and abusive ones fail.

---

## Phase 1: Measure the Real Operations

### Entry Criteria
- `operation_documents` contains every operation the clients send (from the inventory or the persisted manifest).

### Actions
1. Write a small measuring script with graphql-js (save it outside `src/`, for example `scripts/measure-ops.mjs`):
```js
import { parse, visit } from 'graphql';
import { readFileSync, readdirSync } from 'node:fs';
for (const f of readdirSync('operations')) {
  const doc = parse(readFileSync(`operations/${f}`, 'utf8'));
  let depth = 0, max = 0, aliases = 0, directives = 0;
  visit(doc, {
    SelectionSet: { enter() { depth++; max = Math.max(max, depth); }, leave() { depth--; } },
    Field(n) { if (n.alias) aliases++; },
    Directive() { directives++; },
  });
  console.log(f, 'depth', max, 'aliases', aliases, 'directives', directives);
}
```
Fragments are not expanded by this script; if operations use fragment spreads, inline them first or count fragment depth too.
2. Count tokens per operation with the graphql-js lexer, or rely on Armor's own count in Phase 3 test output.
3. Record the maximum of each measure across all operations. These maxima are the derived limits. Depth counting conventions differ between tools by one; Phase 3 confirms against Armor's own count.

### Output
Per-operation measures and the maxima.

### Quality Gate
- The script prints one line per operation file; line count equals `ls operations | wc -l`.

---

## Phase 2: Configure Armor

### Entry Criteria
- Maxima recorded.

### Actions
1. `npm i @escape.tech/graphql-armor`.
2. Apollo Server:
```ts
import { ApolloArmor } from '@escape.tech/graphql-armor';
const armor = new ApolloArmor({
  maxDepth: { n: MAX_DEPTH },
  maxAliases: { n: MAX_ALIASES },
  maxDirectives: { n: MAX_DIRECTIVES },
  maxTokens: { n: MAX_TOKENS },
  costLimit: { maxCost: MAX_COST },
  blockFieldSuggestion: { enabled: true },
});
const protection = armor.protect();
const server = new ApolloServer({ typeDefs, resolvers, ...protection,
  plugins: [...protection.plugins, ...yourPlugins],
  validationRules: [...protection.validationRules, ...yourRules] });
```
3. Yoga: `import { EnvelopArmorPlugin } from '@escape.tech/graphql-armor'` and `createYoga({ schema, plugins: [EnvelopArmorPlugin({ maxDepth: { n: MAX_DEPTH }, ... })] })`.
4. Values: `MAX_DEPTH`, `MAX_ALIASES`, `MAX_DIRECTIVES`, `MAX_TOKENS` = the Phase 1 maxima. If you leave an option unset, Armor applies its documented default (see the Armor README; for example `maxDepth` defaults to 6 at the time of writing); record whether each limit is derived or default.
5. `MAX_COST`: run each real operation in Phase 3 with cost logging, take the maximum reported cost. Armor's `costLimit` scores with `objectCost`, `scalarCost` and `depthCostFactor` (defaults in the README); keep defaults unless a user supplies weights.
6. `blockFieldSuggestion` removes "Did you mean ...?" hints that reveal schema names when introspection is off.

### Output
Armor configured.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- Every limit in `limit_config` cites "measured max" or "Armor default" with the README section.

---

## Phase 3: Prove Limits Work

### Entry Criteria
- Server starts with Armor.

### Actions
1. Test 1: send every real operation; assert none returns an error whose message mentions depth, cost, aliases, directives or tokens.
2. Test 2: send a query one level deeper than `MAX_DEPTH` (nest a self-referencing field such as `node { ... on Order { customer { orders { edges { node { customer { ... } } } } } } }`); assert an error. Armor rejects during validation with a message naming the limit (for example `Syntax Error: Query depth limit of N exceeded`; read the actual message once and assert on a stable substring).
3. Test 3: send a query with `MAX_ALIASES + 1` aliases of `__typename`; assert rejection.
4. Run `npx vitest run`.
5. If test 1 fails for a real operation, the limit is below real traffic: raise it to that operation's measured value, never remove the operation.

### Output
`limit_config`, `limit_tests`.

### Quality Gate
- Test run exits 0 with all three test groups passing.
- No real operation was removed from `operations/`.

---

## Worked Example

Illustrative only.

Phase 1 output:
```
CustomerOrders.graphql depth 5 aliases 0 directives 0
OrderDetail.graphql depth 4 aliases 0 directives 1
CancelOrder.graphql depth 3 aliases 0 directives 0
```
`limit_config`: `maxDepth 5 (measured)`, `maxAliases`: measured 0, user chose Armor default (recorded), `maxDirectives 1 (measured)`.

Phase 3: depth-6 query returns `{"errors":[{"message":"Syntax Error: Query depth limit of 5 exceeded, found 6.","extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}}]}` (message text varies by version). `Tests 5 passed`.

---

## Exit Criteria

DONE when every limit is derived from real operations or a documented default, all real operations pass, and over-limit queries are rejected in tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Operations directory is incomplete | **Return**: generate the full list from the persisted manifest or client code first. |
| Phase 2 | Apollo plugins from Armor are overwritten | **Adjust**: spread `protection.plugins` into your own `plugins` array as shown. |
| Phase 3 | Real operation rejected | **Adjust**: set the limit to that operation's measured value; rerun all tests. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
