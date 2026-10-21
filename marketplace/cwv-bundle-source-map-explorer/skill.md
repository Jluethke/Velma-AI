# source-map-explorer Bundle Attribution

**One-line description:** Builds a Vite or Rollup app with source maps, attributes every byte of each output chunk to its source module with `source-map-explorer` (HTML and JSON output), cross-checks with a `rollup-plugin-visualizer` treemap, and lists the modules that dominate the entry chunk and its static imports.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Vite (or plain Rollup) repository root.

---

## Outputs

- `sme_bundle_report` (object): Paths to the source-map-explorer HTML and JSON outputs and the visualizer HTML, the list of chunks preloaded by `index.html`, and their total bytes and gzip bytes.
- `sme_offenders` (object[]): Per offender: module or package, bytes, share of its chunk, chunk name, whether the chunk is initial (entry or `modulepreload`) or lazy, and offender type (`large-dependency`, `duplicate`, `whole-library-import`, `locale-data`, `polyfill`, `route-code-in-initial`).

---

## Phase 1: Build With Source Maps

### Entry Criteria
- `npm run build` succeeds.

### Actions
1. Enable source maps for the analysis build only. In `vite.config.ts`, set `build: { sourcemap: true }` behind an env check so production deploys do not change unintentionally:
   ```ts
   build: { sourcemap: process.env.ANALYZE === 'true' }
   ```
2. Build: `ANALYZE=true npm run build` (Windows PowerShell: `$env:ANALYZE='true'; npm run build`). Confirm maps exist: `ls dist/assets/*.js.map`.
3. Install and run: `npm install --save-dev source-map-explorer`, then
   ```bash
   npx source-map-explorer 'dist/assets/*.js' --html sme-report.html
   npx source-map-explorer 'dist/assets/*.js' --json sme-report.json
   ```
   Add `--gzip` to report gzip sizes (check `npx source-map-explorer --help`). If it errors with "Your source map refers to generated column ... out of bounds", rerun with `--no-border-checks` and record that.
4. Cross-check with a treemap: `npm install --save-dev rollup-plugin-visualizer`, add `visualizer({ filename: 'stats.html', template: 'treemap', gzipSize: true, brotliSize: true })` to `plugins` in the analysis build, rebuild, open `stats.html`.

### Output
Report files.

### Quality Gate
- `sme-report.json` exists and `jq '.results | length' sme-report.json` is at least 1.
- Every analyzed `.js` file had a matching `.map` file.

---

## Phase 2: Identify Initial Chunks

### Entry Criteria
- Reports exist.

### Actions
1. Read `dist/index.html`. Initial JS = the `<script type="module" src>` entry plus every `<link rel="modulepreload" href>`.
2. For each initial chunk, read its entry in `sme-report.json`: `jq '.results[] | {bundleName, totalBytes, top: (.files | to_entries | sort_by(-.value.size) | .[:10] | map({k: .key, size: .value.size}))}' sme-report.json`.
3. Lazy chunks (loaded via dynamic `import()`) are not on the first-paint path; list them separately.

### Output
Initial chunk list with top modules.

### Quality Gate
- The initial chunk list matches the tags in `dist/index.html` (grep count of `modulepreload` plus one entry).

---

## Phase 3: Classify Offenders

### Entry Criteria
- Initial chunks known.

### Actions
1. Classify each large module in initial chunks with the same table as `cwv-bundle-webpack-analyzer` Phase 2 step 3 (`large-dependency`, `duplicate`, `whole-library-import`, `locale-data`, `polyfill`, `route-code-in-initial`).
2. Detect duplicates: look for the same package under two `node_modules` paths in the JSON (`jq -r '.results[].files | keys[]' sme-report.json | grep -o 'node_modules/[^/]*' | sort | uniq -c | sort -rn | head`), then confirm with `npm ls <package>`.
3. For `route-code-in-initial`, name the route component and the file that statically imports it (usually the router setup).
4. Revert the analysis config change if it was not behind an env flag.

### Output
`sme_offenders`, `sme_bundle_report`.

### Quality Gate
- Every offender has bytes and a chunk read from `sme-report.json`, and an offender type.
- `git diff` shows no source map setting left enabled for normal builds (unless the user wants production maps).

---

## Worked Example

Illustrative only. Vite + React app.

Phase 1:
```text
$ npx source-map-explorer 'dist/assets/*.js' --json sme-report.json
$ jq '.results[] | {bundleName, totalBytes}' sme-report.json
{ "bundleName": "dist/assets/index-B7c1.js", "totalBytes": 583220 }
{ "bundleName": "dist/assets/Reports-D9e2.js", "totalBytes": 41210 }
```
Phase 2: `dist/index.html` loads `index-B7c1.js` and one `modulepreload` (`vendor-react-A1f0.js`).

Phase 3: in `index-B7c1.js`: `node_modules/recharts` 168,400 bytes (`large-dependency`, used only in Settings), `src/pages/Admin/*` 92,100 bytes (`route-code-in-initial`, imported statically in `src/router.tsx`), `node_modules/date-fns/locale` 61,000 bytes (`locale-data`).

---

## Exit Criteria

DONE when source-map attributed reports exist, initial chunks match `index.html`, and every large module in them is classified with bytes from the JSON report.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `.map` files | **Adjust**: confirm `build.sourcemap` is true in the build that ran (the env flag was set). |
| Phase 1 | Column out of bounds error | **Retry**: rerun with `--no-border-checks`. |
| Phase 2 | Many unmapped bytes reported | **Adjust**: a plugin dropped source maps; check the visualizer treemap for the same chunk. |
| Phase 3 | Project uses webpack, not Vite | **Return**: use `cwv-bundle-webpack-analyzer`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
