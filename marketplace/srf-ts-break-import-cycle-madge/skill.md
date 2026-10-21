# TypeScript Break Circular Imports with madge

**One-line description:** Lists every circular dependency in a TypeScript source tree with `madge --circular`, excludes type-only edges that the compiler erases, then breaks each runtime cycle with a fixed order of fixes (convert to `import type`, extract shared code to a leaf module, invert through an interface, stop importing from a barrel), one cycle per commit, guarded by a no-cycle rule.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Project root.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-node-characterization-tests`.
- `source_root` (string, required): Directory to analyze, for example `src`.

---

## Outputs

- `step_commits` (string[]): One SHA per cycle broken, plus the guard commit if added.
- `step_log` (object[]): Per cycle: file chain, edge removed, fix chosen, results, SHA.

---

## Phase 1: List Cycles

### Entry Criteria
- `git status --porcelain` empty; `npx tsc --noEmit` exits 0.

### Actions
1. Run `npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src`. Output reads `Found 2 circular dependencies!` followed by numbered chains like `1) pricing/quote.ts > pricing/tax.ts`. Record each chain.
2. Separate type-only edges. madge can skip type imports when configured: create `.madgerc` with `{"detectiveOptions": {"ts": {"skipTypeImports": true}, "tsx": {"skipTypeImports": true}}}` and rerun. Chains that disappear are type-only; they do not run at runtime. Record both counts.
3. For each remaining chain, open each file and list the import statement that creates each edge and the names it brings in.
4. Check whether a barrel is involved: an edge to `index.ts` that re-exports the importing file is a common cause.

### Output
Runtime cycle list with the import statement per edge.

### Quality Gate
- Both madge runs (with and without `skipTypeImports`) are recorded with their counts.
- Each runtime chain lists one import statement per edge.

---

## Phase 2: Choose the Fix

### Entry Criteria
- Phase 1 complete.

### Actions
1. For each cycle take the first row that applies:

| Condition | Fix |
|---|---|
| The names on one edge are used only as types | Change to `import type { X } from "./x"`. With `verbatimModuleSyntax` or `importsNotUsedAsValues` settings, this is required anyway. |
| An edge goes through a barrel (`import { A } from "./index"` or `"../pricing"`) that re-exports the importer | Import from the defining file directly (`"./a"`). |
| Two files share constants, helpers or a base class | Move the shared code to a new leaf file that imports neither (use `srf-ts-move-file-ts-morph` mechanics or ts-morph to move declarations). |
| A low-level module calls a high-level one | Define an interface in the low-level module and have the high-level module pass an implementation in (constructor or function parameter). |
| Class A extends class B and B imports A | Must be fixed: at runtime one class is `undefined` when the other's module evaluates (`TypeError: Class extends value undefined is not a constructor or null`). Extract the shared base to a leaf. |

2. Do NOT wrap imports in functions with `require()` to dodge the cycle, and do NOT rely on the bundler hoisting order.

### Output
Fix per cycle with the cited row.

### Quality Gate
- Each runtime cycle has one fix and one table row.

---

## Phase 3: Apply, Verify, Commit, Guard

### Entry Criteria
- Phase 2 complete.

### Actions
1. Apply the fix for one cycle.
2. `npx tsc --noEmit` exits 0; rerun madge (with the `.madgerc`): the chain is gone and the count dropped by at least one with no new chain.
3. Run the characterization command (no snapshot updates), `test_command`, and the API Extractor check if configured.
4. Green: `git commit -am "refactor: break quote <-> tax cycle (import type)"`. Red: `git checkout -- .` (plus `git stash push -u` for new files), use the next table row.
5. After the last cycle, add a guard so cycles do not return. Pick what the project already uses:

| Project has | Guard |
|---|---|
| ESLint with `eslint-plugin-import` | Rule `"import/no-cycle": "error"` in the ESLint config |
| dependency-cruiser | A `no-circular` rule with `severity: "error"` in `.dependency-cruiser.js` |
| Neither | A script in `package.json`: `"check:cycles": "madge --circular --extensions ts,tsx --ts-config tsconfig.json src"` and add it to CI if CI config is in the repo |

   Commit the `.madgerc` and the guard together: `build: fail on circular imports`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- madge prints `No circular dependency found!` for runtime edges.
- The guard command exits 0 now and exits non-zero when a deliberate cycle is added in a scratch edit (then reverted).
- Tests exit 0; tree clean.

---

## Worked Example

Illustrative only.
```
$ npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src
Found 2 circular dependencies!
1) pricing/quote.ts > pricing/tax.ts
2) pricing/index.ts > pricing/discount.ts
```
With `skipTypeImports` only chain 2 remains: chain 1 was `import { Quote }` used only in a type; changed to `import type`. Chain 2: `discount.ts` imported `{ round2 }` from `"./index"`; changed to `"./money"`. After both commits: `No circular dependency found!`. Guard `"import/no-cycle": "error"` added.

---

## Exit Criteria

DONE when madge reports no runtime cycles in `source_root`, each fix is one green commit, and a guard fails the build on a new cycle.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | madge reports files as skipped | **Adjust**: pass `--ts-config` so path aliases resolve; rerun. |
| Phase 2 | `import type` breaks code that uses the name as a value | **Adjust**: the name is used at runtime; take the next row. |
| Phase 3 | Runtime `undefined` export after moving code | **Retry**: revert; an evaluation-order dependency remains; extract the shared code to a leaf file. |
| Phase 3 | `import/no-cycle` is slow on a large repo | **Adjust**: set its `maxDepth` option per the plugin docs and record the value as a user decision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
