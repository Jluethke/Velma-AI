# Node ESM and CommonJS Build

**One-line description:** Decides between ESM-only and a dual ESM plus CommonJS package from the supported Node range, then builds both formats with tsup or two tsc passes, emitting matching `.d.ts` and `.d.cts` types and guarding against the dual-package hazard.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `exports_map` (object, required): From `pkg-node-exports-map`; the entry points and target file paths.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `dual_build_config` (object): Format decision with the table row used, the build tool and its config, the emitted file list per entry (`.js`, `.cjs`, `.d.ts`, `.d.cts`), and the dual-package hazard assessment.

---

## Phase 1: Decide the Format

### Entry Criteria
- `npm pkg get engines type` has been read.

### Actions
1. Read the lowest supported Node version from `engines.node`. If absent, ask the user; do not assume.
2. Apply the table, first match wins:

   | # | Situation | Format |
   |---|---|---|
   | 1 | Users must `require()` the package on Node versions without `require(esm)` support | dual |
   | 2 | Lowest supported Node has `require(esm)` enabled by default (Node 22.12 and 20.19 lines onward per the Node release notes; confirm in the changelog for the exact versions) and the package has no top-level `await` | ESM-only acceptable |
   | 3 | Package is only consumed by bundlers | ESM-only |
   | 4 | Package is already CJS-only and the release is minor or patch | stay CJS; changing format is breaking |

3. Changing from CJS-only to ESM-only is a breaking change. Record it for the version decision.

### Output
Format decision.

### Quality Gate
- The table row number and the `engines.node` value are in the report.

---

## Phase 2: Configure the Build

### Entry Criteria
- Format decided.

### Actions
1. Preferred tool, tsup:
   ```
   npm install -D tsup typescript
   ```
   `tsup.config.ts`:
   ```ts
   import { defineConfig } from "tsup";
   export default defineConfig({
     entry: ["src/index.ts", "src/errors.ts"],
     format: ["esm", "cjs"],
     dts: true,
     sourcemap: true,
     clean: true,
   });
   ```
   With `"type": "module"` in `package.json`, tsup writes `index.js` (ESM), `index.cjs` (CJS), `index.d.ts` and `index.d.cts`. Without `"type": "module"` it writes `index.mjs`, `index.js`, `index.d.mts`, `index.d.ts`. Match the `exports_map` paths to whichever set is produced.
2. tsc-only alternative: two configs, `tsconfig.esm.json` with `"module": "NodeNext"` and `outDir: dist/esm`, `tsconfig.cjs.json` with `"module": "CommonJS"` and `outDir: dist/cjs`, plus a file `dist/cjs/package.json` containing `{"type": "commonjs"}` so Node reads the `.js` files there as CJS. Types from the CJS pass must be served for `require`.
3. ESM-only: `format: ["esm"]`, and `exports` with `types` and `default`.
4. Set `"scripts": { "build": "tsup" }` and `"prepack": "npm run build"` so `npm pack` and `npm publish` always rebuild.

### Output
Build config files.

### Quality Gate
- `npm run build` exits 0.
- Every file path in `exports_map` exists after the build (`ls` each path).

---

## Phase 3: Check the Dual-Package Hazard

### Entry Criteria
- Dual format built; skip for ESM-only and record "not applicable".

### Actions
1. The hazard: an app that loads both the ESM and CJS copies gets two module instances. `instanceof` checks fail across them and module-level state (caches, registries, singletons) is duplicated.
2. Search for module-level state and exported classes users check with `instanceof`: `grep -nE "^(let|var) |new Map\(|new Set\(|^export class" src/*.ts`.
3. Apply:

   | Finding | Action |
   |---|---|
   | no module state, no exported classes used with `instanceof` | accept; record "stateless" |
   | state or `instanceof` classes present | keep the state in the CJS build only and make the ESM entry a thin wrapper: `export { parse } from "../cjs/index.cjs"` style, or move state to `globalThis` under a `Symbol.for("<pkg>.state")` key |
   | cannot change the design | document the hazard in the README |

4. Prove both formats load and agree: `node -e "console.log(Object.keys(require('./dist/index.cjs')))"` and `node --input-type=module -e "import * as m from './dist/index.js'; console.log(Object.keys(m))"` print the same keys.

### Output
`dual_build_config`.

### Quality Gate
- The ESM and CJS key lists are identical.
- The hazard assessment names a row from the table.

---

## Worked Example

Illustrative. `@acme/qs-lite`, `engines.node = ">=18"`, `"type": "module"`.

Phase 1: Node 18 does not have `require(esm)` by default; row 1: dual.

Phase 2: tsup config above; `npm run build`:
```
ESM dist/index.js 2.10 KB
CJS dist/index.cjs 2.43 KB
DTS dist/index.d.ts 0.61 KB
DTS dist/index.d.cts 0.61 KB
```

Phase 3: no module state, `QsError` class exists and users may `instanceof` it; error class moved to CJS-backed wrapper. Key lists both print `[ 'QsError', 'parse', 'stringify' ]`.

---

## Exit Criteria

DONE when the format choice cites its row, the build emits every file `exports_map` references with per-format types, and both formats load with identical exports.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `engines.node` missing | **Return**: ask the user for the supported range. |
| Phase 2 | tsup emits different filenames than `exports_map` | **Adjust**: update `exports_map` paths in `package.json` to the emitted names; do not rename built files by hand. |
| Phase 2 | Top-level `await` in source with CJS output | **Stop**: CJS cannot express it; choose ESM-only or remove it. |
| Phase 3 | Key lists differ | **Adjust**: a default export or `export =` differs between formats; use only named exports. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
