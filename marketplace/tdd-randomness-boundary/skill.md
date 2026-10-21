# TDD Randomness Boundary

**One-line description:** Makes code that uses random numbers, shuffles or generated ids deterministic under test by injecting a seeded generator or id factory per stack, and test-drives it with exact-output and property assertions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `double_plan` (object[], required): From `tdd-test-double-choice`; rows with role random source and the `boundaries` list.
- `stack` (string, required): `python`, `node`, `go`, `rust` or `java`.

---

## Outputs

- `random_tests` (object): The seam added (file, signature), the tests written, and the run output from two consecutive runs showing identical results.

---

## Phase 1: Find Every Random Source

### Entry Criteria
- `double_plan.boundaries` contains `randomness`, or a random source collaborator is listed.

### Actions
1. Search the unit for:

| stack | Search pattern |
|---|---|
| python | `random.`, `secrets.`, `uuid.uuid4`, `np.random`, `os.urandom` |
| node | `Math.random`, `crypto.randomUUID`, `crypto.getRandomValues`, `crypto.randomBytes`, `nanoid`, `uuid` |
| go | `math/rand`, `math/rand/v2`, `crypto/rand`, `uuid.New` |
| rust | `rand::random`, `thread_rng`, `rand::rng`, `Uuid::new_v4`, `OsRng` |
| java | `Math.random`, `new Random()`, `ThreadLocalRandom`, `UUID.randomUUID`, `SecureRandom` |

2. Record each hit. Classify it: VALUE (random number, choice, shuffle) or ID (unique identifier, token).

### Output
List of random sources with class.

### Quality Gate
- Search results (or "none") are recorded for every file of the unit.

---

## Phase 2: Inject a Seeded Generator or Id Factory

### Entry Criteria
- At least one hit.

### Actions
1. Add the seam, one hit per step, full suite green after each:

| stack | VALUE seam (tests pass a seeded instance) | ID seam |
|---|---|---|
| python | parameter `rng: random.Random`; tests use `random.Random(1234)`. For NumPy: `np.random.default_rng(1234)` passed in | parameter `new_id: Callable[[], str] = lambda: str(uuid.uuid4())`; tests pass a counter |
| node | parameter `rng: () => number = Math.random` (Math.random cannot be seeded); tests pass a function returning a fixed sequence | parameter `newId: () => string = () => crypto.randomUUID()` |
| go | field `rng *rand.Rand`; tests use `rand.New(rand.NewPCG(1, 2))` (math/rand/v2) or `rand.New(rand.NewSource(1))` (math/rand) | field `newID func() string` |
| rust | generic `R: rand::Rng` parameter; tests use `rand_chacha::ChaCha8Rng::seed_from_u64(1)` (with `use rand::SeedableRng`) | closure `Fn() -> String` or trait |
| java | constructor parameter `java.util.random.RandomGenerator` (Java 17+) or `java.util.Random`; tests use `new Random(1)` | `Supplier<UUID>` |

2. Do NOT seed the global generator in tests (`random.seed(...)`, `rand.Seed(...)`): other tests share it, so order changes the result. `rand.Seed` is deprecated since Go 1.20.
3. Rust note: the rand docs state `StdRng`'s algorithm may change between rand versions, so its seeded output is not stable across upgrades. Use a named algorithm crate such as `rand_chacha` when exact values are asserted.
4. Security values (`secrets`, `crypto/rand`, `SecureRandom`, `OsRng`) stay cryptographically secure in production. Inject them behind the same seam, but never replace the production default with a seeded generator.

### Output
Seam in place, suite green.

### Quality Gate
- Phase 1 search, rerun excluding seam defaults, finds no direct random calls in the unit.
- Full suite exit code 0.

---

## Phase 3: Drive Random Behaviors

### Entry Criteria
- Seam in place.

### Actions
1. Choose the assertion style per behavior:

| Behavior | Assertion |
|---|---|
| Exact pick depends on the generator (draw a winner) | Use a stub generator returning a chosen value (`rng = lambda: 0.0`) and assert the exact result for that value; add one test per edge value (lowest, highest) |
| Shuffle | Assert a property: same length, same multiset (`sorted(out) == sorted(in)`), and input not mutated if required |
| Distribution ("about 10 percent get variant B") | Do NOT assert a ratio from one seeded run. Test the mapping function: value below the cut goes to B, value at or above goes to A, with the cut taken from the requirement |
| Unique ids | Inject a counter factory and assert the stored record has id `"id-1"`; separately test that two calls produce different ids with the real factory |

2. Run the test file twice in a row. Both runs must print the same results.
3. Edge values for a `[0, 1)` generator are `0.0` and the largest value below 1; do not pass `1.0`, which the real generator never returns.

### Output
`random_tests`.

### Quality Gate
- Two consecutive runs of the random tests both pass.
- No test asserts a statistical ratio from a single sample.

---

## Worked Example

Illustrative only. `stack` = `node`, `pickReviewer(team)` uses `Math.random()`.

Phase 1: one VALUE hit, `src/review.ts:12`.
Phase 2: signature becomes `pickReviewer(team: string[], rng: () => number = Math.random)`.
Phase 3:

```ts
it('picks the first member when rng returns 0', () => {
  expect(pickReviewer(['ana', 'bo', 'cy'], () => 0)).toBe('ana');
});
it('picks the last member when rng returns just below 1', () => {
  expect(pickReviewer(['ana', 'bo', 'cy'], () => 0.9999999)).toBe('cy');
});
```

`npx vitest run src/review.test.ts` twice: `Tests  2 passed (2)` both times.

---

## Exit Criteria

DONE when every random source in the unit is injectable, tests are deterministic across reruns, and distributions are tested through their mapping rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | A library generates ids internally with no hook | **Adjust**: wrap the library call in an owned id factory and inject that. |
| Phase 2 | Seeded values change after a dependency upgrade | **Adjust**: switch exact-value tests to a stub generator or a version-stable algorithm. |
| Phase 3 | Test passes on one run, fails on another | **Stop**: a random source is still unseamed; rerun the Phase 1 search. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
