# Differential Oracle Testing

**One-line description:** Writes property tests that run the target and a reference implementation (an older release, a slow brute-force version, another library or another language binding) on the same generated input, normalizes both outputs and error classes into one comparable form, and reports every disagreement as a minimal counterexample with the side that is wrong left as an explicit decision.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `property_catalog` (object[], required): Rows with pattern `oracle`, from `pft-invariant-discovery`.
- `reference_impl` (string, required): What the oracle is: a package and version, a git ref, a function name, or a command.
- `stack` (string, required): `python`, `node`, `rust`, `go`, `haskell`, `jvm` or `cpp`.
- `repo_path` (string, required): Project root.

---

## Outputs

- `differential_tests` (object[]): One row per oracle property: test file, how the reference is loaded, the normalization function, the error mapping table, documented allowed differences, and any disagreement found with its minimal input.

---

## Phase 1: Load the Reference Side by Side

### Entry Criteria
- At least one catalog row has pattern `oracle`.
- `reference_impl` is given.

### Actions
1. Choose how to load the reference with this table:

| Reference kind | How to load it next to the target |
|---|---|
| Brute-force function in the same repo | import it from a test helper module; it must not share code with the target |
| Older release of the same Python package | install it under another name: vendor the old release into `tests/oracle/` or run it in a subprocess with its own venv |
| Older release of a Rust crate | Cargo rename: `old_codec = { package = "codec", version = "=1.4.2" }` under `[dev-dependencies]` |
| Older release of a Go module | import the major-version path if it differs (`/v1` vs `/v2`); otherwise run the old binary as a subprocess |
| Older npm release | npm alias: `npm i -D codec-old@npm:codec@1.4.2` |
| Older Maven artifact with the same package names | run it in a separate class loader or subprocess; same-package classes collide on one classpath |
| Another library (for example two JSON parsers) | add it as a test dependency |
| A CLI or service | subprocess per input; batch inputs if process start dominates runtime |

2. Confirm both sides run on one hand-written input and print their outputs.

### Output
Both implementations callable from one test.

### Quality Gate
- A one-line smoke script calls target and reference on the same input and both outputs print.
- The reference does not import or call the target (read its import list).

---

## Phase 2: Normalize and Map Errors

### Entry Criteria
- Both sides callable.

### Actions
1. Write `normalize(output)` that removes differences the docs allow: key order in maps, trailing whitespace, float formatting (`1.0` vs `1`), Unicode normalization form, insertion order of unordered results. List each rule with its doc source.
2. Write an error mapping table so error cases compare as classes, not messages:

| Target error | Reference error | Class |
|---|---|---|
| `ValueError("truncated")` | `codec.DecodeError` | `INVALID_INPUT` |
| `OverflowError` | returns `None` | `OUT_OF_RANGE` |

3. Wrap each side: `run(impl, x)` returns `("ok", normalize(value))` or `("err", class)`. An exception not in the table returns `("crash", type name)` and always fails the test.
4. Record allowed known differences (documented bug fixes between versions) as explicit predicates that skip only those inputs, each with a changelog link.

### Output
`normalize`, error mapping and wrappers.

### Quality Gate
- Every normalization rule and allowed difference cites a doc or changelog line.
- The wrappers never swallow an exception type outside the mapping table (read the code).

---

## Phase 3: Write the Property and Classify Disagreements

### Entry Criteria
- Wrappers exist.

### Actions
1. Write one property per oracle row using the stack's library (Hypothesis, fast-check, proptest, rapid, QuickCheck, jqwik) with the generator from the catalog domain:

```python
@given(st.binary(max_size=MAX_LEN))          # MAX_LEN from the catalog domain
def test_O1_matches_reference(b):
    assert run(target.decode, b) == run(oracle.decode, b)
```

For `cpp`, write a libFuzzer harness that calls both and calls `abort()` on mismatch, then follow `pft-cpp-libfuzzer-harness`.
2. Run it. For each disagreement, record the shrunk input and both normalized outputs.
3. Classify each disagreement with this table; never decide by guessing:

| Evidence | Verdict |
|---|---|
| Spec or docs state the reference behavior | target bug |
| Spec or docs state the target behavior, or changelog says the reference was fixed | reference bug; add an allowed-difference predicate with the link |
| Neither documented | open question for the owner; keep the test failing with an `xfail` that cites the question ID only if the team approves |

4. Run the full property again after any allowed-difference change.

### Output
`differential_tests`.

### Quality Gate
- Every disagreement has a verdict with cited evidence or an open question ID.
- The property passes on all inputs not covered by a cited allowed difference, or the failing inputs are listed as target bugs.

---

## Worked Example

Illustrative. `stack` = `python`; `reference_impl` = the 1.4.2 release of the project's own `semver` parser, vendored to `tests/oracle/semver_142`.

```text
$ python -m pytest tests/property/test_semver_oracle.py -q
Falsifying example: test_O1_matches_reference(s='1.0.0-01')
AssertionError: assert ('ok', (1, 0, 0, ('01',))) == ('err', 'INVALID_INPUT')
```

SemVer 2.0.0 section 9 says numeric pre-release identifiers must not include leading zeros, so the reference is right and the target has a bug. The row records the input, both outputs and the spec citation. No allowed difference was added.

---

## Exit Criteria

DONE when every oracle row has a differential property, outputs and errors are compared through cited normalization and mapping, and every disagreement carries a verdict or an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Old and new versions collide on import path | **Adjust**: run the reference in a subprocess or separate class loader. |
| Phase 1 | Reference cannot be installed | **Stop**: report the exact install error; do not substitute a different oracle without the owner. |
| Phase 2 | Difference allowed only by guess | **Return**: raise it as an open question; do not normalize it away. |
| Phase 3 | Disagreements on nearly every input | **Adjust**: the normalization or error mapping is incomplete; inspect the first three counterexamples and fix the wrapper. |
| Phase 3 | Reference is too slow for the run budget | **Adjust**: shrink the input domain to the catalog minimum or batch subprocess calls; report the effect. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
