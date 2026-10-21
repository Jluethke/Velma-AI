# Ledger Node Integer Cents Money

**One-line description:** Implements JavaScript and TypeScript money as integer minor units (safe-integer `number` or `bigint`) or dinero.js objects, removes `parseFloat`, `toFixed` and `Math.round` from money paths, and fixes the node-postgres and JSON boundaries.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the Node.js or TypeScript project.
- `money_representation_spec` (object, required): Output of `ledg-money-representation-decision`.

---

## Outputs

- `node_money_module` (object): Path of the money module, chosen representation (`safe-integer`, `bigint` or `dinero`), boundary fixes made (file and line), ESLint rules added, and the passing test command with its summary.

---

## Phase 1: Pick and Write the Representation

### Entry Criteria
- `money_representation_spec` lists node types.
- `node --version` and the project's test runner (`npx vitest --version` or `npx jest --version`) run.

### Actions
1. Choose with this table:

| Condition from the spec | Representation |
|---|---|
| Largest expected amount in minor units is at or below `Number.MAX_SAFE_INTEGER` (9007199254740991) and no sub-unit math | `number` integer, checked with `Number.isSafeInteger` on every create and every result |
| Amounts can exceed the safe range, or the database column is `bigint` and you want no range check | `bigint` |
| Many currencies, allocation and formatting needed, and the team accepts a dependency | dinero.js (check the current major with `npm view dinero.js versions`; v2 API differs from v1) |

2. For `number`: write `money.ts` exporting `type Money = { readonly minor: number; readonly currency: string }` and a `money(minor, currency)` factory that throws `RangeError` if `!Number.isSafeInteger(minor)`. `add` and `subtract` re-check the result with `Number.isSafeInteger`.
3. For `bigint`: store `minor: bigint`. `bigint` and `number` cannot mix (`TypeError: Cannot mix BigInt and other types, use explicit conversions`), which is a useful guard. `bigint` division truncates toward zero, so never use `/` on money; use the allocation function from `ledg-allocate-remainder`.
4. For dinero.js v2: `dinero({ amount: 1999, currency: USD })` with `USD` imported from the `@dinero.js/currencies` package; the `amount` is already in minor units. Confirm export names (`add`, `allocate`, `toDecimal` or `toSnapshot`) against the docs for the installed version before writing code.
5. Parsing: write `parseDecimalString(s, currency)` that splits on `.` with a regex such as `/^(-)?(\d+)(?:\.(\d+))?$/`, rejects more fractional digits than the exponent, and builds the integer from the digit strings. Never call `parseFloat` or `Number(s) * 100`; `1.15 * 100` is `114.99999999999999`.

### Output
`money.ts` with factory, arithmetic and parser.

### Quality Gate
- A unit test asserts `parseDecimalString('1.15','USD')` returns minor `115` and `parseDecimalString('1.155','USD')` throws.
- A unit test asserts creating money with `0.5` minor throws (`number` path) or a `TypeError` on mixing (`bigint` path).

---

## Phase 2: Fix the Boundaries

### Entry Criteria
- Phase 1 tests pass.

### Actions
1. node-postgres (`pg`) returns `bigint` (OID 20) and `numeric` (OID 1700) as strings by default. Keep strings and parse them with your parser, or register `pg.types.setTypeParser(20, (v) => BigInt(v))` once at startup for the `bigint` path. Never register `parseFloat` for OID 1700.
2. JSON: `JSON.stringify` on a `bigint` throws `TypeError: Do not know how to serialize a BigInt`. Serialize money as strings in a `toJSON` method or a replacer. On input, accept strings only and reject JSON numbers for money fields in your schema validator (for example a zod `z.string().regex(...)`).
3. Replace display rounding: `(1.005).toFixed(2)` returns `"1.00"` because the stored double is below 1.005. Format from integers with `Intl.NumberFormat(locale, { style: 'currency', currency })` given `minor / 10 ** exponent` only at render time, and only for display; never parse the formatted string back.
4. `Math.round` rounds half toward positive infinity (`Math.round(-2.5)` is `-2`), so it is wrong for money rounding of negatives. Replace with the rounding helper from `ledg-rounding-policy`.
5. Walk each node migration item in the spec, one file at a time, running the test suite after each.

### Output
Boundary fixes list.

### Quality Gate
- `rg -n --type ts --type js -e parseFloat -e 'toFixed\(' -e 'Math\.round'` returns no hit classified as money.
- The test command exits 0.

---

## Phase 3: Enforce With Lint

### Entry Criteria
- Phase 2 suite passes.

### Actions
1. In the ESLint config, add `no-restricted-globals` for `parseFloat` and `no-restricted-properties` for `Number.parseFloat` and `Math.round`, scoped with an `overrides`/`files` block to the money and billing directories.
2. Add `no-restricted-syntax` with selector `CallExpression[callee.property.name='toFixed']` and a message pointing to `money.ts`.
3. Run `npx eslint <money dirs>` and fix each error in code; do not add `eslint-disable` comments.
4. Run the full test command and record the summary.

### Output
`node_money_module`.

### Quality Gate
- `npx eslint <money dirs>` exits 0.
- `rg -n 'eslint-disable' <money dirs>` returns no new lines compared with before Phase 3.

---

## Worked Example

Illustrative only.
```
> 0.1 + 0.2
0.30000000000000004
> 1.15 * 100
114.99999999999999
> (1.005).toFixed(2)
'1.00'
> Number.isSafeInteger(9007199254740992)
false
$ npx vitest run
 Test Files  9 passed (9)
      Tests  64 passed (64)
```
Phase 2 output lists `src/cart/total.ts:14` changed from `parseFloat(i.price)` to `parseDecimalString(i.price, 'USD').minor`.

---

## Exit Criteria

DONE when one representation is chosen by the table, money code has no float parsing or float rounding, the pg and JSON boundaries carry strings or bigint, lint enforces it, and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Max amount unknown | **Return**: ask the user; until known, choose `bigint`. |
| Phase 1 | dinero.js API names differ from this flow | **Adjust**: follow the installed version's docs; do not invent function names. |
| Phase 2 | Client sends money as JSON numbers | **Adjust**: accept strings in a new API version; log and reject numbers with more fractional digits than the exponent. |
| Phase 3 | Lint fails in generated code | **Adjust**: exclude only the generated directory by path, never the money directory. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
