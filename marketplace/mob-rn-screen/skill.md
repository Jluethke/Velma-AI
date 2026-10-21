# React Native Screen From a State Machine

**One-line description:** Implements one React Native screen in TypeScript with a discriminated-union state, a pure exhaustively-checked reducer driven by `useReducer`, effects in `useEffect` with `AbortController` cleanup, focus-aware refresh through React Navigation, and `testID`s that Detox uses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`; read `libraries.state` and `libraries.networking`.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`.

---

## Outputs

- `rn_screen_impl` (object): Paths of the reducer and screen files, the state approach chosen, `tsc` and Jest exit codes.

---

## Phase 1: Pick the State Approach and Write the Reducer

### Entry Criteria
- `app_profile.stack` is `react-native`.
- `npx tsc --noEmit` exits 0 at baseline (or its errors are listed in `preexisting_failures`).

### Actions
1. Decide from `app_profile.libraries.state`:

| Present | Reducer lives in |
|---|---|
| XState | a machine definition with the same states/events |
| Redux Toolkit | a `createSlice` whose reducers follow the table |
| anything else or none | `useReducer` with the pure function below |

   If `@tanstack/react-query` is present, server data comes from `useQuery` and the reducer models only the screen's own states and events; do not copy query data into a second store.
2. Create `src/screens/orders/ordersReducer.ts`:
```ts
export type State =
  | { status: 'loading' }
  | { status: 'content'; items: Order[]; isRefreshing: boolean; isStale: boolean }
  | { status: 'empty' }
  | { status: 'error'; kind: ErrorKind };
export type Event =
  | { type: 'APPEAR' } | { type: 'REFRESH' } | { type: 'RETRY' }
  | { type: 'LOAD_SUCCEEDED'; items: Order[] } | { type: 'LOAD_FAILED'; kind: ErrorKind };
export type Effect = { type: 'load' } | { type: 'cancelLoad' } | { type: 'showMessage'; text: string };

export function reduce(s: State, e: Event): [State, Effect[]] {
  switch (s.status) {
    case 'error':
      if (e.type === 'RETRY') return [{ status: 'loading' }, [{ type: 'load' }]];
      return [s, []];
    // one case per state; one if per non-ignored cell
    default: {
      const _exhaustive: never = s;   // compile error if a state is missing
      return [_exhaustive, []];
    }
  }
}
```
3. The reducer file imports no React and no React Native modules.

### Output
`ordersReducer.ts`.

### Quality Gate
- `npx tsc --noEmit` exits 0 (the `never` check proves every state is handled).
- `grep -c "from 'react" src/screens/orders/ordersReducer.ts` prints 0.

---

## Phase 2: Screen Component and Effects

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Store effects with the state so they run after render:
```tsx
const [model, dispatch] = useReducer(
  (m: { s: State; fx: Effect[] }, e: Event) => { const [s, fx] = reduce(m.s, e); return { s, fx }; },
  { s: { status: 'loading' }, fx: [{ type: 'load' }] });

useEffect(() => {
  const ctrl = new AbortController();
  for (const fx of model.fx) {
    if (fx.type === 'load') {
      api.fetchOrders({ signal: ctrl.signal })
        .then(items => dispatch({ type: 'LOAD_SUCCEEDED', items }))
        .catch(err => { if (err.name !== 'AbortError') dispatch({ type: 'LOAD_FAILED', kind: toKind(err) }); });
    }
  }
  return () => ctrl.abort();   // runs on unmount and before the next effects
}, [model.fx]);
```
   The reducer must return a new `fx` array only when there are new effects; returning `[]` each time creates a new array, so keep the previous `fx` reference when `fx` is empty or the effect reruns.
2. Refresh on focus only if the table says so: `useFocusEffect(useCallback(() => { dispatch({ type: 'APPEAR' }); }, []))` from `@react-navigation/native`.
3. Render with a `switch (model.s.status)`. For lists use `FlatList` with `refreshing={s.isRefreshing}` and `onRefresh={() => dispatch({ type: 'REFRESH' })}`.
4. Add `testID="orders.error"` (and the other ids from `screen_state_machine.test_cases`) to the root `View` of each state and to the retry `Pressable`.
5. Do NOT: call `setState` or `dispatch` after unmount (the abort check prevents it); put `fetch` inside the reducer; use `any` to silence a type error; edit navigation files for other screens.

### Output
Screen component.

### Quality Gate
- `npx tsc --noEmit` exits 0 and `npx eslint src/screens/orders --max-warnings 0` exits 0 (if ESLint is configured in `package.json`).
- Each test id appears: `grep -c 'testID="orders\.' src/screens/orders/OrdersScreen.tsx` is at least the state count.

---

## Phase 3: Jest Tests for the Reducer

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Create `ordersReducer.test.ts` with `it.each` over the test cases:
```ts
it.each([
  [{ status: 'error', kind: 'offline' }, { type: 'RETRY' }, { status: 'loading' }, [{ type: 'load' }]],
] as const)('%o + %o', (s, e, want, fx) => { expect(reduce(s as State, e as Event)).toEqual([want, fx]); });
```
2. Run `npx jest src/screens/orders`.

### Output
`rn_screen_impl`.

### Quality Gate
- Jest prints `Tests: N passed, N total` with N equal to the case count and no `failed`.

---

## Worked Example

Illustrative only. Orders screen, `@tanstack/react-query` present, no XState or Redux.

Phase 1: `useReducer` approach; reducer models refresh/retry/empty, `useQuery` owns `items`. `npx tsc --noEmit` exit 0.

Phase 2: `grep -c 'testID="orders\.'` prints 5.

Phase 3:
```
$ npx jest src/screens/orders
 PASS  src/screens/orders/ordersReducer.test.ts
Tests:       23 passed, 23 total
```

---

## Exit Criteria

DONE when the reducer is exhaustively typed and pure, effects abort on unmount, every state has a `testID`, and type check, lint and Jest are green.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Type 'X' is not assignable to type 'never'` | **Adjust**: add the missing state case; this is the check working. |
| Phase 2 | `Can't perform a React state update on an unmounted component` warning | **Adjust**: confirm the effect cleanup calls `ctrl.abort()` and the catch ignores `AbortError`. |
| Phase 2 | Effect loops forever | **Adjust**: the reducer returns a new `fx` array every time; keep the old reference when empty. |
| Phase 3 | Jest fails to transform a native module | **Adjust**: the reducer imports React Native; move that import out of the reducer file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
