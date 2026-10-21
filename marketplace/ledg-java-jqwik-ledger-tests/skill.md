# Ledger Java jqwik Property Tests

**One-line description:** Writes jqwik property tests on the JUnit Platform for a Java ledger that check balanced entries, sum-preserving allocation, net-zero reversals, idempotent replays and balance equality, with generators bounded by `long` overflow limits and seed-based reproduction of failures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `posting_service` (object, required): Output of `ledg-pg-idempotent-posting`.
- `allocation_function` (object, required): Output of `ledg-allocate-remainder`.

---

## Outputs

- `java_property_tests` (object): Test class paths, properties and their arbitraries, the build command, run summary, and any shrunk failing sample with its fix.

---

## Phase 1: Pure Properties

### Entry Criteria
- The build runs tests on the JUnit Platform (`./mvnw -q test` or `./gradlew test` passes).
- jqwik is a test dependency (`net.jqwik:jqwik`), added with the user's approval at a version listed on jqwik.net.

### Actions
1. Create `LedgerProperties.java` in the test tree.
2. Derive bounds from `long`: with at most `n` postings per entry, amounts are within `Long.MAX_VALUE / n`. Put `n` in a constant with a comment that cites your API limit.
3. Allocation:
```
@Property
void allocationSumsToTotal(@ForAll("totals") long total,
                           @ForAll @Size(min = 1, max = 20) List<@IntRange(min = 0, max = 1_000_000) Integer> weights) {
    Assume.that(weights.stream().anyMatch(w -> w > 0));
    long[] parts = Money.allocate(total, weights);
    assertThat(Arrays.stream(parts).sum()).isEqualTo(total);
}
@Provide Arbitrary<Long> totals() { return Arbitraries.longs().between(-MAX_ABS, MAX_ABS); }
```
The size and weight ranges are test-input ranges; set them to what callers send. Prefer building a positive weight into the arbitrary over `Assume` if jqwik reports too many rejected samples.
4. Balanced builder property and canonical hash property as plain `@Property` methods (hash unchanged under shuffle via `Collections.shuffle` with a jqwik-provided `Random`; changed by any one-unit amount change).
5. Run `./mvnw -q test -Dtest=LedgerProperties` or `./gradlew test --tests LedgerProperties`. jqwik's default is 1000 tries per property; the report lists `tries`, `checks` and `seed` per property.

### Output
Pure properties passing.

### Quality Gate
- The test command exits 0.
- The jqwik report for each property shows `checks` greater than 0 and no `EXHAUSTED` status.

---

## Phase 2: Database Properties

### Entry Criteria
- Phase 1 passes; a test PostgreSQL database (for example via Testcontainers `org.testcontainers:postgresql`) with the ledger schema is available.

### Actions
1. One container for the class; each try runs in a transaction rolled back at the end (`connection.setAutoCommit(false)` then `rollback()` in a `finally` block). jqwik does not run JUnit Jupiter `@BeforeEach` for each try; use jqwik lifecycle annotations (`@BeforeTry`, `@AfterTry`) for per-try setup.
2. Sequence property: generate a list of actions (`post`, `replay`, `reverse`) with `Arbitraries.oneOf` or jqwik's stateful `ActionChain` support (check your jqwik version's user guide for the stateful API). After each action assert: per-currency posting sum is 0; replay inserted no rows; reversal netted the original to 0 per account.
3. If `account_balances` exists, assert it equals posting sums after the sequence.
4. On failure, jqwik prints the shrunk sample and the `seed`. Reproduce with `@Property(seed = "<seed>")` while fixing, then convert the shrunk sample into a plain `@Example` regression test and remove the seed pin.
5. Do not loosen arbitraries, add `Assume` calls, or reduce `tries` to pass.

### Output
`java_property_tests`.

### Quality Gate
- The full test command exits 0 with 0 failures.
- No `@Property(seed = ...)` pin remains: `rg -n 'seed\s*=' src/test` returns nothing.

---

## Worked Example

Illustrative only.
```
$ ./gradlew test --tests LedgerProperties
timestamp = 2026-10-21T10:02:11, LedgerProperties:allocationSumsToTotal =
                              |-----------------------jqwik-----------------------
tries = 1000                  | # of calls to property
checks = 1000                 | # of not rejected calls
seed = -3871465599413202917   | random seed to reproduce generated values
BUILD SUCCESSFUL
```
A failing run showed a shrunk sample `[4611686018427387903, [3, 1]]` where `total * weight` overflowed `long` and the parts no longer summed to the total; the fix added the `Math.multiplyExact` check with a `BigInteger` fallback, and an `@Example` regression test was added.

---

## Exit Criteria

DONE when pure and database properties pass, every found failure has an `@Example` regression test, and no seed pin or loosened generator remains.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Property status `EXHAUSTED` | **Adjust**: build valid values in the arbitrary instead of rejecting with `Assume`. |
| Phase 2 | Docker unavailable for Testcontainers | **Adjust**: point the tests at a dedicated test database URL from an environment variable. |
| Phase 2 | Property fails | **Stop**: reproduce with the seed and fix the code; never delete the property. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
