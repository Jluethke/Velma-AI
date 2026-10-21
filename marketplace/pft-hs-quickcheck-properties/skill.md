# Haskell QuickCheck Properties

**One-line description:** Writes Haskell QuickCheck properties for each catalog row with `Arbitrary` instances that define both `arbitrary` and `shrink`, guards preconditions with `forAll` generators instead of `==>`, measures input distribution with `label`, `cover` and `checkCoverage`, and runs them under tasty-quickcheck or hspec with a replayable seed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `property_catalog` (object[], required): Rows from `pft-invariant-discovery`.
- `repo_path` (string, required): Cabal or Stack project root.

---

## Outputs

- `hs_property_tests` (object[]): One row per property: catalog `id`, module, property name, generator, shrink definition, coverage requirements, mutation used, and the `Falsified` counterexample plus replay token.

---

## Phase 1: Wire QuickCheck into the Test Suite

### Entry Criteria
- `cabal test` or `stack test` passes before changes.

### Actions
1. Find the `test-suite` stanza in the `.cabal` file (or `package.yaml` for hpack). Add to `build-depends`: `QuickCheck`, and the runner binding already used:

| Existing runner | Add | Property declaration |
|---|---|---|
| tasty | `tasty-quickcheck` | `testProperty "P1 roundtrip" prop_roundtrip` |
| hspec | `hspec` already gives `Test.Hspec.QuickCheck` | `prop "P1 roundtrip" prop_roundtrip` |
| none (plain `main`) | nothing extra | `quickCheck prop_roundtrip` |

2. Rebuild: `cabal build --enable-tests` or `stack build --test --no-run-tests`.

### Output
Test suite compiles with QuickCheck.

### Quality Gate
- The build command exits 0.

---

## Phase 2: Generators and Shrinkers

### Entry Criteria
- Build passes.

### Actions
1. For built-in types use the existing `Arbitrary` instances (`Int`, `[a]`, `Maybe a`, `Text` through `quickcheck-instances` if the project uses it).
2. For project types write an instance with both methods. Without `shrink`, QuickCheck's default is `shrink _ = []` and failures are reported unshrunk.

```haskell
instance Arbitrary Order where
  arbitrary = Order <$> arbitrary <*> chooseInt (1, maxQty)   -- maxQty from the catalog domain
  shrink = genericShrink                                      -- requires a Generic instance
```

3. Use these combinators: `choose`, `chooseInt`, `elements`, `oneof`, `frequency`, `listOf`, `listOf1`, `vectorOf`, `sized`, `resize`, `suchThat` (sparingly). For recursive types use `sized` and halve the size at each level so generation terminates.
4. Preconditions rule:

| Precondition | Write |
|---|---|
| Can be met by construction (non-empty list, positive int) | a generator with `forAll` (`forAll (listOf1 arbitrary) $ \xs -> ...`) or a newtype from `Test.QuickCheck` such as `NonEmptyList`, `Positive`, `NonNegative` |
| Rare and cannot be constructed | `cond ==> prop`, and expect `Gave up!` if it rejects too much |

### Output
Instances and generators.

### Quality Gate
- Every project type used in a property has `shrink` defined (grep the instance block).
- No `==>` guards a condition that a newtype or `forAll` generator could produce.

---

## Phase 3: Properties, Coverage, Mutation-Check

### Entry Criteria
- Generators exist.

### Actions
1. Write each property as a top-level `prop_<id>_<pattern>`:

```haskell
prop_P1_roundtrip :: Word64 -> Property
prop_P1_roundtrip n =
  counterexample ("encoded: " ++ show (encode n)) $
    decode (encode n) === Right (n, BS.length (encode n))
```

Use `===` (prints both sides on failure) instead of `==`.
2. Add distribution checks when the catalog names edge regions: `cover 1 (n < 128) "single byte" $ ...` and run with `checkCoverage` so the run fails if the region is not reached often enough. The percentage is a user input; record its source.
3. Run: `cabal test --test-show-details=direct` (tasty extra args: `--test-options='--quickcheck-tests=N'` where N is a user input). Default test count is `maxSuccess = 100`.
4. Apply one temporary mutation per property. Failure output reads:

```text
*** Failed! Falsified (after 4 tests and 6 shrinks):
128
encoded: "\128"
Left (n, 1) /= Right (128,2)
```

tasty-quickcheck also prints `Use --quickcheck-replay='...' to reproduce.` Record that token. Plain QuickCheck replay uses `quickCheckWith stdArgs { replay = Just (mkQCGen seed, size) }` with `mkQCGen` from `Test.QuickCheck.Random`.
5. Revert the mutation (`git checkout -- <file>`), rerun green.

### Output
`hs_property_tests`.

### Quality Gate
- The test suite exits 0 on the unmodified code.
- Every property has a recorded mutation with its `Falsified` block and replay token.
- `git diff -- src/` is empty.

---

## Worked Example

Illustrative. Row P5: `parseCsvRow (renderCsvRow r) == Right r`.

```haskell
newtype Field = Field Text deriving (Show, Eq)
instance Arbitrary Field where
  arbitrary = Field . T.pack <$> listOf (elements "ab,\"\n ")
  shrink (Field t) = Field . T.pack <$> shrink (T.unpack t)

prop_P5_roundtrip :: [Field] -> Property
prop_P5_roundtrip fs = parseCsvRow (renderCsvRow fs) === Right fs
```

Mutation: do not double embedded quotes in `renderCsvRow`.

```text
$ cabal test --test-show-details=direct
  P5 roundtrip: FAIL
    *** Failed! Falsified (after 9 tests and 11 shrinks):
    [Field "\""]
    Left "unterminated quote" /= Right [Field "\""]
    Use --quickcheck-replay='(SMGen 2909028071 28219523,8)' to reproduce.
```

After revert: `P5 roundtrip: OK  +++ OK, passed 100 tests.`

---

## Exit Criteria

DONE when each Haskell catalog row has a passing property with shrinking generators, required coverage is checked, each property was killed by a recorded mutation with a replay token, and the source is restored.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dependency solver fails | **Adjust**: relax the bounds only on QuickCheck and the binding, then rerun `cabal build`; report if the solver still fails. |
| Phase 2 | `genericShrink` does not compile | **Adjust**: derive `Generic` for the type or write `shrink` by hand. |
| Phase 3 | `*** Gave up! Passed only N tests` | **Adjust**: replace `==>` with a constructive generator. |
| Phase 3 | `checkCoverage` fails on the unmodified code | **Adjust**: change the generator so the region is reached; never lower the user's percentage. |
| Phase 3 | Real failure before mutation | **Return**: record the counterexample and replay token for `pft-shrinking-reproduction`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
