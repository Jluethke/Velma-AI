# React OpenFeature Web SDK Wiring

**One-line description:** Adds `@openfeature/react-sdk` with a browser-safe provider to one React app, sets the static evaluation context for the signed-in user, wraps the tree in `OpenFeatureProvider`, and replaces one UI decision with `useBooleanFlagValue` while keeping server-side enforcement for anything that matters.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`; must name a client-side path.
- `flagd_config` (object, optional): Output of `ffr-flagd-local-setup` when the provider is flagd (browser uses OFREP or the flagd web provider).
- `unleash_config` (object, optional): Output of `ffr-unleash-setup` when the provider is Unleash (browser uses the Frontend API or Unleash Edge).
- `launchdarkly_config` (object, optional): Output of `ffr-launchdarkly-setup` when the provider is LaunchDarkly (browser uses the client-side ID).
- `repo_path` (string, required): Root of the React app.

---

## Outputs

- `react_flag_wiring` (object): Packages added, where the provider and context are set, every component that reads the flag with its default, the loading behavior chosen, and the test and build results.

---

## Phase 1: Install and Set the Provider and Context

### Entry Criteria
- `provider_choice` names a browser path, and the matching config is present.

### Actions
1. If `flag_spec.type` is `permission`, record that the browser flag only hides UI. The API must check the same permission on the server. Do not continue until a server-side check exists or is tracked as an open question.
2. Install with the project's package manager: `npm install @openfeature/react-sdk @openfeature/web-sdk` plus the browser provider (flagd via OFREP: `@openfeature/ofrep-web-provider`; or the provider named in `provider_choice`). Confirm each with `npm view <name> version` first.
3. Web SDKs use the static context paradigm: the provider evaluates all flags for one context and caches them; changing the context triggers a re-fetch. Set the context when the user is known:
```tsx
import { OpenFeature } from '@openfeature/react-sdk';
import { OFREPWebProvider } from '@openfeature/ofrep-web-provider';

OpenFeature.setProvider(new OFREPWebProvider({ baseUrl: import.meta.env.VITE_OFREP_URL }));
// after login:
await OpenFeature.setContext({ targetingKey: user.id, plan: user.plan });
```
4. Wrap the app once, in the root component:
```tsx
<OpenFeatureProvider>
  <App />
</OpenFeatureProvider>
```
5. Never put a server SDK key, LaunchDarkly SDK key, or Unleash backend or admin token in a `VITE_`, `NEXT_PUBLIC_`, or `REACT_APP_` variable. Those are inlined into the bundle.

### Output
Provider, context, and root wrapper in place.

### Quality Gate
- `rg -n "OpenFeatureProvider" src` shows exactly one JSX usage at the root.
- `npm run build` then `rg -n "sdk-[0-9a-f]{8}-|:production\.[0-9a-f]{16,}" dist build` (whichever output folder exists) returns nothing.

---

## Phase 2: Read the Flag in One Component

### Entry Criteria
- Provider wrapper in place.

### Actions
1. Put the key and default in `src/flags.ts`, as in the server stacks.
2. In the component:
```tsx
import { useBooleanFlagValue } from '@openfeature/react-sdk';
import { CHECKOUT_NEW_TAX_ENGINE, CHECKOUT_NEW_TAX_ENGINE_DEFAULT } from '../flags';

export function TaxSummary() {
  const showV2 = useBooleanFlagValue(CHECKOUT_NEW_TAX_ENGINE, CHECKOUT_NEW_TAX_ENGINE_DEFAULT);
  return showV2 ? <TaxSummaryV2 /> : <TaxSummaryV1 />;
}
```
3. Choose loading behavior with this rule. If showing the default for a moment then switching is acceptable, use the hook as above (the component re-renders when the provider is ready). If a visible flip would confuse users (layout swap, pricing text), use the SDK's suspense option (check the `@openfeature/react-sdk` README for the current option name) and wrap the subtree in `<Suspense fallback=...>`.
4. Do not call the hook conditionally or inside loops; React hook rules apply.
5. One component at a time; keep the old component.

### Output
One component reading the flag.

### Quality Gate
- `npx eslint src` reports no `react-hooks/rules-of-hooks` errors in changed files.
- The component file imports the default from `src/flags.ts`, not a literal.

---

## Phase 3: Test and Build

### Entry Criteria
- Component changed.

### Actions
1. Run the type check (`npx tsc --noEmit`) and tests (`npm test`).
2. In component tests, wrap renders with `<OpenFeatureProvider>` and an in-memory provider (added fully in `ffr-both-paths-test`). Do not mock the hook module globally to a fixed value; that hides the default path.
3. Run `npm run build` and confirm it succeeds.

### Output
`react_flag_wiring`.

### Quality Gate
- Type check, tests, and build each exit 0, with their summary lines recorded.
- No test file deleted, no `.skip` added (`git diff --stat` and `rg -n "\.skip\(" src` checked).

---

## Worked Example

Illustrative only.

```
$ npm view @openfeature/react-sdk version
1.0.0
$ rg -n "OpenFeatureProvider" src
src/main.tsx:14:    <OpenFeatureProvider>
$ npm run build && rg -n "sdk-[0-9a-f]{8}-" dist
vite v5 building for production...
✓ built in 4.12s
$
```
Loading rule: tax summary uses suspense because the totals visibly change; banner flags use the plain hook.

---

## Exit Criteria

DONE when one root `OpenFeatureProvider` exists, the context carries a stable targeting key, one component reads the flag with the shared default and a chosen loading behavior, no secret key is in the bundle, and tests and build pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Permission flag with no server check | **Stop**: add or track the server-side check first. |
| Phase 1 | Secret key found in the build output | **Stop**: remove it, rotate the key, rebuild. |
| Phase 2 | UI flickers between variants | **Adjust**: switch that subtree to the suspense option. |
| Phase 3 | Test fails with "no provider" | **Adjust**: wrap the render in `OpenFeatureProvider` with an in-memory provider. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
