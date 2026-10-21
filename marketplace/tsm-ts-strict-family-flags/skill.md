# Complete the strict Flag Family

**One-line description:** Sets `"strict": true` with the not-yet-clean member flags explicitly staged off, fixes each remaining member's error class (strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, noImplicitThis, useUnknownInCatchVariables, alwaysStrict, strictBuiltinIteratorReturn), and records an explicit user decision for each extra flag outside `strict`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `ts_strictnull_result` (object, required): From `tsm-ts-strictnullchecks`; confirms null checks are on everywhere.

---

## Outputs

- `ts_strict_result` (object): Final `compilerOptions` (from `tsc --showConfig`), per-flag error counts before and after, the commit per flag, and the decision (adopt, defer with reason, reject with reason) for each of `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`.

---

## Phase 1: Stage strict With Overrides

### Entry Criteria
- tsc exits 0 with `noImplicitAny` and `strictNullChecks` on.

### Actions
1. Find the strict members for the installed compiler: `npx tsc --help --all | grep -i -B1 -A1 "strict"` and read which options say they are enabled by `--strict`. Do not rely on a list from memory; TypeScript 5.6 added `strictBuiltinIteratorReturn` to the family.
2. Edit `tsconfig.json`: set `"strict": true` and add an explicit `false` for every member not yet measured clean, for example:
   ```json
   "strict": true,
   "strictFunctionTypes": false,
   "strictBindCallApply": false,
   "strictPropertyInitialization": false,
   "noImplicitThis": false,
   "useUnknownInCatchVariables": false
   ```
   Individual flags override `strict`. Remove the separate `noImplicitAny` and `strictNullChecks` lines; `strict` now covers them.
3. Run `npx tsc --noEmit -p tsconfig.json`. It must exit 0 (only clean members are on). If not, the error codes name the member that was missed; add its `false`.
4. Commit `types: enable strict with staged members`. From now on, a TypeScript upgrade that adds a new strict member turns it on automatically; `tsm-ts-ci-gate` pins the version so that happens only in a deliberate upgrade.

### Output
`strict: true` committed with staged overrides.

### Quality Gate
- `npx tsc --showConfig -p tsconfig.json` shows `"strict": true` and each staged member as `false`.
- `npx tsc --noEmit -p tsconfig.json` exits 0.

---

## Phase 2: Remove One Override at a Time

### Entry Criteria
- Phase 1 committed.

### Actions
1. Order: the member with the fewest errors first (counts from `tsm-ts-error-baseline` `per_flag`, or delete the override and count).
2. Delete one `false` line. Run tsc and fix that member's errors with this table:

   | Member | Error codes | Fix |
   |---|---|---|
   | `alwaysStrict` | Usually none; emits `"use strict"` | Check for code relying on sloppy mode (`with`, octal literals, assigning to undeclared variables). |
   | `strictBindCallApply` | TS2345, TS2554 on `.call`, `.apply`, `.bind` | Pass the arguments the function declares; the error is usually a real wrong argument. |
   | `noImplicitThis` | TS2683 `'this' implicitly has type 'any'` | Add a `this` parameter: `function handler(this: HTMLButtonElement, e: MouseEvent)`, or use an arrow function or method. |
   | `useUnknownInCatchVariables` | TS18046 `'e' is of type 'unknown'` | Narrow: `if (e instanceof Error) { log(e.message) } else { log(String(e)) }`. Never `catch (e: any)`. |
   | `strictFunctionTypes` | TS2322, TS2345 mentioning parameter types of function types | A callback type is contravariant in its parameters: a handler accepting `Dog` cannot be stored where any `Animal` may be passed. Widen the handler parameter or narrow the slot type. Method-shorthand declarations (`m(x: T): void`) stay bivariant by design; do not convert them to dodge errors. |
   | `strictPropertyInitialization` | TS2564 `Property 'x' has no initializer and is not definitely assigned in the constructor` | Initialize in the declaration or the constructor; if a framework assigns it (dependency injection, ORM), use `x!: T` with a comment naming the framework, or type it `T \| undefined` if it can really be missing. |
   | `strictBuiltinIteratorReturn` (TS 5.6+) | Errors on `iterator.next().value` being `T \| undefined` | Check `done` before reading `value`, or iterate with `for...of`. |

3. Fix one directory per commit inside a member if the count is large. Run `test_command` after each commit.
4. When the member's count is 0, commit `types: enable <member>`.
5. Repeat until no override remains.

### Output
`strict: true` with no `false` overrides.

### Quality Gate
- `npx tsc --showConfig -p tsconfig.json` shows `"strict": true` and none of its members set to `false`.
- tsc exits 0 and test results equal the intake baseline.
- `grep -rn "catch (e: any)\|catch (err: any)" src` prints nothing.

---

## Phase 3: Decide the Extra Flags

### Entry Criteria
- Phase 2 complete.

### Actions
1. These flags are not part of `strict`. Measure each in a probe config (`extends` plus the one flag) and record its error count:
   `noUncheckedIndexedAccess` (indexing `arr[i]` and `record[key]` yields `T | undefined`), `exactOptionalPropertyTypes` (`x?: T` no longer accepts an explicit `undefined`), `noImplicitOverride` (requires `override` on overriding members), `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature` (TS4111, forces `obj["key"]` for index signatures).
2. Present the counts to the user and record their decision per flag. Do not adopt any of these on your own; each changes coding style for the whole team.
3. For each adopted flag, run the same loop as Phase 2 and commit `types: enable <flag>`.

### Output
`ts_strict_result`.

### Quality Gate
- Each extra flag has a recorded count and a recorded user decision.
- Every adopted flag shows `true` in `tsc --showConfig` and tsc exits 0.

---

## Worked Example

Illustrative only. After null checks: `strictFunctionTypes` 6, `strictBindCallApply` 2, `noImplicitThis` 4, `strictPropertyInitialization` 23, `useUnknownInCatchVariables` 39.

Phase 1: strict on with five overrides; tsc exits 0; commit.

Phase 2, `useUnknownInCatchVariables`:
```
src/routes/orders.ts(88,24): error TS18046: 'err' is of type 'unknown'.
```
`res.status(500).json({ error: err.message })` becomes `const message = err instanceof Error ? err.message : String(err);`. 39 such sites across 14 files, two commits; tsc exits 0; tests pass.

Phase 3: probe counts `noUncheckedIndexedAccess` 214, `noImplicitOverride` 12, `exactOptionalPropertyTypes` 57. The user adopts `noImplicitOverride`, defers the other two; decisions recorded.

---

## Exit Criteria

DONE when `strict: true` holds with no member overrides, tsc exits 0, and every extra flag has a recorded user decision.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `tsc --help --all` lists a strict member not in this flow | **Adjust**: stage it with `false` and add a row to the Phase 2 work list. |
| Phase 2 | strictFunctionTypes errors come from a third-party type | **Adjust**: narrow the slot type in your code; do not edit files under `node_modules`. |
| Phase 2 | DI framework fields trigger TS2564 everywhere | **Return**: ask the user whether `x!: T` with a framework comment is acceptable for those classes. |
| Phase 3 | User does not answer on an extra flag | **Return**: record the flag as undecided; never adopt by default. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
