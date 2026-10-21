# Rust Clock and RNG Injection

**One-line description:** Replaces `Instant::now`, `SystemTime::now`, thread-local RNGs and `HashMap` iteration on the Rust decision path with an injected `Clock` trait, a seeded `rand_chacha::ChaCha8Rng` and ordered containers, then bans the direct calls with Clippy `disallowed_methods` and `disallowed_types`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Cargo workspace root.
- `nondeterminism_sources` (object[], required): Rows from `detd-nondeterminism-inventory` for the rust stack with `reaches_decision` of yes or unknown.

---

## Outputs

- `injection_patch` (string): Path to `detd_injection.patch`.
- `seam_tests` (string[]): Test names (for example `seams::same_seed_same_output`).

---

## Phase 1: Define the Seams

### Entry Criteria
- `cargo test --workspace` exits 0; record the `test result:` lines.

### Actions
1. Add `pub trait Clock { fn now_ns(&self) -> u64; }` with a production `MonotonicClock` (holds a start `Instant`, returns elapsed nanoseconds) and a `FakeClock` holding a `Cell<u64>` with `set` and `advance`.
2. RNG: add the `rand_chacha` crate and construct `ChaCha8Rng::seed_from_u64(seed)` (trait `rand::SeedableRng`). Do not use `StdRng` for replay: the `rand` docs state its algorithm may change between versions, so its output is not reproducible across upgrades. Do not use `thread_rng()` or `rand::rng()`; they are seeded from the OS.
3. Pin `rand` and `rand_chacha` versions in `Cargo.lock` and commit the lock file.

### Output
Seams module.

### Quality Gate
- `cargo build` exits 0.
- A test asserts two `ChaCha8Rng::seed_from_u64(7)` instances yield the same first 3 `next_u64()` values.

---

## Phase 2: Thread Seams and Order Containers

### Entry Criteria
- Seams compile.

### Actions
1. Edit one call site, run `cargo test`, repeat.
2. Pass `&dyn Clock` (or a generic `C: Clock`) and `&mut ChaCha8Rng` into the decision step. Read `now_ns()` once per tick.
3. `HashMap` and `HashSet` with the default `RandomState` are seeded randomly per process, so iteration order changes run to run. Replace with `BTreeMap`/`BTreeSet`, or `indexmap::IndexMap` when insertion order is the intended order, or collect and sort keys before iterating.
4. `rayon` parallel reductions (`par_iter().sum()`) of floats combine partial sums in an order that depends on work splitting; use sequential iteration on the decision path or a fixed chunking with ordered combination.
5. Async code: for tests, `#[tokio::test(start_paused = true)]` starts with Tokio's clock paused (needs the `test-util` feature); production decision logic still takes `now_ns` from the boundary.

### Output
Decision path edited.

### Quality Gate
- `cargo test --workspace` passes and the passed count is not lower than at Entry.
- `git diff -- '**/tests/**' | rg '^-.*assert'` returns nothing.

---

## Phase 3: Ban and Prove

### Entry Criteria
- Phase 2 tests pass.

### Actions
1. In `clippy.toml` at the workspace root add:
   ```
   disallowed-methods = [
     { path = "std::time::Instant::now", reason = "use the injected Clock" },
     { path = "std::time::SystemTime::now", reason = "use the injected Clock" },
     { path = "rand::thread_rng", reason = "use the injected ChaCha8Rng" },
   ]
   disallowed-types = [
     { path = "std::collections::HashMap", reason = "iteration order is random per process" },
     { path = "std::collections::HashSet", reason = "iteration order is random per process" },
   ]
   ```
   Allow the seams module with `#[allow(clippy::disallowed_methods)]` on `MonotonicClock::now_ns` only.
2. Run `cargo clippy --workspace -- -D clippy::disallowed_methods -D clippy::disallowed_types` and confirm exit 0.
3. Add test `same_seed_same_output` comparing serialized outputs of two runs with equal seeds and `FakeClock` values.
4. Mutation check: add `let _t = std::time::Instant::now();` in a decision function, rerun Clippy, confirm the `disallowed_methods` error, `git restore` the file.
5. `git diff > detd_injection.patch`.

### Output
`injection_patch`, `seam_tests`.

### Quality Gate
- Clippy exits 0 on the final tree and failed during the mutation check.
- `cargo test same_seed_same_output` reports `1 passed`.

---

## Worked Example

Illustrative only. Source row `src/arbiter.rs:88 let mut seen: HashSet<LimitId> = HashSet::new();` where the set is iterated into the output list.

Phase 2: replaced with `BTreeSet<LimitId>`. Phase 3 mutation: Clippy prints `error: use of a disallowed method std::time::Instant::now` with the reason. Final run prints `Finished` with no errors.

---

## Exit Criteria

DONE when every reachable rust source row is fixed, Clippy bans the direct calls, and the seam test passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dependency resolution changes `rand` major version | **Adjust**: pin the version in `Cargo.toml`; check `ChaCha8Rng` API in the docs for that version. |
| Phase 2 | A dependency returns a `HashMap` | **Adjust**: convert to `BTreeMap` at the boundary before iterating. |
| Phase 3 | Clippy ignores `clippy.toml` | **Stop**: confirm the file is at the workspace root and run `cargo clippy` from there. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
