# Random Seed Pinning

**One-line description:** Makes randomness in tests reproducible per stack by printing the seed on every run and replaying it (pytest-randomly, Hypothesis, Faker, fast-check, `math/rand`), and removes hidden nondeterminism that no seed controls: Go map iteration, Python set order under `PYTHONHASHSEED`, and SQL results without `ORDER BY`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Varying input values or seed-dependent failures.
- `flake_class` (string, required): Must be `randomness`.
- `baseline_command` (string, required): Reproduction.
- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.

---

## Outputs

- `seed_fix_diff` (string): Unified diff with a note per hunk naming the random source made reproducible or the ordering assumption removed.

---

## Phase 1: Inventory Random Sources

### Entry Criteria
- `flake_class` is `randomness`. Otherwise return an empty diff.

### Actions
1. Grep by stack:
   - python: `grep -rn -E "import random|random\.|numpy\.random|np\.random|Faker\(|factory\.|hypothesis|uuid4\(|secrets\.|set\(|frozenset\(" <test and product files>`
   - node: `grep -rn -E "Math\.random|crypto\.random|randomUUID|faker|fast-check|fc\.assert|Object\.keys|new Set\(" <files>`
   - go: `grep -rn -E "math/rand|crypto/rand|rand\.|range .*map|uuid\.New" <files>`
2. Classify each:

| Source | Seedable | Note |
|---|---|---|
| Python `random`, NumPy legacy global, Faker, factory_boy | yes | pytest-randomly reseeds them before each test when installed |
| NumPy `default_rng()` without seed | yes, pass a seed | Not reset by pytest-randomly if created at import time |
| Hypothesis | yes | Prints a reproduction on failure |
| Python `set` / `dict` of `str` keys iteration order | via `PYTHONHASHSEED` | `set` order of strings varies per process unless `PYTHONHASHSEED` is fixed; `dict` preserves insertion order and is not affected |
| `uuid4()`, `secrets` | no | Tests must not assert on their values |
| JS `Math.random` | no built-in seed | Inject an RNG, or stub with `jest.spyOn(Math, 'random')` |
| `@faker-js/faker` | `faker.seed(n)` | |
| fast-check | `fc.assert(prop, { seed, path })` | Prints seed and path on failure |
| Go `math/rand` top-level functions | auto-seeded randomly since Go 1.20; `rand.Seed` deprecated | Use `rand.New(rand.NewSource(seed))` or `math/rand/v2` `rand.New(rand.NewPCG(s1, s2))` |
| Go `range` over a map | no | Iteration order is deliberately randomized by the runtime |
| SQL `SELECT` without `ORDER BY` | no | Row order is unspecified by the SQL standard |

### Output
Source list.

### Quality Gate
- Each failing assertion is linked to one listed source by file:line.

---

## Phase 2: Make It Reproducible

### Entry Criteria
- Source list exists.

### Actions
1. Rule: a seed is printed on every run and accepted as input; it is not hard-coded to one value forever. A fixed seed hides the inputs that fail; a printed seed lets anyone replay them.
2. By stack:
   - python: keep pytest-randomly installed; it prints `Using --randomly-seed=<n>` and replays with `--randomly-seed=<n>`. For Hypothesis, read the failure output: it prints the `Falsifying example`, and with `print_blob=True` in settings a `@reproduce_failure(...)` decorator line; replay with `--hypothesis-seed=<n>`. For set-order dependence, sort before comparing (`sorted(result)`) or compare as sets, rather than pinning `PYTHONHASHSEED`.
   - node: generate a seed per run, print it, and feed it to every RNG: `const seed = Number(process.env.TEST_SEED ?? Date.now()); console.log('TEST_SEED=' + seed); faker.seed(seed);`. For fast-check, copy the printed `seed` and `path` into a temporary `fc.assert(prop, { seed, path })` to replay.
   - go: `seed := time.Now().UnixNano(); if s := os.Getenv("TEST_SEED"); s != "" { seed, _ = strconv.ParseInt(s, 10, 64) }; t.Logf("TEST_SEED=%d", seed); r := rand.New(rand.NewSource(seed))`. For map order, collect keys and `slices.Sort(keys)` (Go 1.21+) or `sort.Strings` before iterating where order matters.
3. Replay the failing inputs with the printed seed and confirm the failure is deterministic under that seed.
4. Then fix the real defect the failing input reveals (an edge case like empty string, negative amount, duplicate key). The seed work only makes it reproducible. If the test's assertion is order-dependent but the product's contract is unordered, change the assertion to compare unordered (`sorted`, `expect(arr).toEqual(expect.arrayContaining(...))` plus length, `assert.ElementsMatch`).
5. Add the failing input as a fixed example test case (Hypothesis `@example(...)`, a table row in Go, an explicit case in Jest) so it is always checked.
6. Do NOT pin a single global seed in CI config and call the flake fixed.

### Output
Reproducible sources, fixed defect, explicit example case.

### Quality Gate
- Replaying the recorded failing seed after the fix passes, and the run output shows the seed line.
- The new explicit example test exists and passes.

---

## Phase 3: Diff

### Entry Criteria
- Phase 2 complete.

### Actions
1. Run the test file with three fresh seeds (pytest `--randomly-seed`, `TEST_SEED` env for node and go).
2. `git -C <repo_path> diff > flk-seed.diff`; copy into `seed_fix_diff`; delete it.

### Output
`seed_fix_diff`.

### Quality Gate
- Three fresh-seed runs pass with their seeds recorded.

---

## Worked Example

Illustrative. Go, `TestSplitPayment` fails 3/299; message shows different amounts each run.

- Phase 1: amounts from `rand.Intn` top-level (auto-seeded); also `for k := range shares` builds an output slice.
- Phase 2: seed logged with `t.Logf("TEST_SEED=%d", seed)`; replay `TEST_SEED=1718049925000000000 go test ./internal/pay -run '^TestSplitPayment$' -count=1 -v` fails with amount 1 cent split 3 ways. Product fix: remainder cents assigned deterministically; keys sorted before building output. Table row `{name: "one cent three ways", amount: 1, parts: 3}` added.
- Phase 3: three fresh seeds `ok`.

---

## Exit Criteria

DONE when every random source prints and accepts its seed, unordered results are compared unordered, the revealed defect is fixed with an explicit example case, and fresh seeds pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 2 | Replayed seed does not reproduce | **Adjust**: another unseeded source exists (often created at import time); add it to the inventory. |
| Phase 2 | Failing input reveals a product bug | **Adjust**: fix product code; keep the assertion as strict as before. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
