# TypeScript allowJs and checkJs Setup

**One-line description:** Adds a tsconfig that lets JavaScript and TypeScript compile side by side with `allowJs`, keeps `checkJs` off globally, and opts JavaScript files into type checking one at a time with `// @ts-check` and JSDoc annotations, without changing runtime output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `ts_error_baseline` (object, required): From `tsm-ts-error-baseline`; the `current` count is the number this flow must not raise in TypeScript files.

---

## Outputs

- `ts_allowjs_config` (object): The committed `tsconfig.json` content, the module settings chosen and why (row of the table in Phase 1), the list of JavaScript files opted in with `// @ts-check`, the tsc error count after setup, and the test result after setup.

---

## Phase 1: Write the Mixed Config

### Entry Criteria
- `ts_error_baseline` exists, and `package.json` pins `typescript` as a dev dependency (`npm ls typescript` prints one version).

### Actions
1. Read how the code runs today. Pick the module settings from this table; the first matching row wins:

   | Evidence in the repo | `module` | `moduleResolution` |
   |---|---|---|
   | Bundled by vite, webpack, esbuild, rollup, Next.js or Parcel | `esnext` (or `preserve` on TypeScript 5.4+) | `bundler` |
   | Runs directly on Node and `package.json` has `"type": "module"` | `nodenext` | `nodenext` |
   | Runs directly on Node with `require` and no `"type": "module"` | `nodenext` (emits CommonJS for `.js` files in that package) | `nodenext` |
   | None of the above | **Return**: ask the user how the code is executed | none |

2. If `tsconfig.json` exists, edit it; if not, create it. Minimal content for the type-check-only setup (the existing build keeps producing the runtime output):
   ```json
   {
     "compilerOptions": {
       "target": "es2022",
       "module": "<from table>",
       "moduleResolution": "<from table>",
       "allowJs": true,
       "checkJs": false,
       "noEmit": true,
       "strict": false,
       "esModuleInterop": true,
       "resolveJsonModule": true,
       "skipLibCheck": false,
       "forceConsistentCasingInFileNames": true
     },
     "include": ["src"]
   }
   ```
   Set `target` to the lowest runtime the project supports (check `engines.node` in `package.json` or the browserslist). Keep `noEmit: true` when an existing bundler or Babel produces the build; only switch to `outDir` when tsc will become the compiler, and then never let `outDir` sit inside `include`.
3. Add a script to `package.json`: `"typecheck": "tsc --noEmit -p tsconfig.json"`.
4. Run `npm run typecheck -- --pretty false`. With `checkJs: false`, JavaScript files are parsed and contribute inferred types but report no errors, so the count must equal `ts_error_baseline.current.total` (TypeScript files only).
5. Run `npx tsc --listFilesOnly -p tsconfig.json | grep -v node_modules | wc -l` and confirm the JavaScript files are included.

### Output
Committed mixed config with an unchanged error count.

### Quality Gate
- `npm run typecheck` error count equals the baseline TypeScript count.
- The JavaScript file count in `--listFilesOnly` equals `git ls-files src | grep -E "\.(js|jsx|mjs|cjs)$" | wc -l`.
- The production build command and `test_command` both still pass; `git diff --stat` shows only `tsconfig.json` and `package.json` changed.

---

## Phase 2: Opt In One JavaScript File at a Time

### Entry Criteria
- Phase 1 committed.

### Actions
1. Take files from the front of `ts_conversion_order` (if that flow ran) or the file the user names. Work on ONE file.
2. Add `// @ts-check` as the first line. Run `npm run typecheck -- --pretty false` and list only that file's errors: `... | grep "^src/lib/money.js("`.
3. Fix errors with JSDoc, never by changing logic:
   - Parameters and return: `/** @param {number} cents @param {string} currency @returns {string} */`
   - Object shapes: `/** @typedef {{ id: string, total: number }} Invoice */`
   - Import a type from another file: `/** @type {import('./models/user').User} */`
   - Generics: `/** @template T @param {T[]} xs @returns {T | undefined} */`
   - Cast a value already checked at runtime: `/** @type {HTMLInputElement} */ (el)` (the parentheses are required).
4. If an error reveals a real bug (for example calling a method on a value that can be `undefined`), do not fix the bug in this flow. Add `// @ts-expect-error -- BUG: <one-line description>` above the line and record it for the user. Never use `// @ts-ignore`; `@ts-expect-error` fails when the error disappears, so it cannot rot.
5. Run `test_command`. Commit with message `types: @ts-check <file>`.
6. Repeat for the next file. Flipping `checkJs` globally is the user's call, not yours: if the user asks for it, set `checkJs: true` and put `// @ts-nocheck` on the remaining files; that is a separate commit with its own error count.

### Output
`ts_allowjs_config` with the opted-in file list.

### Quality Gate
- Each commit touches one JavaScript file (plus at most one shared typedef file).
- `npm run typecheck` reports zero errors in every opted-in file: `grep -c "^<file>("` prints 0.
- `grep -rn "@ts-ignore" src` returns no line added by this flow.

---

## Worked Example

Illustrative only. Vite React app, 120 `.js`/`.jsx` files, no tsconfig.

Phase 1: vite row, so `module: esnext`, `moduleResolution: bundler`. `npm run typecheck` prints nothing and exits 0. `--listFilesOnly` shows 120 project files.

Phase 2, file `src/lib/money.js`:
```
$ npm run typecheck -- --pretty false | grep "^src/lib/money.js("
src/lib/money.js(8,24): error TS2339: Property 'toFixed' does not exist on type 'string'.
```
JSDoc said `@param {string} cents` by mistake; the callers pass numbers. Change the JSDoc to `{number}`, rerun: zero lines. `npm test` passes. Commit `types: @ts-check src/lib/money.js`.

---

## Exit Criteria

DONE when the mixed config is committed with an unchanged error count, the build and tests pass, and every opted-in JavaScript file has zero errors.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Error count rises after adding the config | **Adjust**: a new setting (often `esModuleInterop` or `moduleResolution`) changed resolution; diff the counts by code and revert the setting that caused it. |
| Phase 1 | tsc tries to write `.js` files over the sources (TS5055) | **Stop**: `noEmit` is missing or `outDir` overlaps `include`; fix before any run that could overwrite sources. |
| Phase 2 | A file has dozens of errors from one untyped dependency | **Adjust**: run `tsm-ts-declaration-files` for that dependency first. |
| Phase 2 | Tempted to change code to silence an error | **Stop**: this flow only adds annotations; record real bugs with `@ts-expect-error -- BUG:`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
