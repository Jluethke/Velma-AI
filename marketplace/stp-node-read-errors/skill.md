# Read TypeScript Compiler, Jest/Vitest and Node Runtime Errors Correctly

**One-line description:** Reads a failing Node or TypeScript run by its format (`tsc` `file(line,col): error TSxxxx`, vitest/jest `FAIL` blocks with Expected/Received, Node `ERR_*` codes and stack frames), maps the TS error code or runtime error to a cause class with a fixed table, and names the single next action.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `verify_result` (object, required): From `stp-run-verify-capture`, with `all_passed` false.
- `applied_edit` (object, required): From `stp-apply-one-edit`.

---

## Outputs

- `node_error_diagnosis` (object): `{ "tool": "tsc"|"vitest"|"jest"|"node"|"eslint", "code": str, "message": str, "location": "file:line:col", "in_edited_hunk": bool, "cause_class": "EDIT_TEXT_WRONG"|"API_WRONG"|"PLAN_WRONG"|"TEST_SELECTOR_WRONG"|"ENVIRONMENT"|"EXPECTED_INTERMEDIATE", "evidence_lines": [str], "next_action": str }`.

---

## Phase 1: Parse the First Error by Tool Format

### Entry Criteria
- At least one run in `verify_result.runs` has a non-zero exit code.

### Actions
1. Open the log of the first failing run (lowest level).
2. Identify the format:

| Format | Example | Read |
|---|---|---|
| tsc plain | `src/price.ts(12,5): error TS2339: Property 'toCurrency' does not exist on type 'number'.` | file, line, column, code, message |
| tsc pretty | `src/price.ts:12:5 - error TS2339: Property ...` followed by the source line and `~~~` under the span | same |
| vitest | `FAIL  src/price.test.ts > formatPrice > formats zero` then `AssertionError: expected '' to be '$0.00'` and a code frame with `>` on the failing line | test path, assertion, location line `❯ src/price.test.ts:9:30` |
| jest | `● formatPrice › formats zero` then `expect(received).toBe(expected)`, `Expected: "$0.00"`, `Received: ""`, and `at Object.<anonymous> (src/price.test.ts:9:30)` | test name, expected, received, location |
| Node runtime | `TypeError: x.map is not a function` then frames `at fn (file:///.../src/a.js:3:12)` | first frame in a repo path (not `node_modules`, not `node:internal`) |
| Node error code | `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/repo/src/util' imported from /repo/src/a.js` | the `ERR_*` code |
| ESLint | `/repo/src/price.ts` then `  12:5  error  'x' is assigned a value but never used  no-unused-vars` | line, column, rule id |

3. tsc reports many errors after one mistake. Read the FIRST error only; later ones are often consequences.
4. Set `location` and `in_edited_hunk` (true if the file is `applied_edit.file` and the line is inside the new-line range of the `@@` header in `applied_edit.diff`).

### Output
`tool`, `code`, `message`, `location`, `in_edited_hunk`.

### Quality Gate
- `message` is copied from a log line found by `rg -n -F`.
- `location` points into a repo file, not `node_modules/` or `node:internal`.

---

## Phase 2: Classify the Cause

### Entry Criteria
- Phase 1 done.

### Actions
1. Apply the first matching row:

| Signal | `cause_class` | `next_action` |
|---|---|---|
| TS1005 (`';' expected`), TS1128, TS1109, or `SyntaxError: Unexpected token` | EDIT_TEXT_WRONG | revert; fix syntax at the column shown |
| TS2304 `Cannot find name 'x'` | EDIT_TEXT_WRONG if `x` needs an import in the plan, else PLAN_WRONG | revert; add the import edit |
| TS2339 `Property 'x' does not exist on type 'T'` | API_WRONG | revert; send `T.x` to `stp-node-api-exists-check` |
| TS2345 `Argument of type 'A' is not assignable to parameter of type 'B'`, TS2322 `Type 'A' is not assignable to type 'B'` | API_WRONG if B comes from a library; PLAN_WRONG if from the repo | revert; re-read the declared type |
| TS2554 `Expected N arguments, but got M` | API_WRONG | revert; re-check the signature |
| TS2307 `Cannot find module 'm' or its corresponding type declarations` | ENVIRONMENT if `m` is a package; EDIT_TEXT_WRONG if a relative path typo | revert; stop if environment |
| TS7006 `Parameter 'x' implicitly has an 'any' type` | EDIT_TEXT_WRONG | revert; add the parameter type |
| `TypeError: x is not a function` / `Cannot read properties of undefined (reading 'y')` at a repo frame in the hunk | API_WRONG or PLAN_WRONG (API_WRONG if `x` is a library export) | revert |
| `ERR_MODULE_NOT_FOUND` for a relative import without extension in ESM | EDIT_TEXT_WRONG | revert; ESM needs the `.js` extension in relative imports |
| `ERR_REQUIRE_ESM` or `Cannot use import statement outside a module` | PLAN_WRONG | revert; match the module system of the file (`"type"` in package.json, `.mjs`/`.cjs`) |
| vitest `No test files found` / jest `No tests found, exiting with code 1` / `Tests: 0 total` | TEST_SELECTOR_WRONG | fix the file path or `-t` name on the card |
| Assertion failure (Expected/Received) predicted by `expected_signal` | EXPECTED_INTERMEDIATE | keep |
| Assertion failure not predicted | PLAN_WRONG | revert; re-read the code around `location` |
| ESLint error on a line you added | EDIT_TEXT_WRONG | revert; fix that rule violation |

2. Copy two to five proving lines into `evidence_lines`.
3. Do not "fix" a type error with `as any`, `// @ts-ignore`, `// @ts-expect-error`, a non-null `!`, or `eslint-disable`. Those hide the error; the integrity guard flags them.

### Output
`node_error_diagnosis`.

### Quality Gate
- `cause_class` is one table value and the row's signal text appears in `evidence_lines`.
- `next_action` contains none of `as any`, `ts-ignore`, `ts-expect-error`, `eslint-disable`, `.skip`, `.only`.

---

## Worked Example

Illustrative only.

E2 on `src/price.ts` used `amount.toCurrency("USD")`. L0 log (`pnpm typecheck`):

```
src/price.ts(7,17): error TS2339: Property 'toCurrency' does not exist on type 'number'.
exit=2
```

- Phase 1: `tool` tsc, `code` TS2339, `location` `src/price.ts:7:17`, inside the hunk (`@@ -7,1 +7,1 @@`).
- Phase 2: API_WRONG; `next_action` "revert E2; check `Number.prototype.toCurrency` with `stp-node-api-exists-check` (expected NOT_FOUND); use the locked `Intl.NumberFormat` form". L1 was not run because L0 failed.

---

## Exit Criteria

DONE when the diagnosis names the tool, the first error code or assertion, a repo location, whether it is in the edited hunk, one table cause class with quoted evidence, and one next action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Log shows only a summary (`Tests: 1 failed`) | **Retry**: re-run the L1 command once with the runner's verbose reporter documented in its `--help` (vitest `--reporter=verbose`) and read again. |
| Phase 1 | Stack frames point only into `dist/` or a bundle | **Adjust**: enable source maps if the runner documents it (`node --enable-source-maps`); else use the test name to find the source. |
| Phase 2 | No row matches | **Return**: `PLAN_WRONG` with the first error line. |
| Phase 2 | Error is in an untouched file | **Return**: `in_edited_hunk` false; baseline comparison happens next. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
