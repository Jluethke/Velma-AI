# Component Bundle Size Check

**One-line description:** Measures what one component adds to a consumer's bundle with `size-limit` (tree-shaken named import, framework excluded), finds the heavy modules with `--why` or a bundle visualizer, checks `sideEffects`, `peerDependencies` and package exports with `publint`, and gates on a size budget that the user supplies rather than one invented here.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): Component whose cost is measured.
- `size_budget` (string, optional): Budget with compression stated, for example `"6 kB brotli"`. When absent the flow reports the measured size and records the budget as an open question.

---

## Outputs

- `size_report` (object): Measured size (with compression and what was excluded), budget and pass/fail if a budget exists, top contributing modules, packaging findings (`sideEffects`, peer deps, `publint`), and fixes applied.

---

## Phase 1: Configure a Measurement

### Entry Criteria
- The package or app builds (`npm run build`).

### Actions
1. `npm ls size-limit @size-limit/preset-small-lib @size-limit/preset-app --depth=0`. Pick the preset (ask before installing):

   | Ships as | Preset |
   |---|---|
   | Published library | `@size-limit/preset-small-lib` (esbuild bundle of your import) |
   | Part of an app | `@size-limit/preset-app` or measure the app chunk with the bundler visualizer instead |

2. Add a check to `package.json` (or `.size-limit.json`):
   ```json
   "size-limit": [
     { "name": "Combobox", "path": "dist/index.js", "import": "{ Combobox }", "ignore": ["react", "react-dom"] }
   ]
   ```
   `import` measures only what a consumer importing that name pulls in (tree-shaken). `ignore` excludes peer dependencies the consumer already has; use `vue` or `svelte` for those stacks. Add `"limit"` only when `size_budget` is given.
3. Build, then run `npx size-limit`. Read the output: `Size` (and `Loading time` for some presets) plus the compression it used; the default compression changed between size-limit majors, so copy the compression named in the output (or set `brotli`/`gzip` explicitly per the size-limit README).

### Output
Configured check and first measurement.

### Quality Gate
- Output shows a size for the named import with the compression stated.
- Framework packages are in `ignore`.

---

## Phase 2: Find What Is Heavy

### Entry Criteria
- Measurement exists.

### Actions
1. Run `npx size-limit --why` (needs a why plugin such as `@size-limit/esbuild-why` for the esbuild preset; check the README). It opens or writes a treemap of the measured bundle. For apps, use `npx vite-bundle-visualizer` or `rollup-plugin-visualizer`, or `npx source-map-explorer dist/assets/*.js` with source maps on.
2. List the top modules by size and classify:

   | Finding | Fix |
   |---|---|
   | Framework (`react-dom`, `vue`) inside your bundle | Move it to `peerDependencies` and mark external in the library build (`build.rollupOptions.external` in Vite library mode). |
   | Whole utility library (`lodash`) | Import per function (`lodash-es/debounce`) or write the few lines needed. |
   | Date library for one format call | Replace with `Intl.DateTimeFormat`. |
   | Icon set imported as one object | Import single icons. |
   | Other components pulled in through a barrel `index.ts` with side effects | Set `"sideEffects"` correctly so bundlers tree-shake the barrel. |
   | Polyfill for a feature all targets support | Remove it after checking targets. |

3. `sideEffects`: in `package.json` set `"sideEffects": false`, or list files with side effects such as `["**/*.css"]` (CSS imports must not be tree-shaken away).
4. Run `npx publint` in the package folder; fix every error (bad `exports` paths, missing types, wrong `module` field).

### Output
Contributor list and packaging findings.

### Quality Gate
- Top contributors listed with sizes from the tool output.
- `npx publint` prints no errors.
- `grep -n '"sideEffects"' package.json` shows a value.

---

## Phase 3: Fix and Gate

### Entry Criteria
- Findings classified.

### Actions
1. Apply fixes one at a time; rebuild and rerun `npx size-limit` after each; record before and after.
2. If `size_budget` was given, set `"limit"` to it. `npx size-limit` exits nonzero when the size exceeds the limit; that is the gate.
3. If no budget was given, record the final number and put "size budget for <component>" in open questions. Do not invent a limit.
4. Add `"size": "size-limit"` to `scripts` so CI can run it (if the user agrees).
5. Run tests to confirm fixes did not break behavior.

### Output
`size_report`.

### Quality Gate
- With a budget: `npx size-limit` exit code 0.
- Without a budget: final size and open question recorded.
- Tests pass after fixes.

---

## Worked Example

Illustrative. React library, `size_budget` = `"5 kB brotli"`.

- Phase 1: `npx size-limit` prints `Combobox  Size: 9.84 kB with all dependencies, minified and brotlied`.
- Phase 2: treemap shows `lodash` (4.1 kB) for `debounce` and `date-fns` (2.0 kB) for one label. `publint` warns `pkg.module` points to a missing file.
- Phase 3: inline a 10-line debounce, replace `date-fns` with `Intl.DateTimeFormat`, fix `module` path. Result `Size: 3.92 kB`, limit `5 kB`, exit 0; tests `14 passed`.

---

## Exit Criteria

DONE when the component's tree-shaken cost is measured with framework excluded, heavy modules are explained, packaging passes `publint`, and the size passes the user's budget or the missing budget is an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `dist/` missing | **Retry**: run the build first. |
| Phase 1 | Named import not found | **Adjust**: check the package `exports` and the actual export name in `dist`. |
| Phase 2 | `--why` errors about a missing plugin | **Adjust**: use a bundler visualizer or source-map-explorer instead. |
| Phase 3 | Over budget after all fixes | **Return**: report the remaining contributors; the budget owner decides. |

---

## Do Not

- Do not measure with the framework included and call it the component's cost.
- Do not set a limit nobody supplied.
- Do not set `"sideEffects": false` when the package imports CSS files; list them.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
