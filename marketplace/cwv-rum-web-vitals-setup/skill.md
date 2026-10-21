# web-vitals RUM Setup

**One-line description:** Installs the `web-vitals` library attribution build in a Next.js, Vite or webpack app, reports LCP, INP, CLS, FCP and TTFB with their attribution fields, and beacons them to a RUM endpoint with `navigator.sendBeacon`, one stack-specific procedure per build tool.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Path to the app repository root (the folder with `package.json`).
- `stack` (string, required): One of `nextjs`, `vite`, `webpack`. Selects the install procedure.
- `rum_endpoint` (string, required): A same-origin path or full URL that accepts POST bodies, for example `/api/vitals`. The endpoint must already exist or be created by the user's backend team.

---

## Outputs

- `rum_instrumentation` (object): The file path of the reporting module, the import site that loads it, the installed `web-vitals` version, and the beacon payload format.
- `rum_attribution_schema` (object): The exact field names sent per metric (they differ between `web-vitals` major versions), used by `cwv-rum-p75-analysis` to write its SQL.

---

## Phase 1: Install and Pin the Version

### Entry Criteria
- `repo_dir` contains `package.json` and the app builds today (`npm run build` exits 0).

### Actions
1. Install: `npm install web-vitals` (or `pnpm add web-vitals` / `yarn add web-vitals`; use the lockfile that is in the repo: `package-lock.json` = npm, `pnpm-lock.yaml` = pnpm, `yarn.lock` = yarn).
2. Read the installed major version: `node -p "require('./node_modules/web-vitals/package.json').version"`.
3. Open the attribution type definitions and copy the real field names into `rum_attribution_schema`. Do NOT write field names from memory:
   - `node_modules/web-vitals/dist/modules/types/lcp.d.ts`
   - `node_modules/web-vitals/dist/modules/types/inp.d.ts`
   - `node_modules/web-vitals/dist/modules/types/cls.d.ts`
   Known differences: v4 LCP attribution names the element `element`; v5 renamed it `target`. Both expose `timeToFirstByte`, `resourceLoadDelay`, `resourceLoadDuration`, `elementRenderDelay`. INP attribution has `interactionTarget`, `interactionType`, `inputDelay`, `processingDuration`, `presentationDelay`, `loadState`. CLS attribution has `largestShiftTarget`, `largestShiftValue`, `largestShiftTime`, `loadState`. `onFID` was removed in v5; do not call it.
4. Never read a field the `.d.ts` files do not declare.

### Output
Installed version and `rum_attribution_schema` copied from the type files.

### Quality Gate
- `npm ls web-vitals` prints exactly one version.
- Every field name in `rum_attribution_schema` appears in one of the three `.d.ts` files (`grep -n "<field>" node_modules/web-vitals/dist/modules/types/*.d.ts`).

---

## Phase 2: Write the Reporting Module

### Entry Criteria
- Phase 1 schema exists.

### Actions
1. Create ONE new file, for example `src/lib/vitals.ts` (or `.js` if the repo has no TypeScript). Do not edit other files in this phase.
2. Content (adjust field names to the schema from Phase 1):
   ```ts
   import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals/attribution';

   const ENDPOINT = '/api/vitals';

   function send(metric: any) {
     const a = metric.attribution || {};
     const body = JSON.stringify({
       name: metric.name, value: metric.value, rating: metric.rating, id: metric.id,
       navigationType: metric.navigationType, page: location.pathname,
       deviceMemory: (navigator as any).deviceMemory, effectiveType: (navigator as any).connection?.effectiveType,
       lcpTarget: a.target ?? a.element, ttfb: a.timeToFirstByte, resourceLoadDelay: a.resourceLoadDelay,
       resourceLoadDuration: a.resourceLoadDuration, elementRenderDelay: a.elementRenderDelay, lcpUrl: a.url,
       interactionTarget: a.interactionTarget, interactionType: a.interactionType, inputDelay: a.inputDelay,
       processingDuration: a.processingDuration, presentationDelay: a.presentationDelay, loadState: a.loadState,
       largestShiftTarget: a.largestShiftTarget, largestShiftValue: a.largestShiftValue,
     });
     if (!(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body))) {
       fetch(ENDPOINT, { body, method: 'POST', keepalive: true });
     }
   }

   export function initVitals() {
     onLCP(send); onINP(send); onCLS(send); onFCP(send); onTTFB(send);
   }
   ```
3. Keep `reportAllChanges` at its default (false). With the default, each metric reports its final value once per page lifecycle (on visibility change), which is what p75 needs. Setting it true sends many partial values and inflates counts.
4. Replace `/api/vitals` with `rum_endpoint`.
5. Do not add `page` as the full URL with query strings. Use `location.pathname` and map it to a template later to avoid unbounded cardinality and personal data in query strings.

### Output
The reporting module file.

### Quality Gate
- `npx tsc --noEmit` (TypeScript repos) or `npm run build` exits 0.
- The file imports from `web-vitals/attribution`, not `web-vitals` (`grep -n "web-vitals/attribution" <file>`).

---

## Phase 3: Wire It In Per Stack

### Entry Criteria
- Reporting module builds.

### Actions
1. Pick the wiring by `stack`:
   | `stack` | Where to call `initVitals()` |
   |---|---|
   | `nextjs` (App Router, `app/` dir) | Create `app/vitals-client.tsx` with `'use client'` at the top and a component that calls `initVitals()` inside `useEffect(() => { initVitals(); }, [])` and returns `null`. Render it once in `app/layout.tsx`. Do not use `useReportWebVitals` from `next/web-vitals` for this flow: it does not expose the attribution build. |
   | `nextjs` (Pages Router, `pages/` dir) | Call `initVitals()` in a `useEffect` with an empty dependency array inside `pages/_app.tsx`. |
   | `vite` | Call `initVitals()` once at the bottom of the entry file named in `index.html` (usually `src/main.tsx` or `src/main.ts`). |
   | `webpack` | Call `initVitals()` once in the entry module named by `entry` in `webpack.config.js`. |
2. Call it exactly once per page load. In React StrictMode development, effects run twice; that is a dev-only artifact. Test in a production build.
3. Build and serve production: `npm run build` then `npm run start` (Next.js) or `npx vite preview` (Vite) or the repo's static server (webpack).
4. Open the page in Chrome, open DevTools Network, filter by the endpoint path, interact once (click a button), then switch to another tab. Beacons fire on `visibilitychange` to hidden.

### Output
`rum_instrumentation` with file paths, version and payload format.

### Quality Gate
- In the Network panel at least LCP, FCP and TTFB beacons appear after hiding the tab, and INP after an interaction; each payload contains `name` and `value`.
- `grep -rn "initVitals()" <src dirs>` shows exactly one call site.

---

## Worked Example

Illustrative only. Input: `stack` = `vite`, `rum_endpoint` = `/api/vitals`.

Phase 1:
```text
$ node -p "require('./node_modules/web-vitals/package.json').version"
5.1.0
$ grep -n "target\|elementRenderDelay" node_modules/web-vitals/dist/modules/types/lcp.d.ts
    target?: string;
    elementRenderDelay: number;
```
Schema records LCP element field = `target`.

Phase 2: creates `src/lib/vitals.ts`; `npx tsc --noEmit` exits 0.

Phase 3: adds `initVitals();` to the end of `src/main.tsx`. After `npm run build && npx vite preview`, the Network panel shows a POST to `/api/vitals` with `{"name":"LCP","value":1840.2,"rating":"good","lcpTarget":"main>img.hero",...}`.

---

## Exit Criteria

DONE when the attribution build is installed at a recorded version, one reporting module sends all five metrics with schema-verified attribution fields, it is called once in the stack's entry point, and beacons are observed in a production build.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two versions of `web-vitals` in `npm ls` (one pulled by a dependency) | **Adjust**: import from your direct dependency only; record both versions. |
| Phase 2 | Type error on an attribution field | **Adjust**: re-read the `.d.ts`; the field was renamed or does not exist in this version. Do not cast it away with `any` on the wrong name. |
| Phase 3 | No beacons appear | **Retry**: confirm the tab was hidden; check the endpoint returns 2xx for POST; check a Content Security Policy `connect-src` allows it. |
| Phase 3 | Beacons blocked by an ad blocker in testing | **Adjust**: test in a clean profile; note that a share of real users will block the endpoint path if it contains words like `analytics`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
