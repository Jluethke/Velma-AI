# React Native Retry and Offline Cache

**One-line description:** Implements the network policy in React Native with NetInfo wired to TanStack Query's `onlineManager`, per-query `retry`/`retryDelay` from the policy, an AsyncStorage persister so cached data shows offline, paused mutations as the outbox, a `fetch` wrapper with `AbortController` timeouts, and Jest tests with mocked NetInfo.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `network_policy` (object, required): From `mob-network-retry-policy`.

---

## Outputs

- `rn_network_layer` (object): Paths of the query client setup, fetch wrapper, NetInfo bridge, persister config; test results per rule.

---

## Phase 1: Fetch Wrapper and Online Signal

### Entry Criteria
- `app_profile.stack` is `react-native`.
- `@react-native-community/netinfo` is installed, or the user approves adding it (Expo: `npx expo install @react-native-community/netinfo`; bare: `npm i @react-native-community/netinfo` then `cd ios && pod install`).

### Actions
1. `fetch` has no timeout. Write `apiFetch(path, init, timeoutMs)` that composes the caller's `signal` with a timeout `AbortController` and throws a typed error:
```ts
export class HttpError extends Error { constructor(public status: number, public retryAfter: string | null) { super(`HTTP ${status}`); } }
export async function apiFetch(path: string, init: RequestInit & { timeoutMs: number }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), init.timeoutMs);
  init.signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(BASE + path, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new HttpError(res.status, res.headers.get('Retry-After'));
    return res;
  } finally { clearTimeout(t); }
}
```
   `timeoutMs` comes from `network_policy`; record it.
2. Bridge NetInfo to TanStack Query once at app start:
```ts
onlineManager.setEventListener(setOnline => NetInfo.addEventListener(s => setOnline(!!s.isConnected)));
```
   `isInternetReachable` can be `null` before the first check; do not treat `null` as offline.
3. Bridge app focus: `focusManager.setEventListener(handle => { const sub = AppState.addEventListener('change', s => handle(s === 'active')); return () => sub.remove(); })`.
4. If TanStack Query is absent and the user does not approve adding it, implement the same rules in a hand-written loop like the native flows, and skip Phase 2's library specifics.

### Output
Fetch wrapper and bridges.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- `grep -rn "fetch(" src | grep -v apiFetch` shows no API calls bypassing the wrapper.

---

## Phase 2: Query Retry, Persistence and Outbox

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Per query, encode the policy:
```ts
useQuery({ queryKey: ['orders'], queryFn: ({ signal }) => apiFetch('/v1/orders', { signal, timeoutMs }).then(r => r.json()),
  retry: (failureCount, err) => isRetryable(err, policy) && failureCount < policy.maxAttempts - 1,
  retryDelay: (attempt, err) => retryAfterMs(err) ?? Math.random() * Math.min(policy.capMs, policy.baseMs * 2 ** attempt),
});
```
   Library defaults if the policy adopts them: queries `retry: 3` with `retryDelay = Math.min(1000 * 2 ** attemptIndex, 30000)`; mutations `retry: 0` (TanStack Query docs). `isRetryable` returns false for `AbortError` and for HTTP statuses outside `retry_on`.
2. Offline cache: `PersistQueryClientProvider` with `createAsyncStoragePersister({ storage: AsyncStorage })` from `@tanstack/query-async-storage-persister`. Set `gcTime` at least as long as the persister `maxAge`, otherwise restored data is garbage-collected (TanStack persistence docs). Both values are user inputs.
3. Stale indicator: the screen shows `Content(isStale=true)` when `query.isError && query.data !== undefined`, or when `onlineManager.isOnline()` is false and data exists.
4. Outbox for `outbox` endpoints: mutations default to `networkMode: 'online'`, so they pause while offline. Give each mutation a `mutationKey` and register `queryClient.setMutationDefaults(key, { mutationFn })` so paused mutations survive a restart through the persister; call `queryClient.resumePausedMutations()` in the persister's `onSuccess`. Generate the `Idempotency-Key` UUID in `onMutate`-time variables, not inside `mutationFn` (a retry must reuse it).
5. `fail_fast` endpoints use `networkMode: 'always'` and `retry: 0` so the error surfaces at once.

### Output
Query client configuration.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- Every endpoint in `network_policy` maps to one `useQuery`/`useMutation` whose `retry` reads the policy (`grep -c "policy" src/api/*.ts` covers each).

---

## Phase 3: Jest Tests

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Mock NetInfo with the package's jest mock: in `jest.setup.js`, `jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'))`. Mock AsyncStorage with `@react-native-async-storage/async-storage/jest/async-storage-mock`.
2. Mock `global.fetch` with `jest.fn()` returning sequences (503 then 200; 400; network `TypeError`). MSW also supports React Native through `msw/native` if already in the project.
3. Tests: `isRetryable` table; `retryDelay` honors `Retry-After: 2` as 2000 ms; a `QueryClient` with the policy calls `fetch` exactly twice for 503 then 200 (use `jest.useFakeTimers()` and `await jest.runAllTimersAsync()`); a mutation created while `onlineManager.setOnline(false)` is paused and runs after `setOnline(true)`.
4. Run `npx jest src/api`.

### Output
`rn_network_layer`.

### Quality Gate
- Jest prints `Tests: N passed, N total` with no failures, and each test asserts `fetch` call counts (`toHaveBeenCalledTimes`).

---

## Worked Example

Illustrative only. `@tanstack/react-query` 5.x, policy `GET /v1/orders` 4 attempts, base 500, cap 8000; `POST /v1/orders/:id/cancel` as outbox.

Phase 2: persister `maxAge` 24 h and `gcTime` 24 h chosen by the user; cancel mutation key `['cancelOrder']` with defaults registered.

Phase 3:
```
$ npx jest src/api
 PASS  src/api/policy.test.ts
  ✓ 503 then 200 fetches twice (12 ms)
  ✓ honors Retry-After seconds (3 ms)
  ✓ paused cancel mutation runs when back online (9 ms)
Tests:       7 passed, 7 total
```

---

## Exit Criteria

DONE when every API call goes through the timeout wrapper, online state comes from NetInfo, retries and delays follow the policy, cached data persists across restarts, offline writes pause and resume with a stable idempotency key, and Jest proves each rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `RNCNetInfo is null` at runtime | **Adjust**: native module not linked; run `pod install` and rebuild the app (not just reload JS). |
| Phase 2 | Data gone after restart although persisted | **Adjust**: `gcTime` shorter than persister `maxAge`; align them. |
| Phase 2 | Paused mutations lost on restart | **Adjust**: `setMutationDefaults` for that key is missing; functions are not serialized. |
| Phase 3 | Tests hang with fake timers | **Adjust**: use `jest.runAllTimersAsync()`; synchronous `runAllTimers` does not flush promises. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
