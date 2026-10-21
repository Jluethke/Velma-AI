# TypeScript TSDoc Comment Conventions With ESLint

**One-line description:** Enforces TSDoc syntax on a TypeScript package's exported API with eslint-plugin-tsdoc and requires a doc comment on every exported function and class with eslint-plugin-jsdoc, then writes the missing comments one file at a time using the tags TypeDoc renders (`@param`, `@returns`, `@throws`, `@example`, `@remarks`, `@deprecated`).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the package root (contains `package.json` and `tsconfig.json`).

---

## Outputs

- `docstring_config` (string): The ESLint flat config file changed (`eslint.config.js`, `.mjs` or `.ts`) and any `tsdoc.json` added.
- `docstring_report` (object[]): Per source file: exported symbols, symbols missing a doc comment before and after, `tsdoc/syntax` warnings before and after.

---

## Phase 1: Find the Exported Surface and ESLint Setup

### Entry Criteria
- `npx tsc --version` and `npx eslint --version` print versions.

### Actions
1. Read the entry point: `node -e "const p=require('./package.json');console.log(JSON.stringify({main:p.main,types:p.types,exports:p.exports},null,2))"`.
2. Map each `exports` entry back to its `.ts` source (for example `./dist/index.js` comes from `src/index.ts`; confirm with `rootDir`/`outDir` in `tsconfig.json`).
3. List exported names from each entry source: `grep -n -E '^export ' src/index.ts`. Follow `export * from` and `export { x } from` lines to their files.
4. Find the ESLint config: `ls eslint.config.* .eslintrc* 2>/dev/null`.

   | Found | Action |
   |---|---|
   | `eslint.config.js`/`.mjs`/`.cjs`/`.ts` | Edit it (flat config, ESLint 9 default). |
   | Only `.eslintrc.*` | ESLint 8 legacy config; edit it with the equivalent `plugins`/`rules` keys, or migrate with `npx @eslint/migrate-config .eslintrc.json` only if the user approves. |
   | None | Create `eslint.config.mjs` in Phase 2. |

### Output
Exported symbol list per file and the config file to edit.

### Quality Gate
- Every file in the export list exists (`ls <file>` succeeds).
- The config decision row is recorded.

---

## Phase 2: Configure tsdoc and jsdoc Rules

### Entry Criteria
- Config file chosen.

### Actions
1. Install: `npm install --save-dev eslint-plugin-tsdoc eslint-plugin-jsdoc typescript-eslint`.
2. Add a block to the flat config scoped to source files only:
   ```js
   import tseslint from "typescript-eslint";
   import tsdoc from "eslint-plugin-tsdoc";
   import jsdoc from "eslint-plugin-jsdoc";

   export default [
     {
       files: ["src/**/*.ts"],
       ignores: ["src/**/*.test.ts"],
       languageOptions: { parser: tseslint.parser },
       plugins: { tsdoc, jsdoc },
       rules: {
         "tsdoc/syntax": "warn",
         "jsdoc/require-jsdoc": ["warn", {
           publicOnly: true,
           require: { FunctionDeclaration: true, ClassDeclaration: true, MethodDefinition: true },
           contexts: ["TSInterfaceDeclaration", "TSTypeAliasDeclaration", "TSEnumDeclaration"]
         }]
       }
     }
   ];
   ```
   If a config already exports an array, append this object to it; do not replace the existing entries.
3. Do NOT enable `jsdoc/require-param-type` or `jsdoc/require-returns-type` in TypeScript; types come from the signature. The plugin's TypeScript presets turn these off.
4. If the codebase uses custom tags (for example `@internal` is standard TSDoc, `@category` is a TypeDoc tag), add `tsdoc.json` at the package root so `tsdoc/syntax` accepts them:
   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
     "extends": ["typedoc/tsdoc.json"],
     "noStandardTags": false
   }
   ```
   Use `"extends": ["typedoc/tsdoc.json"]` only when `typedoc` is installed; it supplies TypeDoc's tag definitions.

### Output
`docstring_config`.

### Quality Gate
- `npx eslint src --max-warnings=-1` exits without a configuration error and prints `tsdoc/syntax` or `jsdoc/require-jsdoc` findings, or nothing when clean.

---

## Phase 3: Write Comments File by File

### Entry Criteria
- Rules active.

### Actions
1. Baseline count per rule: `npx eslint src -f json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const c={};for(const f of JSON.parse(s))for(const m of f.messages)c[m.ruleId]=(c[m.ruleId]||0)+1;console.log(c)})"`.
2. Edit ONE file, then run `npx eslint <file>` and `npx tsc --noEmit`.
3. Comment template (TSDoc requires a hyphen after the parameter name):
   ```ts
   /**
    * Parse a duration string into milliseconds.
    *
    * @remarks
    * Accepts integer values with units `ms`, `s`, `m`, `h`.
    *
    * @param input - Duration such as `"1500ms"` or `"2m"`.
    * @returns The duration in milliseconds.
    * @throws {@link RangeError} When the unit is not recognized.
    *
    * @example
    * ```ts
    * parseDuration("2m"); // 120000
    * ```
    */
   export function parseDuration(input: string): number {
   ```
4. Common `tsdoc/syntax` failures and fixes:

   | Message contains | Fix |
   |---|---|
   | `tsdoc-param-tag-missing-hyphen` | Write `@param name - text` |
   | `tsdoc-undefined-tag` | Remove the tag, or define it in `tsdoc.json` if TypeDoc uses it |
   | `tsdoc-malformed-inline-tag` | Use `{@link Name}` with braces |
   | `tsdoc-escape-right-brace` / `tsdoc-escape-greater-than` | Put the text in backticks or escape it with a backslash |

5. Write only what the code does. Do NOT add `@throws` for errors the function never throws; read the body first.
6. Run tests after each file: `npm test`.

### Output
`docstring_report`.

### Quality Gate
- `npx eslint src --rule '{"tsdoc/syntax":"error","jsdoc/require-jsdoc":["error",{"publicOnly":true}]}'; echo $?` prints `0` last.
- `npx tsc --noEmit; echo $?` prints `0` last.
- `npm test` passes.

---

## Worked Example

Illustrative only. Baseline:
```
$ npx eslint src
src/duration.ts
  12:1  warning  Missing JSDoc comment  jsdoc/require-jsdoc
src/retry.ts
  8:4   warning  tsdoc-param-tag-missing-hyphen: The @param block should be followed by a parameter name and then a hyphen  tsdoc/syntax
✖ 2 problems (0 errors, 2 warnings)
```
Fix `src/duration.ts` with the Phase 3 template, rerun `npx eslint src/duration.ts` (clean), then `src/retry.ts` changes `@param attempts number of tries` to `@param attempts - Number of tries.`. Final gate exits 0.

---

## Exit Criteria

DONE when every exported function, class, method, interface, type alias and enum in the package entry points has a TSDoc comment, `tsdoc/syntax` and `jsdoc/require-jsdoc` report nothing at error level, and type check and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `exports`/`types`, only `main` | **Adjust**: treat the `.ts` source of `main` as the only entry point. |
| Phase 2 | Plugin import fails under CommonJS config | **Adjust**: use `require()` in `eslint.config.cjs` instead of `import`. |
| Phase 3 | `publicOnly` misses re-exported symbols | **Adjust**: add the comment at the declaration site of each re-exported symbol found in Phase 1 step 3. |
| Phase 3 | Test or type check fails after editing comments | **Stop**: an edit touched code; revert with `git checkout -p <file>` and redo comments only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
