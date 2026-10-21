# webpack Bundle Analyzer Report

**One-line description:** Produces a webpack stats file and a `webpack-bundle-analyzer` report (or `@next/bundle-analyzer` for Next.js), reads stat, parsed and gzip sizes per module, and lists the packages, duplicates and route chunks that dominate the JavaScript loaded on first paint.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `stack` (string, required): `nextjs` or `webpack`.

---

## Outputs

- `webpack_bundle_report` (object): Paths to the HTML report(s) and stats JSON, total parsed and gzip size of initial chunks per entry or route, and the analyzer version.
- `webpack_offenders` (object[]): Per offender: package or module path, parsed and gzip size, which chunk it sits in, whether that chunk is initial (loaded on first paint) or async, and the offender type (`large-dependency`, `duplicate`, `whole-library-import`, `locale-data`, `polyfill`, `route-code-in-initial`).

---

## Phase 1: Generate the Report

### Entry Criteria
- `npm run build` succeeds on the current branch.

### Actions
1. Choose the procedure by `stack`:
   | `stack` | Procedure |
   |---|---|
   | `webpack` | `npm install --save-dev webpack-bundle-analyzer`. Generate stats: `npx webpack --mode production --json=stats.json` (webpack 5 CLI; check `npx webpack --help` for `--json`). Then `npx webpack-bundle-analyzer stats.json dist -m static -r bundle-report.html -O` (`-m` mode, `-r` report file, `-O` do not open; confirm with `npx webpack-bundle-analyzer --help`). Pass the real output dir instead of `dist` so parsed and gzip sizes are computed from emitted files. |
   | `nextjs` | `npm install --save-dev @next/bundle-analyzer`. In `next.config.js`: `const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' }); module.exports = withBundleAnalyzer(nextConfig);` (ESM config: `import bundleAnalyzer from '@next/bundle-analyzer'`). Run `ANALYZE=true npm run build`. Reports appear in `.next/analyze/` (`client.html`, `nodejs.html`, `edge.html`). |
2. Next.js with Turbopack builds: `@next/bundle-analyzer` instruments webpack builds only. If `next build` uses Turbopack (check the build output header), either run the analysis build with webpack (`next build --webpack` where the version supports the flag; see `npx next build --help`) or check `npx next --help` for a Turbopack analyze command in your version.
3. Keep the report files out of git (add them to `.gitignore` if not already ignored).

### Output
HTML report and stats.

### Quality Gate
- The report file exists and opens; `ls -l bundle-report.html` or `ls .next/analyze/` shows it.
- The analyzer version is recorded (`npm ls webpack-bundle-analyzer` or `npm ls @next/bundle-analyzer`).

---

## Phase 2: Read the Report

### Entry Criteria
- Report exists.

### Actions
1. In the report sidebar, switch sizes: "Stat" (before minification), "Parsed" (minified output, what the browser parses and executes), "Gzipped" (transfer). Use Parsed for main-thread cost and Gzipped for network cost. Ignore Stat for decisions.
2. Identify initial chunks: for `webpack`, the chunks listed for the entry in `stats.json` (`jq '.entrypoints | map_values(.assets | map(.name))' stats.json`); for Next.js, the `client.html` chunks named in the build output's "First Load JS shared by all" and each route's First Load JS column (`npm run build` prints it for webpack builds).
3. For each initial chunk, list the largest modules and packages. Classify:
   | Pattern in the treemap | Offender type |
   |---|---|
   | One package occupies a large share (charts, editors, maps, date libraries) | `large-dependency` |
   | Same package name appears twice with different paths (`node_modules/a/node_modules/lodash` and `node_modules/lodash`) | `duplicate` |
   | Whole `lodash`, icon pack or UI kit included when a few members are used | `whole-library-import` |
   | `moment/locale/*` or `date-fns/locale` with many locales | `locale-data` |
   | `core-js` modules for features your browserslist targets already support | `polyfill` |
   | Code for a route or modal that is not shown on first paint | `route-code-in-initial` |
4. Confirm duplicates from the command line: `npm ls <package>` shows multiple versions.

### Output
`webpack_offenders`.

### Quality Gate
- Each offender has parsed and gzip sizes read from the report and a chunk name marked initial or async.
- Each `duplicate` is confirmed by `npm ls` output.

---

## Worked Example

Illustrative only. `stack` = `webpack`.

Phase 1:
```text
$ npx webpack --mode production --json=stats.json
$ npx webpack-bundle-analyzer stats.json dist -m static -r bundle-report.html -O
Webpack Bundle Analyzer saved report to /repo/bundle-report.html
```
Phase 2 (initial chunk `main.4f1a2b.js`, parsed 612 KB, gzip 188 KB):
| Offender | Parsed | Gzip | Type |
|---|---|---|---|
| `chart.js` | 201 KB | 68 KB | `large-dependency` (used only on /reports) |
| `moment` + `moment/locale` | 289 KB | 72 KB | `locale-data` |
| `lodash` (two copies) | 2 x 71 KB | 2 x 25 KB | `duplicate` (`npm ls lodash` shows 4.17.21 and 4.17.15) |

---

## Exit Criteria

DONE when the report exists, initial chunks are identified, and every large module in them is listed with parsed and gzip sizes and an offender type.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` is `vite` | **Return**: use `cwv-bundle-source-map-explorer`. |
| Phase 1 | Report shows only Stat sizes | **Adjust**: pass the build output directory as the second argument so parsed and gzip sizes can be computed. |
| Phase 1 | Next.js reports empty | **Adjust**: the build used Turbopack; follow Phase 1 step 2. |
| Phase 2 | Cannot tell if a chunk is initial | **Adjust**: load the page with DevTools Network JS filter and list the chunks requested before `load`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
