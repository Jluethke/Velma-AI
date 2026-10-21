# Hypothesis Strategies and Property Tests

**One-line description:** Turns each Python row of the property catalog into a Hypothesis strategy plus an `@given` test, building valid inputs directly with `st.builds`, `st.composite`, `st.from_type` and `.map` instead of filtering, and proves every test can fail by running it against a deliberately broken version of the target.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `property_catalog` (object[], required): Rows from `pft-invariant-discovery`.
- `hypothesis_config` (object, required): Profiles and database settings from `pft-py-hypothesis-setup`.
- `repo_path` (string, required): Project root.

---

## Outputs

- `py_property_tests` (object[]): One row per test: catalog `id`, test file and function name, strategy expression, the mutation used to prove it can fail, and the pass result under the `dev` profile.

---

## Phase 1: Map Each Domain to a Strategy

### Entry Criteria
- `property_catalog` has rows; `hypothesis_config` shows the plugin loaded.

### Actions
1. For each catalog row, pick the strategy from this table. Use only these names from `hypothesis.strategies` (imported as `st`); if you need another, look it up in the Hypothesis docs for the installed version before using it.

| Input domain | Strategy |
|---|---|
| Bounded integer | `st.integers(min_value=a, max_value=b)` |
| Float without NaN or infinity | `st.floats(allow_nan=False, allow_infinity=False)`; add `width=32` only for 32-bit targets |
| Text over a fixed alphabet | `st.text(alphabet=st.characters(codec="utf-8"), min_size=..., max_size=...)` or `st.text(alphabet="abc...")` |
| Text that must match a regex | `st.from_regex(r"...", fullmatch=True)` |
| Bytes | `st.binary(min_size=..., max_size=...)` |
| List, set, dict | `st.lists(elem, min_size=..., unique=True)`, `st.frozensets(elem)`, `st.dictionaries(keys, values)` |
| One of fixed values | `st.sampled_from([...])` or `st.sampled_from(MyEnum)` |
| A dataclass, attrs class or typed constructor | `st.builds(Cls, field=st...)`; for fully type-hinted classes `st.from_type(Cls)` |
| Values where a later field depends on an earlier one | `@st.composite` function using `draw(...)` |
| Recursive data (JSON, trees, ASTs) | `st.recursive(base, lambda children: st.lists(children) \| st.dictionaries(st.text(), children), max_leaves=<user>)` |
| Union of shapes | `st.one_of(a, b)` or `a \| b` |

2. Size limits (`max_size`, `max_leaves`, integer bounds) come from the catalog `input_domain`. If the catalog has an open question for a limit, leave the argument out (Hypothesis default) and note the open question; do not invent a limit.
3. Apply the filter rule: if a precondition can be met by construction, use `.map` or `st.builds`; use `.filter(pred)` or `assume(pred)` only when the predicate rejects a small fraction of draws. Example: "even integer" is `st.integers().map(lambda n: n * 2)`, not `st.integers().filter(lambda n: n % 2 == 0)`.
4. Do not use `st.data()` when a `@st.composite` works; `st.data()` makes failure output harder to read.

### Output
A strategy expression per catalog row.

### Quality Gate
- Every strategy name used is in the table or cited from the installed version's docs.
- Every `.filter` or `assume` has a one-line justification.

---

## Phase 2: Write the Tests One File at a Time

### Entry Criteria
- Strategies chosen.

### Actions
1. Create one test module per target module, for example `tests/property/test_varint_props.py`. Write tests for one catalog row, run them, then move to the next row. Do not write all files and run once at the end.
2. Use this shape for every test:

```python
from hypothesis import given, example, note, strategies as st
from mypkg.varint import encode, decode

U64 = st.integers(min_value=0, max_value=2**64 - 1)

@given(U64)
@example(0)                 # explicit edge cases from the catalog go here
@example(2**64 - 1)
def test_P1_roundtrip(n):
    data = encode(n)
    note(f"encoded={data.hex()}")
    assert decode(data) == (n, len(data))
```

3. Name tests `test_<catalog id>_<pattern>` so failures map back to the catalog.
4. For expected errors, assert the exact exception class from `expected_errors`:

```python
@given(st.binary())
def test_P3_no_crash(b):
    try:
        decode(b)
    except ValueError:
        pass
```

Never write `except Exception: pass`. It hides the bugs fuzzing is supposed to find.
5. For metamorphic rows, draw the input and the transformation parameter in the same `@given`, and assert the relation, not a specific value.
6. Use `target(score, label="...")` only when the catalog row asks for a search toward large values (for example maximizing output length); it guides generation and is not an assertion.
7. Run each new test with `python -m pytest <file>::<test> --hypothesis-show-statistics -q`.

### Output
Test files with one test per catalog row.

### Quality Gate
- `python -m pytest tests/property -q` exits 0 under the `dev` profile.
- The statistics block for each test shows a passing example count equal to `max_examples` and a low invalid count; a high invalid count goes to the health-check flow.

---

## Phase 3: Prove Each Test Can Fail

### Entry Criteria
- All tests pass.

### Actions
1. For each test, apply one temporary mutation to the target in the working tree (for example drop the last byte in `encode`, return the input unchanged from `normalize`, swap `<` for `<=`).
2. Run only that test. It must fail and print `Falsifying example:` with a shrunk input.
3. Revert the mutation with `git checkout -- <target file>` (or `git stash` if you prefer) and confirm `git diff <target file>` is empty.
4. Record the mutation and the falsifying example in `py_property_tests`.
5. If a test passes under its mutation, the property is too weak. Go back to the catalog row, strengthen the assertion, and repeat.

### Output
`py_property_tests`.

### Quality Gate
- Every test has a recorded mutation that made it fail.
- `git diff -- src/` is empty after the mutation round (no mutation left behind).

---

## Worked Example

Illustrative. Catalog row P1 (round-trip for `encode`/`decode`).

```text
$ python -m pytest tests/property/test_varint_props.py::test_P1_roundtrip -q --hypothesis-show-statistics
.
  - 100 passing examples, 0 failing examples, 0 invalid examples

# mutation: encode() drops the continuation bit on the 2nd byte
$ python -m pytest tests/property/test_varint_props.py::test_P1_roundtrip -q
F
Falsifying example: test_P1_roundtrip(
    n=128,
)
encoded=8001
AssertionError: assert (0, 1) == (128, 2)
$ git checkout -- src/mypkg/varint.py && git diff --stat src/
```

`py_property_tests` row: `{id: P1, file: tests/property/test_varint_props.py, test: test_P1_roundtrip, strategy: integers(0, 2**64-1), mutation: "clear bit 7 of byte 0", killed: true, falsifying: n=128}`.

---

## Exit Criteria

DONE when every Python catalog row has a passing `@given` test, every test was shown to fail under a recorded mutation, and the target source is unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `st.from_type` raises `ResolutionFailed` | **Adjust**: register the type with `st.register_type_strategy(Cls, strategy)` or use `st.builds` with explicit fields. |
| Phase 2 | A real failure appears before any mutation | **Return**: this is a bug in the target; record the falsifying example for `pft-shrinking-reproduction` and do not change the test to make it pass. |
| Phase 2 | `FailedHealthCheck` or `DeadlineExceeded` | **Return**: hand the test to `pft-py-hypothesis-health-checks`; do not suppress the check here. |
| Phase 3 | Mutation does not kill the test | **Adjust**: strengthen the assertion and rerun the mutation. |
| Phase 3 | Mutation left in the tree | **Stop**: revert with `git checkout -- <file>` before anything else. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
