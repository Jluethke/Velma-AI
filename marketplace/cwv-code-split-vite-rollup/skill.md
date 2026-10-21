# Code Splitting for Vite and Rollup

**One-line description:** Moves bundle offenders out of the Vite entry chunk one at a time using dynamic `import()`, `React.lazy` or the router's lazy route API, `import.meta.glob` without `eager`, and `manualChunks` for stable vendor chunks, verified by re-running source-map-explorer and checking `modulepreload` tags in `dist/index.html` after each change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Vite repository root.
- `sme_offenders` (object[], required): From `cwv-bundle-source-map-explorer`.

---

## Outputs

- `vite_split_patch` (object[]): Per offender: technique, files changed, entry-chunk and preloaded-chunk bytes before/after from source-map-explorer, and test results.

---

## Phase 1: Choose a Technique per Offender

### Entry Criteria
- `sme_offenders` has at least one initial-chunk entry.

### Actions
1. Read versions: `node -p "require('vite/package.json').version"`. Check whether the project uses Rollup or Rolldown under Vite (newer Vite majors moved to Rolldown); read the Vite docs for that major before touching `build.rollupOptions` chunk options, because option names for manual chunking differ between the two.
2. Choose:
   | Offender type | Technique |
   |---|---|
   | `route-code-in-initial` | Lazy routes. React Router: `lazy: () => import('./pages/Admin')` on the route object, or `React.lazy` plus `<Suspense>`. Vue Router: `component: () => import('./pages/Admin.vue')`. |
   | `large-dependency` used by one view | Import the dependency inside that lazy view only; or `const { Chart } = await import('chart.js')` inside the handler that first needs it. |
   | `import.meta.glob(..., { eager: true })` pulls all modules | Remove `eager: true`; call the returned loader functions when needed. |
   | `whole-library-import` | Use ESM per-member imports (`lodash-es`, `date-fns` named imports) so Rollup tree-shakes; avoid `import * as` from large libraries. |
   | `locale-data` | Import only needed locales; load others on demand with dynamic `import()`. |
   | `duplicate` | `npm dedupe`; align versions; `overrides` / `resolutions` / `pnpm.overrides`; Vite `resolve.dedupe: ['react']` for packages that must be singletons. |
   | Vendor code changes on every deploy, busting cache | Split stable vendors into their own chunk with the manual chunk option your bundler version documents (`build.rollupOptions.output.manualChunks` under Rollup). Do not put lazily used libraries into an eagerly loaded manual chunk. |
3. Watch the `modulepreload` list: Vite preloads chunks that the entry statically imports. A "lazy" module also imported statically elsewhere stays in the initial graph.

### Output
Technique per offender.

### Quality Gate
- Each offender has one technique from the table; the Vite version and bundler (Rollup or Rolldown) are recorded.

---

## Phase 2: Apply One Change

### Entry Criteria
- Plan exists.

### Actions
1. Apply the top offender's technique only.
2. `npm run build`, `npm test`, `npx tsc --noEmit` (TypeScript). Keep the test count unchanged; fix lazy-loading test failures by awaiting the render (`findBy*` queries), never by deleting tests.
3. Load the affected view in `npx vite preview`. It must render; the Suspense fallback should occupy the final layout's space to avoid CLS.
4. Check the build log: Vite warns when a module is both dynamically and statically imported ("dynamic import will not move module into another chunk"). That warning means the split did not happen; find and remove the static import.

### Output
One applied change.

### Quality Gate
- Build, type check and tests exit 0 with the same test count.
- The build log has no "will not move module into another chunk" warning for the changed module.

---

## Phase 3: Re-measure

### Entry Criteria
- Change built.

### Actions
1. Re-run `cwv-bundle-source-map-explorer` Phases 1 and 2.
2. Confirm the offender is absent from the entry chunk and from every `modulepreload` chunk listed in `dist/index.html`.
3. Record before/after bytes; continue with the next offender.

### Output
`vite_split_patch`.

### Quality Gate
- `grep -c modulepreload dist/index.html` and the per-chunk bytes from `sme-report.json` are recorded before and after.
- The offender's module path is absent from initial chunks in the new JSON.

---

## Worked Example

Illustrative only. Vite 6 (Rollup). Offenders: `src/pages/Admin/*` (92,100 bytes, `route-code-in-initial`), `recharts` (168,400 bytes, used in Settings).

Iteration 1: `src/router.tsx`:
```tsx
{ path: '/admin', lazy: () => import('./pages/Admin/route') }
```
Build log clean; tests 188 passed (188 before). Entry chunk 583,220 to 491,120 bytes.

Iteration 2: `recharts` is imported in `src/pages/Settings/Usage.tsx` and also re-exported from `src/components/index.ts`. The build warns "dynamic import will not move module into another chunk". Removing the re-export from the barrel clears the warning; entry chunk 491,120 to 322,700 bytes.

---

## Exit Criteria

DONE when each initial-chunk offender has been split or trimmed one change at a time, the build log shows no failed split warnings, tests pass, and source-map-explorer confirms the new entry and preload sizes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Manual chunk option rejected by the build | **Adjust**: the bundler is Rolldown (or the reverse); use the option the Vite docs for your major list. |
| Phase 2 | "will not move module" warning | **Retry**: find the remaining static import with `grep -rn "<module>" src/` and remove it. |
| Phase 2 | Tests fail | **Stop**: revert or fix the test's async handling; never delete tests. |
| Phase 3 | Entry chunk unchanged | **Adjust**: the module is reached through a barrel file; import it directly. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
