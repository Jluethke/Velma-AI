# Code Splitting for webpack and Next.js

**One-line description:** Moves bundle offenders out of the initial webpack or Next.js chunk one at a time using dynamic `import()` with webpack magic comments, `React.lazy`, `next/dynamic`, `experimental.optimizePackageImports`, per-member imports, `IgnorePlugin` for locale data and `npm dedupe` for duplicates, re-running the analyzer after each change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `stack` (string, required): `nextjs` or `webpack`.
- `webpack_offenders` (object[], required): From `cwv-bundle-webpack-analyzer`.

---

## Outputs

- `webpack_split_patch` (object[]): Per offender: technique, files changed, initial-chunk parsed and gzip size before/after from the analyzer, Next.js First Load JS before/after for affected routes, and test results.

---

## Phase 1: Choose a Technique per Offender

### Entry Criteria
- `webpack_offenders` has at least one initial-chunk entry.

### Actions
1. Sort offenders by gzip size in initial chunks, largest first.
2. Choose:
   | Offender type | `webpack` | `nextjs` |
   |---|---|---|
   | `large-dependency` used by one view | Load the view with `React.lazy(() => import(/* webpackChunkName: "reports" */ './Reports'))` inside `<Suspense>` | `const Reports = dynamic(() => import('./Reports'), { loading: () => <Spinner/> })` from `next/dynamic`; add `ssr: false` only when the library needs `window` (and only in a client component) |
   | `whole-library-import` | Per-member imports: `import debounce from 'lodash/debounce'` (or `lodash-es` with tree shaking) | Add the package to `experimental.optimizePackageImports` in `next.config.js` (check the docs list of packages already optimized by default) |
   | `locale-data` (moment) | `new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ })` then import needed locales explicitly; or migrate off moment (separate change) | Same plugin through the `webpack` function in `next.config.js` |
   | `duplicate` | `npm dedupe`, then align versions in `package.json`; if a dependency pins an old version, use `overrides` (npm), `resolutions` (yarn) or `pnpm.overrides` | same |
   | `polyfill` | Update `browserslist` to the browsers you support (from analytics), and set `@babel/preset-env` `useBuiltIns: 'usage'` with a `corejs` version | Next.js includes polyfills itself; remove manual `core-js` imports |
   | `route-code-in-initial` | Lazy-load the route component as above | Next.js splits per route automatically; find the shared import (a barrel `index.ts` or layout) that pulls it into the shared chunk and import the module directly |
3. Barrel files: `import { Button } from '@/components'` through an `index.ts` that re-exports everything can defeat tree shaking when modules have side effects. Check `"sideEffects"` in the package's `package.json`; for your own code, import from the module file directly.
4. `webpackPrefetch: true` in a magic comment prefetches the chunk at idle; use it only for the most likely next view.

### Output
Technique per offender.

### Quality Gate
- Each offender has one technique from the table.

---

## Phase 2: Apply One Change

### Entry Criteria
- Plan exists.

### Actions
1. Apply the technique for the top offender only.
2. Run `npm run build`, `npm test`, and the type check if present. Keep the test count unchanged. Do not delete or skip tests that fail because a component is now lazy; wrap the test render in `<Suspense>` or await the lazy component with the testing library's `findBy*` queries.
3. Manually load the affected view in a production build: the lazy view must render, and the loading state must not cause layout shift (give the fallback the final view's size).

### Output
One applied change.

### Quality Gate
- Build and tests exit 0 with the same test count.
- `git diff --stat` touches only files for this offender.

---

## Phase 3: Re-measure

### Entry Criteria
- Change built.

### Actions
1. Re-run `cwv-bundle-webpack-analyzer` Phase 1. Confirm the offender left the initial chunk (it now appears in a separate async chunk or is gone).
2. For Next.js webpack builds, compare the First Load JS column in `npm run build` output for affected routes.
3. Record before/after parsed and gzip sizes. Then return to Phase 2 for the next offender.

### Output
`webpack_split_patch`.

### Quality Gate
- The offender's module path no longer appears in any initial chunk of the new report.
- Before/after sizes are read from analyzer reports of the same build mode.

---

## Worked Example

Illustrative only. `stack` = `webpack`. Offenders: `chart.js` (68 KB gzip, only on /reports), moment locales (72 KB gzip), duplicate lodash.

Iteration 1: `src/routes.tsx` changes `import Reports from './Reports'` to `const Reports = React.lazy(() => import(/* webpackChunkName: "reports" */ './Reports'));` with `<Suspense fallback={<ReportsSkeleton/>}>`. Tests: 212 passed. Analyzer: `chart.js` now only in `reports.[hash].js`; initial gzip 188 KB to 121 KB.

Iteration 2: `IgnorePlugin` for moment locales plus `import 'moment/locale/de'`; initial gzip 121 KB to 66 KB.

Iteration 3: `npm dedupe`; `npm ls lodash` shows one version; initial gzip 66 KB to 41 KB.

---

## Exit Criteria

DONE when each initial-chunk offender has been moved, deduplicated or trimmed one change at a time, tests pass after each, and the analyzer confirms the new initial size.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` is `vite` | **Return**: use `cwv-code-split-vite-rollup`. |
| Phase 2 | Lazy component breaks SSR (Next.js) | **Adjust**: keep SSR and split differently; use `ssr: false` only for browser-only libraries inside client components. |
| Phase 2 | Tests fail after lazy loading | **Adjust**: await the lazy render in tests; never delete the test. |
| Phase 3 | Offender still in initial chunk | **Retry**: another static import still references it; search with `grep -rn "from '<package>'" src/`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
