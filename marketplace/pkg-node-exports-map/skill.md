# npm Exports Map

**One-line description:** Writes the `package.json` `exports` map with correctly ordered conditions and explicit subpaths so only the intended entry points resolve, and verifies resolution through Node's package self-reference before anything is packed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `public_api` (object[], required): From `pkg-public-api-inventory`; the public entry points and the subpaths classified as leaks.
- `project_dir` (string, required): Repository root containing `package.json`.

---

## Outputs

- `exports_map` (object): The final `exports` JSON, the `main` and `types` fallbacks, the list of allowed subpaths, the list of blocked subpaths, and the pasted output of each resolution test.

---

## Phase 1: Design the Subpath List

### Entry Criteria
- `package.json` exists; `npm pkg get exports` has been read.

### Actions
1. Write the allowed subpaths, one per public entry point. `"."` is the main entry; others look like `"./errors"`.
2. Always add `"./package.json": "./package.json"`. Some tools read it and `exports` would otherwise block them.
3. Do not add `"./*": "./dist/*"` wildcards unless every file under that folder is public API. A wildcard turns every internal file into public API.
4. Know the rule: once `exports` exists, any path not listed fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Adding `exports` to a package that had none is a breaking change for anyone deep-importing files; record that for the version decision.

### Output
Subpath list.

### Quality Gate
- Every `public` row in `public_api` maps to exactly one subpath.
- No subpath points at a test, fixture or source-only file.

---

## Phase 2: Write the Conditions in the Right Order

### Entry Criteria
- Subpath list done.

### Actions
1. Node and TypeScript pick the first matching condition in object order. Use this order inside each subpath:

   | Order | Condition | Points to |
   |---|---|---|
   | 1 | `"types"` | the `.d.ts` (or nested per format, see below) |
   | 2 | `"import"` | ESM build |
   | 3 | `"require"` | CommonJS build |
   | 4 | `"default"` | last; the fallback for any other resolver |

   `"types"` must be first in its object; TypeScript ignores it if an earlier condition already matched. `"default"` must be last.
2. For a dual package, nest `types` inside each format so ESM and CJS each get their own declaration file:
   ```json
   "exports": {
     ".": {
       "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
       "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
     },
     "./package.json": "./package.json"
   }
   ```
3. For an ESM-only package with `"type": "module"`:
   ```json
   "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }, "./package.json": "./package.json" }
   ```
4. Keep `"main"` (and `"types"` at top level) as fallbacks for old tools that ignore `exports`: `"main": "./dist/index.cjs"` for dual, `"./dist/index.js"` for ESM-only.
5. Edit with `npm pkg set` or by hand in `package.json` only; edit no other file in this phase. Validate JSON: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`.

### Output
Updated `package.json` `exports`, `main`, `types`.

### Quality Gate
- `node -e "const e=require('./package.json').exports; console.log(JSON.stringify(e,null,1))"` prints the map with `types` first and `default` last in every object.
- The JSON parse command exits 0.

---

## Phase 3: Prove Resolution With Self-Reference

### Entry Criteria
- Build output exists (`npm run build` exits 0) so the target files are on disk.

### Actions
1. Node lets a package import itself by its own `name` when `exports` is defined. Run from `project_dir`:
   - ESM: `node --input-type=module -e "import * as m from '<name>'; console.log(Object.keys(m))"`
   - CJS: `node -e "console.log(Object.keys(require('<name>')))"`
   - Each subpath: same commands with `'<name>/errors'`.
2. Prove a blocked path fails: `node -e "require('<name>/dist/internal.js')"` must print `ERR_PACKAGE_PATH_NOT_EXPORTED`.
3. Check each target file exists: `node -e "const fs=require('fs');const w=o=>typeof o==='string'?[o]:Object.values(o).flatMap(w);for(const p of w(require('./package.json').exports))if(!fs.existsSync(p))console.log('MISSING',p)"` prints nothing.

### Output
`exports_map` with test output.

### Quality Gate
- ESM and CJS (if dual) self-imports print the same key list as the `public` rows.
- The blocked-path test prints `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- The missing-file check prints nothing.

---

## Worked Example

Illustrative. `@acme/qs-lite`, dual package, public entries `.` and `./errors`, leak `./dist/internal.js`.

Phase 1: subpaths `.`, `./errors`, `./package.json`.

Phase 2: map written with `import`/`require` objects, each with `types` then `default`; `"main": "./dist/index.cjs"`.

Phase 3:
```
$ node --input-type=module -e "import * as m from '@acme/qs-lite'; console.log(Object.keys(m))"
[ 'parse', 'stringify' ]
$ node -e "require('@acme/qs-lite/dist/internal.js')"
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './dist/internal.js' is not defined by "exports"
```

---

## Exit Criteria

DONE when every public entry resolves for each supported format, `types` is first and `default` last in every condition object, blocked paths fail, and every target file exists.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Users deep-import files today | **Adjust**: list those paths as allowed subpaths for this release or record the change as breaking. |
| Phase 2 | JSON parse error | **Adjust**: fix the syntax error the parser names; re-run the parse check. |
| Phase 3 | Self-reference fails with `ERR_MODULE_NOT_FOUND` | **Adjust**: the target file path is wrong or the build did not run; check the missing-file output. |
| Phase 3 | Node older than self-reference support | **Stop**: report `node --version`; run the test with a current Node LTS. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
