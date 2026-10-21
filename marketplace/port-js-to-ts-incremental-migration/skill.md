# Port JavaScript to TypeScript Incremental Migration

**One-line description:** Plans a file-at-a-time JavaScript to TypeScript migration in the same repository: `allowJs` and `checkJs` setup, a strictness ladder measured by `tsc` error counts, `git mv` renames that keep history, and the short list of TypeScript settings that change runtime behavior (class field semantics, enums, import elision, `esModuleInterop`) and must be pinned so the emitted JavaScript behaves exactly like the original.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the JavaScript repository at the reference commit.
- `target_repo` (string, required): Path where the TypeScript code lives; usually the same repository on a migration branch.
- `dependency_map` (object[], required): Output of `port-dependency-equivalence-map`; lists packages that need `@types/*`.

---

## Outputs

- `ts_migration_plan` (object): `tsconfig` (exact options), `runtime_affecting_options` (each with its pinned value and reason), `strictness_ladder` (ordered flags with the error count at each step), `types_packages` (the `@types/*` to install), and `per_file_procedure`.

---

## Phase 1: Install and Configure Without Changing Behavior

### Entry Criteria
- `git status --porcelain` is empty in `target_repo`; existing tests pass (`npm test`).

### Actions
1. Install: `npm install --save-dev typescript @types/node`. Add `@types/<pkg>` for each dependency in `dependency_map` that ships no types (check with `npm view <pkg> types typings`; empty output means no bundled types, then `npm view @types/<pkg> version` to see if DefinitelyTyped has them).
2. Create `tsconfig.json`:
```
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "strict": false,
    "target": "<the ES version matching your Node, for example ES2022>",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```
   Use `noEmit: true` while the original JS still runs as-is; switch to `outDir` (or a bundler) only when the build is ready to replace it.
3. Pin every option that changes emitted runtime code, and record each in `runtime_affecting_options`:

| Option or feature | Runtime effect | Rule |
|---|---|---|
| `useDefineForClassFields` | `true` (default when `target` is ES2022 or later) defines class fields with `Object.defineProperty`, which shadows a base class getter or setter of the same name; `false` uses assignment | match the JS original: native JS class fields already use define semantics; constructor assignments `this.x = ...` are not fields, so do not convert them into field declarations |
| `esModuleInterop` | changes what `import x from "cjs-module"` returns | if the JS used `require`, keep `import x = require("m")` or `import * as x`, then verify |
| `enum`, `namespace`, parameter properties | emit runtime code | do not introduce them during migration; set `erasableSyntaxOnly: true` (TypeScript 5.8+) to make the compiler reject them |
| `verbatimModuleSyntax` | imports used only as types are dropped; with this on, you must write `import type`, so side-effect imports stay | turn on; it makes elision explicit |
| `target` lower than the runtime | down-levels `async`, classes, optional chaining, with slightly different semantics in edge cases | set `target` to what the runtime supports |
| decorators | legacy `experimentalDecorators` and standard decorators emit different code | keep whatever the JS used (Babel config shows it) |

4. Run `npx tsc --noEmit -p .` and record "0 errors" as the baseline (with `checkJs: false` there should be none).

### Output
`tsconfig`, `runtime_affecting_options`, `types_packages`.

### Quality Gate
- `npx tsc --noEmit -p .` exits 0.
- `npm test` still passes with no source file changed (`git diff --stat -- src` prints nothing).

---

## Phase 2: Measure the Strictness Ladder

### Entry Criteria
- Baseline compiles.

### Actions
1. Turn on `checkJs: true` temporarily and count: `npx tsc --noEmit -p . | grep -c "error TS"`. Record the number, then set it back to `false`.
2. With `checkJs: true`, add each flag one at a time and record the count after each: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`, then `noUncheckedIndexedAccess`. Revert after measuring.
3. Count per file to decide order: `npx tsc --noEmit -p . | grep -oE "^src/[^(]+" | sort | uniq -c | sort -n`.
4. Write `strictness_ladder`: flags in the order they will be enabled for the whole project after all files are `.ts`. Rule: enable the flag with the fewest errors first.

### Output
`strictness_ladder` with counts.

### Quality Gate
- Every count was produced by a `tsc` run, with the command recorded.
- `tsconfig.json` is back to the Phase 1 content (`git diff tsconfig.json` shows no change from the committed baseline).

---

## Phase 3: Define the Per-File Procedure

### Entry Criteria
- Ladder measured.

### Actions
1. Write `per_file_procedure`, executed for one file per commit, in `port-file-order-plan` order (leaves first):
   1. `git mv src/foo.js src/foo.ts` and commit the rename alone ("rename foo.js to foo.ts") so `git log --follow` keeps history.
   2. Add types to the file only: parameter and return types on exported functions, interfaces for object shapes. Do not change any expression.
   3. Fix errors without changing behavior. Allowed: type annotations, type guards that already exist as runtime checks, `as` casts with a `// reason:` comment. Not allowed: changing `==` to `===`, reordering code, replacing `||` with `??` (these change behavior and belong in a separate, tested commit).
   4. `npx tsc --noEmit -p .` must report zero errors for the file: `npx tsc --noEmit -p . | grep "src/foo.ts"` prints nothing.
   5. Run the golden replay for the file's behaviors and the existing tests; both must pass with no record changed.
   6. Commit ("type foo.ts").
2. Forbidden shortcuts, each checkable:
   - `// @ts-ignore` and `// @ts-nocheck`: `rg -n "@ts-(ignore|nocheck)" src` prints nothing. `// @ts-expect-error` is allowed only with a reason comment and a tracking note.
   - New `any`: `rg -n ":\s*any\b|as any\b|<any>" src | wc -l` does not increase between commits.
   - Optional: `ts-migrate` (Airbnb) can rename and annotate in bulk, but it inserts `any` and `@ts-expect-error` comments; if used, the `any` count becomes a tracked backlog, not a finished migration.
3. Final step after all files are `.ts`: enable the ladder flags one at a time, each its own commit, each with `tsc` at zero errors and all tests green.

### Output
`ts_migration_plan`.

### Quality Gate
- The procedure lists the exact commands for steps 1 to 6.
- Each forbidden shortcut has a grep command and its expected output.

---

## Worked Example

Illustrative. Repository with 46 JS files on Node 22.

Phase 1:
```
$ npm view lodash.debounce types typings
$ npm view @types/lodash.debounce version
4.0.9
$ npx tsc --noEmit -p . ; echo $?
0
```
Phase 2 counts with `checkJs: true`:
```
baseline checkJs        212
+ noImplicitAny         498
+ strictNullChecks      361
```
Ladder: `strictNullChecks` before `noImplicitAny` (fewer errors). Per-file count shows `src/util/money.js` with 3 errors, `src/api/router.js` with 77.

Phase 3 on `src/util/money.js`:
```
$ git mv src/util/money.js src/util/money.ts && git commit -qm "rename money.js to money.ts"
$ npx tsc --noEmit -p . | grep "src/util/money.ts"
$ npx vitest run test/golden -t "B-012"
 Test Files  1 passed (1)
      Tests  44 passed (44)
```
A class in `money.ts` had `amount;` declared as a field with a base-class setter for `amount`; the field would shadow the setter under define semantics. The field declaration was replaced by `declare amount: number;`, which emits nothing.

---

## Exit Criteria

DONE when the configuration compiles without changing behavior, runtime-affecting options are pinned with reasons, the strictness ladder is measured, and the per-file procedure with forbidden-shortcut checks is written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tests fail after adding `tsconfig.json` only | **Stop**: the test runner picked up TypeScript settings (for example ts-jest); fix the runner config, not the source. |
| Phase 1 | A dependency has no types anywhere | **Adjust**: write a minimal `src/types/<pkg>.d.ts` declaring only the functions used. |
| Phase 3 | A file needs a behavior change to type-check | **Adjust**: commit the behavior change separately, with a golden replay run proving it changes no record. |
| Phase 3 | Golden replay fails after a rename only | **Stop**: a runtime-affecting option is wrong; check `runtime_affecting_options` before touching code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
