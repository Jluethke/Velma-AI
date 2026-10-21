# Rust Loom Model Check of a Concurrent Type

**One-line description:** Writes a `loom` model test for one Rust concurrent type (a hand-rolled lock, atomic counter, once-cell, queue or channel wrapper) so that loom exhaustively explores thread interleavings and memory orderings, and records any interleaving that breaks an invariant.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the crate root.
- `shared_state_inventory` (object[], required): From `race-shared-state-inventory`; rows whose guard is an atomic, `UnsafeCell`, or a custom primitive are the candidates.

---

## Outputs

- `loom_results` (object[]): One row per model test: `type_under_test`, `test_name`, `invariant`, `result` (`pass`, `fail`), `failing_interleaving` (loom's printed execution or panic message), `orderings_changed` (atomic `Ordering` arguments that the finding implicates).

---

## Phase 1: Pick the Type and Make It Loom-Swappable

### Entry Criteria
- At least one inventory row is guarded by `std::sync::atomic`, `UnsafeCell`, `std::sync::Mutex`, `Condvar` or a custom primitive.

### Actions
1. Choose ONE type that owns the shared state. Loom checks small models; model one type at a time.
2. Add loom as a dev-dependency only under the loom cfg in `Cargo.toml`:
   ```
   [target.'cfg(loom)'.dev-dependencies]
   loom = "<current version from crates.io>"
   ```
   Look up the current version on crates.io; do not guess a version number.
3. In the module of that type, swap imports under the cfg, a pattern documented in the loom README:
   ```
   #[cfg(loom)]
   use loom::sync::atomic::{AtomicUsize, Ordering};
   #[cfg(loom)]
   use loom::sync::Arc;
   #[cfg(not(loom))]
   use std::sync::atomic::{AtomicUsize, Ordering};
   #[cfg(not(loom))]
   use std::sync::Arc;
   ```
   For `UnsafeCell`, use `loom::cell::UnsafeCell`, whose API uses `with` and `with_mut` closures instead of `get()`. Wrap the access in a small internal helper so both cfgs compile.
4. Change only the imports and the cell access helper. Do not change logic in this phase.
5. Confirm normal builds still work: `cargo test` passes or fails exactly as before.

### Output
The type compiles with and without `--cfg loom`.

### Quality Gate
- `cargo test` result matches the previous run.
- `RUSTFLAGS="--cfg loom" cargo check --tests` exits 0.

---

## Phase 2: Write and Run the Model

### Entry Criteria
- Type compiles under `--cfg loom`.

### Actions
1. Create `tests/loom_<type>.rs` (or a `#[cfg(loom)] mod loom_tests` in the module):
   ```
   #![cfg(loom)]
   use loom::thread;
   #[test]
   fn concurrent_increment_is_not_lost() {
       loom::model(|| {
           let c = std::sync::Arc::new(Counter::new()); // use loom::sync::Arc
           let c2 = c.clone();
           let t = thread::spawn(move || c2.incr());
           c.incr();
           t.join().unwrap();
           assert_eq!(c.get(), 2);
       });
   }
   ```
   Use loom's `thread::spawn` and `loom::sync::Arc`, never `std::thread` inside `loom::model`.
2. Keep the model small: two or three threads and one or two operations each. Loom explores every permitted interleaving, so cost grows very fast with size.
3. Write the invariant as an `assert!` at the end of the closure (final value, no duplicate, no lost element, no use after free).
4. Run in release mode, as the loom README recommends: `RUSTFLAGS="--cfg loom" cargo test --release --test loom_<type>`.
5. If the run is too long, bound preemptions with the documented environment variable: `LOOM_MAX_PREEMPTIONS=<n>`; record n because bounding reduces coverage. Use `LOOM_LOG=trace` and `LOOM_LOCATION=1` for a readable failing trace, and `LOOM_CHECKPOINT_FILE=<file>` with `LOOM_CHECKPOINT_INTERVAL` to replay a failure. Check the loom docs for your version's variable list.

### Output
Model test result.

### Quality Gate
- The run output shows the test name with `ok` or `FAILED` from the cargo test summary.
- The model uses `loom::thread::spawn` (`rg -n "std::thread" tests/loom_<type>.rs` prints nothing).

---

## Phase 3: Read a Failure and Map It to an Ordering or Lock

### Entry Criteria
- Model test ran.

### Actions
1. On failure, loom prints the assertion panic and, with `LOOM_LOG`, the sequence of thread switches and atomic operations. Record the sequence in `failing_interleaving`.
2. Map the failure with this table:

| Failure | Typical cause | Fix direction for `race-sync-primitive-choice` |
|---|---|---|
| Lost update with `load` then `store` | Read-modify-write split into two atomics operations | Use `fetch_add` or `compare_exchange` loop |
| Reader sees flag set but data not written | Publish with `Relaxed` | `store(Release)` on writer, `load(Acquire)` on reader |
| Causality violation reported on `UnsafeCell` access | Two threads touch the cell without synchronization | Guard the cell with a mutex or a correct Acquire/Release pair |
| Deadlock reported by loom | Lock order or a missing notify on `Condvar` | `race-lock-ordering` |

3. Do not change orderings to `SeqCst` everywhere to make the model pass without understanding the failure. Record which ordering edge was missing.
4. Do not reduce thread count to one or delete the assertion to get a pass.

### Output
`loom_results`.

### Quality Gate
- Each failing row has a table row named as its cause.
- Each passing row records the `LOOM_MAX_PREEMPTIONS` value used, or `unbounded`.

---

## Worked Example

Illustrative only.

Inventory row: `Counter { n: AtomicUsize }`, `incr()` does `let v = self.n.load(Relaxed); self.n.store(v + 1, Relaxed);`.

Phase 2: `RUSTFLAGS="--cfg loom" cargo test --release --test loom_counter` prints:
```
thread 'concurrent_increment_is_not_lost' panicked at tests/loom_counter.rs:14:9:
assertion `left == right` failed
  left: 1
 right: 2
test concurrent_increment_is_not_lost ... FAILED
```
Phase 3: table row "Lost update with load then store". Fix direction: `self.n.fetch_add(1, Ordering::Relaxed)` (Relaxed is enough for a pure counter read only after `join`). After that change the same command prints `test concurrent_increment_is_not_lost ... ok`.

---

## Exit Criteria

DONE when one type has a loom model with an explicit invariant, the model ran in release mode, and its result plus any failing interleaving is recorded with a mapped cause.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Type depends on tokio or I/O | **Adjust**: model only the synchronization core extracted into a small internal type; loom does not model I/O. |
| Phase 1 | Code uses `UnsafeCell::get` directly in many places | **Adjust**: add one internal helper that wraps the access, used by both cfgs. |
| Phase 2 | Model runs for a very long time | **Adjust**: shrink to two threads and set `LOOM_MAX_PREEMPTIONS`, recording the bound. |
| Phase 3 | Failure only with bounded preemptions removed | **Return**: record as a real finding; bounding only hides interleavings. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
