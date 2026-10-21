# Enable noImplicitAny

**One-line description:** Turns on `noImplicitAny` and drives its error classes (TS7005, TS7006, TS7031, TS7034, TS7053 and relatives) to zero with written types, working one directory per commit in conversion order, without adding a single explicit `any`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `ts_converted_files` (object[], optional): From `tsm-ts-convert-file`. When absent (the codebase was already TypeScript), the directory order comes from the by-file counts in this flow's Phase 1.

---

## Outputs

- `ts_noimplicitany_result` (object): Error count by code before and after, the commits made per directory, the final `tsconfig.json` diff, the number of explicit `any` added (must be 0), and every `@ts-expect-error -- BUG:` line added.

---

## Phase 1: Measure With the Flag On

### Entry Criteria
- `npx tsc --noEmit -p tsconfig.json` exits 0 with the flag off. If not, the remaining errors belong to earlier flows; finish those first.

### Actions
1. Set `"noImplicitAny": true` in `tsconfig.json` (if `"strict": true` is already set, `noImplicitAny` is on unless explicitly `false`; remove that `false`).
2. Run `npx tsc --noEmit -p tsconfig.json --pretty false > .typecheck-logs/nia.txt`.
3. Count by code and by directory:
   - `grep -o "error TS7[0-9]*" .typecheck-logs/nia.txt | sort | uniq -c | sort -rn`
   - `grep "error TS" .typecheck-logs/nia.txt | cut -d"(" -f1 | xargs -n1 dirname | sort | uniq -c | sort -rn`
4. Decide how to land the flag with this table:

   | Total TS7xxx errors after step 2 | Plan |
   |---|---|
   | 0 | Commit the flag now. Done. |
   | Non-zero and the user accepts one long-lived branch | Keep the flag on in the branch and fix directory by directory. |
   | Non-zero and the main branch must stay green between commits | Revert the flag; fix directory by directory with the flag on only in a probe config `tsconfig.nia.json` (`extends` plus the flag); commit the flag after the last directory. |

### Output
Error inventory and the landing plan.

### Quality Gate
- The by-code counts sum to the total `error TS` line count.
- The chosen plan row is recorded.

---

## Phase 2: Fix Errors by Class

### Entry Criteria
- Phase 1 inventory exists.

### Actions
1. Pick the first directory in conversion order (or the directory with the most errors when there is no order). Fix only files in that directory in this pass.
2. Apply the fix for each code. Never write `any`; never write `as` to silence an error.

   | Code | Message starts with | Fix |
   |---|---|---|
   | TS7006 | Parameter 'x' implicitly has an 'any' type | Annotate the parameter. For callbacks passed to a typed function, the error usually means the outer function is untyped; type the outer function and the callback parameter is inferred. |
   | TS7031 | Binding element 'x' implicitly has an 'any' type | Annotate the whole destructured parameter: `({ id, name }: User)`. |
   | TS7005 / TS7034 | Variable 'x' implicitly has an 'any' type / in some locations | Declare with a type at creation: `const rows: Row[] = []`, `let timer: ReturnType<typeof setTimeout> \| undefined`. |
   | TS7053 | Element implicitly has an 'any' type because expression of type 'string' can't be used to index type | Narrow the key to the real key union: `key as keyof typeof table` is an assertion and is banned; instead type the key parameter as `keyof typeof table`, or type the object as `Record<string, V>` when any string is valid, or check with `if (key in table)`. |
   | TS7016 | Could not find a declaration file for module | Run `tsm-ts-declaration-files`; do not fix here. |
   | TS7008 / TS7018 | Member or object literal property implicitly has an 'any' type | Initialize with a typed value or annotate the member. `null` initializers need `T \| null`. |
   | TS7010 / TS7011 / TS7023 / TS7024 | Function or function expression implicitly has an 'any' return type | Annotate the return type; this usually appears in recursive functions. |
   | TS7041 | The containing arrow function captures the global value of 'this' | Change the arrow to a method or type `this` explicitly. |

3. When the right type is unclear, find it from the callers: `grep -rn "functionName(" src` and read what they pass. If callers pass different shapes, write a union of the shapes seen, not `any`, and record the function for `tsm-ts-eliminate-any` review.
4. After each directory: run the full project check and count TS7xxx errors in that directory (`grep "^src/lib/" .typecheck-logs/nia.txt | grep -c "error TS7"`). It must be 0. Run `test_command`. Commit with message `types(noImplicitAny): src/lib`.
5. Repeat for the next directory.

### Output
All directories fixed.

### Quality Gate
- `npx tsc --noEmit -p tsconfig.json --pretty false | grep -c "error TS7"` prints 0 with the flag on.
- `git diff <start-commit>..HEAD | grep -E "^\+.*(: any\b|<any>|as any\b)"` prints nothing.
- Test results equal the intake baseline after each commit.

---

## Phase 3: Land the Flag

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. If the probe-config plan was used, set `"noImplicitAny": true` in `tsconfig.json` and delete `tsconfig.nia.json`.
2. Run the full check: zero errors of any code. Commit `types: enable noImplicitAny`.

### Output
`ts_noimplicitany_result`.

### Quality Gate
- `npx tsc --showConfig -p tsconfig.json | grep noImplicitAny` shows `true`, or `strict` is `true` with no `"noImplicitAny": false` override.
- `npx tsc --noEmit -p tsconfig.json` exits 0.

---

## Worked Example

Illustrative only. Express service, flag added, 311 errors (TS7006 x 204, TS7031 x 58, TS7053 x 31, TS7005 x 18). Main must stay green, so the probe plan is used.

Phase 2, `src/lib/`:
```
src/lib/cache.ts(14,22): error TS7006: Parameter 'key' implicitly has an 'any' type.
src/lib/rates.ts(9,10): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ USD: number; EUR: number; }'.
```
`cache.ts`: callers pass strings, so `key: string`. `rates.ts`: `function rate(code: string)` becomes `function rate(code: keyof typeof RATES)`; one caller passed user input, so that caller now fails; it is a boundary, marked `// TODO(tsm-ts-zod-boundaries)` and narrowed with `if (code in RATES)`. Directory count 0, tests pass, commit. After 9 directories the flag lands; tsc exits 0.

---

## Exit Criteria

DONE when `noImplicitAny` is on in the committed config, tsc exits 0, and the migration added zero explicit `any` and zero type assertions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Non-TS7xxx errors appear when the flag turns on | **Adjust**: TS7016 resolution exposes new library types; handle with `tsm-ts-declaration-files` first. |
| Phase 2 | The only way to compile seems to be `any` | **Return**: record the location as an open question with the shapes seen; leave it unfixed rather than add `any`. |
| Phase 2 | A fix changes runtime behavior | **Stop**: revert; this flow changes only annotations and type-level code. |
| Phase 3 | CI tsc version differs and reports extra errors | **Adjust**: pin the same `typescript` version in CI; see `tsm-ts-ci-gate`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
