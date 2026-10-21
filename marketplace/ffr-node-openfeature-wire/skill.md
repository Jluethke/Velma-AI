# Node.js OpenFeature Server SDK Wiring

**One-line description:** Adds `@openfeature/server-sdk` and the chosen provider to one Node.js or TypeScript service, awaits provider readiness once at startup with `setProviderAndWait`, and replaces one code decision with a typed flag evaluation that passes the safe default and a targeting key.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`.
- `flagd_config` (object, optional): Output of `ffr-flagd-local-setup` when the provider is flagd.
- `unleash_config` (object, optional): Output of `ffr-unleash-setup` when the provider is Unleash.
- `launchdarkly_config` (object, optional): Output of `ffr-launchdarkly-setup` when the provider is LaunchDarkly.
- `repo_path` (string, required): Root of the Node.js service.

---

## Outputs

- `node_flag_wiring` (object): Packages and versions added, the startup file, every call site that evaluates the flag with its default, and the test run result.

---

## Phase 1: Install and Register the Provider

### Entry Criteria
- The provider config matching `provider_choice.provider` is present.

### Actions
1. Detect the package manager from the lockfile: `package-lock.json` means npm, `pnpm-lock.yaml` means pnpm, `yarn.lock` means Yarn. Use only that tool.
2. Add the SDK and the confirmed provider. For flagd with npm: `npm install @openfeature/server-sdk @openfeature/flagd-provider`. For LaunchDarkly: `@launchdarkly/openfeature-node-server` (plus the LaunchDarkly server SDK it lists as a peer dependency).
3. In the entry file (`src/index.ts`, `server.js`, or the file that calls `listen`), register before the server starts accepting requests:
```ts
import { OpenFeature } from '@openfeature/server-sdk';
import { FlagdProvider } from '@openfeature/flagd-provider';

await OpenFeature.setProviderAndWait(new FlagdProvider({
  host: process.env.FLAGD_HOST ?? 'localhost',
  port: 8013,
}));
app.listen(port);
```
4. Decide what happens if the provider fails to become ready. `setProviderAndWait` rejects on provider error. Use this rule: if the service can run with every flag at its safe default, catch the error, log it, and start anyway; if not (permission flags guard access), let startup fail. Write which rule you used.
5. Register a shutdown hook: `process.on('SIGTERM', async () => { await OpenFeature.close(); ... })` so streams and timers stop cleanly.

### Output
Provider registered once.

### Quality Gate
- `rg -n "setProvider(AndWait)?\(" src` returns exactly one line outside tests.
- `node -e "require.resolve('@openfeature/server-sdk')"` exits 0 (for ESM-only projects use `node --input-type=module -e "await import('@openfeature/server-sdk')"`).

---

## Phase 2: Replace One Decision with a Flag Evaluation

### Entry Criteria
- Provider registered.

### Actions
1. Create `src/flags.ts` with the key and default as constants:
```ts
export const CHECKOUT_NEW_TAX_ENGINE = 'checkout-new-tax-engine';
export const CHECKOUT_NEW_TAX_ENGINE_DEFAULT = false;
```
2. At the decision point:
```ts
import { OpenFeature } from '@openfeature/server-sdk';
import * as flags from './flags';

const client = OpenFeature.getClient();
const useV2 = await client.getBooleanValue(
  flags.CHECKOUT_NEW_TAX_ENGINE,
  flags.CHECKOUT_NEW_TAX_ENGINE_DEFAULT,
  { targetingKey: String(user.id), country: user.country, plan: user.plan },
);
const total = useV2 ? taxEngineV2.compute(cart) : taxEngineV1.compute(cart);
```
3. Always `await` the evaluation. Server SDK evaluation methods return a Promise; `if (client.getBooleanValue(...))` without `await` is always truthy and silently turns the feature on for everyone. This is the most common mistake in this flow.
4. Use the method that matches `flag_spec.value_type`: `getBooleanValue`, `getStringValue`, `getNumberValue`, `getObjectValue`.
5. For per-request context in frameworks, the SDK supports transaction context propagation (`OpenFeature.setTransactionContextPropagator(new AsyncLocalStorageTransactionContextPropagator())`). Use it only if many call sites need the same request context; otherwise pass context explicitly as above.
6. Change one call site, run tests, then the next. Keep the old code path.

### Output
One call site using the flag.

### Quality Gate
- `rg -n "getBooleanValue\(" src` shows every call preceded by `await` on the same line or assigned from an awaited expression.
- If the project uses TypeScript with `@typescript-eslint/no-floating-promises` or `no-misused-promises`, `npx eslint src` reports no errors for the changed files.

---

## Phase 3: Run Type Check and Tests

### Entry Criteria
- Call site changed.

### Actions
1. Run `npx tsc --noEmit` for TypeScript projects.
2. Run the test script: `npm test` (or `pnpm test`, `yarn test`).
3. Tests must not reach a real flag service; the in-memory provider fixture is added in `ffr-both-paths-test`. Do not skip, delete, or weaken a failing test.

### Output
`node_flag_wiring`.

### Quality Gate
- `npx tsc --noEmit` exits 0 (TypeScript projects).
- The test command exits 0, with its summary line recorded.
- `git diff --stat` shows no deleted test files and no new `.skip` or `xit`.

---

## Worked Example

Illustrative only.

```
$ npm install @openfeature/server-sdk @openfeature/flagd-provider
added 6 packages in 3s
$ rg -n "setProvider(AndWait)?\(" src
src/index.ts:12:await OpenFeature.setProviderAndWait(new FlagdProvider({ host: process.env.FLAGD_HOST ?? 'localhost', port: 8013 }));
$ npx tsc --noEmit
$ npm test
Tests:       88 passed, 88 total
```
Startup rule recorded: "service runs with all flags at safe default; provider errors are logged and startup continues."

---

## Exit Criteria

DONE when the provider is registered once with readiness handled by a written rule, one call site awaits a typed evaluation with the shared default, and type check and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Top-level `await` not allowed (CommonJS) | **Adjust**: wrap startup in an `async function main()` and call it; do not drop the await. |
| Phase 1 | Peer dependency warning for the LaunchDarkly provider | **Adjust**: install the exact peer package named in the warning. |
| Phase 2 | Flag always on in local testing | **Stop**: check for a missing `await`; fix before continuing. |
| Phase 3 | Tests time out connecting to flagd | **Adjust**: tests must use the in-memory provider; add a temporary fixture that sets it before importing the app. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
