# Ledger Node fast-check Property Tests

**One-line description:** Writes fast-check property tests (with Vitest or Jest) for a JavaScript or TypeScript ledger that check balanced entries, sum-preserving `bigint` allocation, net-zero reversals, idempotent replays and balance equality, using `fc.bigInt` bounds from the storage type and seed plus path replay for failures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `posting_service` (object, required): Output of `ledg-pg-idempotent-posting`.
- `allocation_function` (object, required): Output of `ledg-allocate-remainder`.

---

## Outputs

- `node_property_tests` (object): Test file paths, properties and arbitraries, the test command, the run summary, and any counterexample found with its fix.

---

## Phase 1: Pure Properties

### Entry Criteria
- `fast-check` is a dev dependency (`npm ls fast-check` prints a version); add it with `npm i -D fast-check` after user approval.
- The test runner passes before adding tests (`npx vitest run` or `npx jest`).

### Actions
1. Create `test/ledger.property.test.ts`. Use `bigint` arbitraries so values above 2^53 are covered: `fc.bigInt({ min: -MAX_ABS, max: MAX_ABS })` where `MAX_ABS = (2n ** 63n - 1n) / BigInt(n)` and `n` is the largest posting count the API accepts.
2. Allocation:
```
import fc from 'fast-check';
test('allocate sums to total', () => {
  fc.assert(fc.property(
    fc.bigInt({ min: -MAX_ABS, max: MAX_ABS }),
    fc.array(fc.nat({ max: 1_000_000 }), { minLength: 1 }).map(w => [...w.slice(0, -1), w[w.length - 1] + 1]),
    (total, weights) => {
      const parts = allocate(total, weights.map(BigInt));
      return parts.reduce((a, b) => a + b, 0n) === total && parts.length === weights.length;
    }));
});
```
The `.map(...)` forces a positive last weight so no sample is filtered out. The `max` on weights is a test-input range; set it to what callers send.
3. Canonical hash property: shuffled postings (`fc.shuffledSubarray` with full length, or sort by a generated key) give the same hash; adding `1n` to any amount changes it.
4. Parser property: for any `bigint` m and a currency exponent e, `parseDecimalString(format(m, e), cur).minor === m`.
5. Run the test command. fast-check's default `numRuns` is 100; change it with `fc.assert(prop, { numRuns })` only by user choice.

### Output
Pure properties passing.

### Quality Gate
- The test command exits 0 and lists each property test as passed.
- No `number` arbitrary is used for money amounts: `rg -n "fc\.(integer|float|double)\(" test/ledger.property.test.ts` returns no money hits.

---

## Phase 2: Database Properties

### Entry Criteria
- Phase 1 passes; a test PostgreSQL database with the ledger schema is reachable.

### Actions
1. Use `fc.asyncProperty` with `await fc.assert(...)`. Each run opens a client from a `pg.Pool`, runs `BEGIN`, performs the actions, asserts, then `ROLLBACK` and releases the client in `finally`.
2. Generate an action list: `fc.array(fc.oneof(postArb, replayArb, reverseArb))`, or use fast-check model-based testing (`fc.commands` with `fc.asyncModelRun`; check the fast-check docs for your version's signatures).
3. After each action, assert per-currency posting sum is `0n` (read `sum` as a string from node-postgres and convert with `BigInt`), replay inserted no rows, and reversal netted the original account sums to `0n`.
4. On failure fast-check prints `Counterexample`, `seed` and `path`. Reproduce with `fc.assert(prop, { seed, path, endOnFailure: true })`, fix, then add the counterexample as a plain `test(...)` regression and remove the seed.
5. Do not loosen arbitraries, wrap assertions in try/catch, or lower `numRuns` to pass.

### Output
`node_property_tests`.

### Quality Gate
- The full test command exits 0.
- `rg -n "seed:" test/` returns nothing after the fix.

---

## Worked Example

Illustrative only.
```
$ npx vitest run test/ledger.property.test.ts
 ✓ test/ledger.property.test.ts (4 tests) 812ms
 Test Files  1 passed (1)
      Tests  4 passed (4)
```
An earlier run failed with:
```
Property failed after 37 tests
{ seed: 1309476421, path: "36:2:1", endOnFailure: true }
Counterexample: [-1n,[0,1]]
```
`allocate(-1n, [0n, 1n])` returned `[-1n, 0n]` because the sign was applied before choosing remainder indexes; the fix negated after distribution and a regression test was added.

---

## Exit Criteria

DONE when pure and database properties pass with `bigint` amounts, found counterexamples are regression tests, and no seed pin or loosened arbitrary remains.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `TypeError: Cannot mix BigInt and other types` in code under test | **Stop**: a money path still uses `number`; fix the code. |
| Phase 2 | Test times out | **Adjust**: raise the runner's per-test timeout for this file only; keep `numRuns`. |
| Phase 2 | Property fails | **Stop**: replay with seed and path and fix the code; never delete the property. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
