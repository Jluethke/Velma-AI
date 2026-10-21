# Rust ThreadSanitizer and Miri

**One-line description:** Finds data races in Rust `unsafe` code, FFI and hand-written atomics by running tests under nightly ThreadSanitizer with `-Zbuild-std` and under Miri's race and weak-memory checks, and records each report as a pair of conflicting accesses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the crate or workspace root.
- `stress_command` (string, required): From `race-stress-harness`; names the test to run.

---

## Outputs

- `rust_tsan_reports` (object[]): One row per distinct finding: `tool` (`tsan` or `miri`), `kind` (data race, lock-order-inversion, Miri `Undefined Behavior: Data race detected`), `access_a`, `access_b` (file:line, thread), `unsafe_block` (the `unsafe` block or `unsafe impl Send/Sync` that allowed it, if any), `raw_log`.

---

## Phase 1: Locate Where a Race Is Possible

### Entry Criteria
- `cargo --version` and `rustup --version` work.

### Actions
1. Safe Rust prevents data races at compile time. Races can only come from: `unsafe` blocks, `unsafe impl Send` or `unsafe impl Sync`, `static mut`, FFI calls into C or C++, and logic races through atomics with too-weak `Ordering`. List them:
   `rg -n "unsafe impl (Send|Sync)|static mut|unsafe \{|extern \"C\"|Ordering::Relaxed" --type rust "<repo_path>"`
2. If the list is empty and the bug is a wrong value, the race is a logic race (check-then-act across two separate lock acquisitions, or a lost update in a database). Record that and return; neither TSan nor Miri reports logic races. Continue with `race-rust-loom` and `race-findings-consolidate`.

### Output
List of unsafe and atomic sites.

### Quality Gate
- The `rg` output is saved; the decision to continue or return is written down with its reason.

---

## Phase 2: Run Under ThreadSanitizer

### Entry Criteria
- At least one site from Phase 1.
- Linux or macOS target supported by the Rust sanitizer docs (the Rust unstable book, `sanitizer` chapter, lists supported targets).

### Actions
1. Install nightly and std sources: `rustup toolchain install nightly` and `rustup component add rust-src --toolchain nightly`.
2. Run the target test with TSan. `-Zbuild-std` rebuilds the standard library with instrumentation, which is required to avoid false reports from uninstrumented std; `--target` is required with `-Zbuild-std`:
   `RUSTFLAGS="-Zsanitizer=thread" RUSTDOCFLAGS="-Zsanitizer=thread" cargo +nightly test -Zbuild-std --target x86_64-unknown-linux-gnu <test_name> -- --test-threads=1`
   Replace the target triple with the output of `rustc -vV | grep host`. `--test-threads=1` keeps the test harness's own threads out of reports; the harness inside the test still spawns its workers.
3. Add runtime options as in C++: `TSAN_OPTIONS="halt_on_error=1 second_deadlock_stack=1 history_size=7"`.
4. Read reports exactly as in `race-cpp-tsan` Phase 3: `WARNING: ThreadSanitizer: data race`, `Write of size N ... by thread T2`, `Previous read ...`, `SUMMARY: ThreadSanitizer:`. Record the first frame inside the crate for each side.
5. Do not try `-Zsanitizer=thread` on stable; the flag is nightly-only. Do not add `--release` unless the bug only shows in release, and record it if you do.

### Output
TSan rows.

### Quality Gate
- The saved command line contains `-Zsanitizer=thread` and `-Zbuild-std`.
- Every TSan row has a `SUMMARY` line copied from the log.

---

## Phase 3: Run Under Miri

### Entry Criteria
- Phase 1 found sites; Miri runs only pure Rust (no FFI). Skip FFI-only crates with a written reason.

### Actions
1. Install: `rustup +nightly component add miri`, then `cargo +nightly miri setup`.
2. Run: `cargo +nightly miri test <test_name>`. Miri interprets the program, explores thread interleavings with a seeded scheduler, and reports `error: Undefined Behavior: Data race detected between (1) non-atomic write on thread `unnamed-2` and (2) non-atomic read on thread `unnamed-1``, with both spans.
3. Explore more schedules by changing the seed: `MIRIFLAGS="-Zmiri-seed=<n>" cargo +nightly miri test <test_name>`, or, if your Miri version supports it, `-Zmiri-many-seeds`. Check `cargo miri --help` and the Miri README for the flags present in your version before using them.
4. Miri also emulates weak memory for atomics, so an `Ordering::Relaxed` publish that a reader depends on can produce a wrong value under Miri when it would rarely fail on x86. A wrong-value assertion failure under Miri on atomics code is a finding; record it with the atomic sites.
5. Reduce stress parameters for Miri (fewer threads and iterations). Miri is slow; a test that loops many thousand times will not finish. Put the smaller values behind `if cfg!(miri)`.

### Output
`rust_tsan_reports` with TSan and Miri rows.

### Quality Gate
- Each Miri row cites an `Undefined Behavior` line or an assertion message copied from the run output.
- Every seed used is recorded so the run can be repeated.

---

## Worked Example

Illustrative only.

Phase 1: `rg` finds `src/stats.rs:12: unsafe impl Sync for Stats {}` and `src/stats.rs:30: unsafe { *self.hits.get() += 1 }` on an `UnsafeCell<u64>`.

Phase 2: `RUSTFLAGS="-Zsanitizer=thread" cargo +nightly test -Zbuild-std --target x86_64-unknown-linux-gnu stress_hits -- --test-threads=1` prints `WARNING: ThreadSanitizer: data race` with `Write of size 8 ... by thread T3: #0 stats::Stats::hit src/stats.rs:30` and `Previous write ... by thread T2` at the same line. `SUMMARY: ThreadSanitizer: data race src/stats.rs:30 in stats::Stats::hit`.

Phase 3: `cargo +nightly miri test stress_hits` prints `Undefined Behavior: Data race detected between (1) non-atomic write on thread unnamed-2 and (2) non-atomic write on thread unnamed-1` at `src/stats.rs:30:18`. Row: unsafe block `stats.rs:30` enabled by `unsafe impl Sync` at `stats.rs:12`.

---

## Exit Criteria

DONE when every unsafe or atomic site was checked by TSan (where supported) and Miri (where pure Rust), and every finding is a row tied to the `unsafe` block or atomic that allowed it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No unsafe, FFI or atomics | **Return**: report a logic race; continue with `race-rust-loom`. |
| Phase 2 | `error: the option Z is only accepted on the nightly compiler` | **Adjust**: add `+nightly` to every cargo command. |
| Phase 2 | Many reports inside std | **Retry**: confirm `-Zbuild-std` and `--target` were both passed. |
| Phase 3 | Miri reports `unsupported operation` for a syscall or FFI | **Adjust**: put that call behind `#[cfg(not(miri))]` in the test path only, or skip Miri for that test with the reason written. |
| Phase 3 | Test does not finish under Miri | **Adjust**: shrink iteration and thread counts under `cfg!(miri)`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
