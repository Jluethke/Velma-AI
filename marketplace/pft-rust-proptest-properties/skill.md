# proptest Strategies and Property Tests

**One-line description:** Turns each Rust row of the property catalog into a `proptest!` test with composed strategies (`any::<T>()`, ranges, regex strings, `prop::collection`, `prop_compose!`, `prop_oneof!`), reads the minimal failing input proptest prints, and commits the `proptest-regressions/*.txt` seed files so failures replay on every run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `property_catalog` (object[], required): Rows from `pft-invariant-discovery`.
- `repo_path` (string, required): Crate or workspace root containing `Cargo.toml`.

---

## Outputs

- `rust_property_tests` (object[]): One row per test: catalog `id`, file, test name, strategy expression, case count source, mutation used, and the `minimal failing input` line proptest printed for it.

---

## Phase 1: Add proptest

### Entry Criteria
- `cargo test` passes in `repo_path` before changes.

### Actions
1. Add the dev-dependency: `cargo add --dev proptest`. If the catalog has struct inputs that should derive strategies, also `cargo add --dev proptest-derive` and use `#[derive(proptest_derive::Arbitrary)]` under `#[cfg(test)]`.
2. Confirm: `cargo tree -e dev -i proptest` prints the resolved version.
3. Record the case count rule: proptest's documented default is 256 cases per test; it can be changed per test with `ProptestConfig::with_cases(n)` or for a run with the `PROPTEST_CASES` environment variable. Take any non-default `n` from the user.

### Output
proptest installed.

### Quality Gate
- `cargo test --no-run` succeeds after the dependency is added.

---

## Phase 2: Choose Strategies

### Entry Criteria
- Dependency resolved.

### Actions
1. Map each domain with this table:

| Domain | Strategy |
|---|---|
| Any value of a primitive type | `any::<u64>()`, `any::<bool>()` |
| Bounded integer | `0u32..1000` (half-open) or `0u32..=999` |
| String matching a regex | a string literal as strategy, for example `"[a-z]{1,8}"`; `"\\PC*"` is any printable string |
| Vec, HashMap, BTreeSet | `prop::collection::vec(elem, 0..64)`, `prop::collection::hash_map(k, v, size)`, `prop::collection::btree_set(elem, size)` |
| Option | `prop::option::of(elem)` |
| Fixed values | `Just(x)`, `prop::sample::select(vec![...])` |
| Union | `prop_oneof![a, b]` (all branches must have the same value type) |
| Struct built from fields | `prop_compose! { fn arb_order()(id in any::<u32>(), qty in 1u16..100) -> Order { Order { id, qty } } }` |
| Transform | `.prop_map(f)` |
| Dependent value | `.prop_flat_map(f)`; shrinks less well, use only when a later value really depends on an earlier one |
| Reject values | `.prop_filter("reason", pred)` or `prop_assume!(cond)`; both count as rejects and fail the test if too many happen |

2. Sizes and ranges in the table above are syntax examples. Take every real bound from the catalog `input_domain`; leave open questions open.
3. Prefer construction (`prop_map`, `prop_compose!`) over `prop_filter`.

### Output
Strategy per catalog row.

### Quality Gate
- Every strategy combinator used is in the table or in docs.rs for the installed proptest version.
- Every `prop_filter` or `prop_assume!` has a written reason.

---

## Phase 3: Write, Run, Mutation-Check, Commit Regressions

### Entry Criteria
- Strategies chosen.

### Actions
1. Put tests in the module's `#[cfg(test)] mod tests` or in `tests/props_<module>.rs`. One test at a time; run after each.

```rust
use proptest::prelude::*;
use mycrate::varint::{encode, decode};

proptest! {
    #[test]
    fn p1_roundtrip(n in any::<u64>()) {
        let bytes = encode(n);
        prop_assert_eq!(decode(&bytes), Ok((n, bytes.len())));
    }

    #[test]
    fn p3_decode_never_panics(bytes in prop::collection::vec(any::<u8>(), 0..32)) {
        let _ = decode(&bytes);   // must return Ok or Err, never panic
    }
}
```

2. Use `prop_assert!`, `prop_assert_eq!` and `prop_assume!` inside `proptest!`, not `assert!`. A plain `assert!` panics, which still fails, but `prop_assert*` produce clearer messages and shrink faster.
3. Run `cargo test p1_roundtrip -- --nocapture`.
4. Apply a temporary mutation to the target. The failure prints:

```text
thread 'tests::p1_roundtrip' panicked at ...:
Test failed: assertion failed: `(left == right)` ...; minimal failing input: n = 128
        successes: 3
        local rejects: 0
        global rejects: 0
```

5. proptest writes the failing seed to `proptest-regressions/<module path>.txt` with a line like `cc 1f3e...a9 # shrinks to n = 128`. Those seeds run first on every later `cargo test`.
6. Revert the mutation (`git checkout -- <file>`). Delete the regression line that the mutation produced, because it records a mutant failure, not a real bug. Keep regression files that come from real target bugs and commit them.
7. Rerun `cargo test` and confirm green.

### Output
`rust_property_tests`.

### Quality Gate
- `cargo test` exits 0 on the unmodified target.
- Every test has a recorded mutation and its `minimal failing input` line.
- `git status --short proptest-regressions/` shows only files for real target bugs, each listed in the work notes.

---

## Worked Example

Illustrative. Row P4: `canonicalize(canonicalize(p)) == canonicalize(p)` for path strings.

```rust
proptest! {
    #[test]
    fn p4_canonicalize_idempotent(p in "(/[a-z.]{0,3}){0,6}") {
        let once = canonicalize(&p);
        prop_assert_eq!(canonicalize(&once), once);
    }
}
```

The regex bound came from the catalog domain "absolute paths, lowercase segments". Mutation: skip collapsing `..`.

```text
$ cargo test p4_canonicalize_idempotent
Test failed: assertion failed: `(left == right)`
  left: `"/"`,
 right: `"/a/.."`; minimal failing input: p = "/a/.."
        successes: 17
        local rejects: 0
        global rejects: 0
$ git checkout -- src/path.rs
$ cargo test p4_canonicalize_idempotent
test tests::p4_canonicalize_idempotent ... ok
```

The mutant's line in `proptest-regressions/path.txt` was removed before commit.

---

## Exit Criteria

DONE when each Rust catalog row has a passing `proptest!` test, each was killed by a recorded mutation, mutant regression seeds were removed, and real-bug regression seeds are committed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `cargo add` not available (old cargo) | **Adjust**: add `proptest = "1"` under `[dev-dependencies]` by hand and run `cargo build --tests`. |
| Phase 2 | `prop_oneof!` type mismatch | **Adjust**: `.prop_map` each branch into a shared enum or type. |
| Phase 3 | `Too many local rejects` or `Too many global rejects` | **Adjust**: replace filters with constructive strategies. |
| Phase 3 | Real failure before mutation | **Return**: keep the regression seed, record the minimal input for `pft-shrinking-reproduction`. |
| Phase 3 | Test passes under mutation | **Adjust**: strengthen the assertion and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
