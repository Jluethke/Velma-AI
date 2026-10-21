# Rust Toolchain Setup and Test Baseline

**One-line description:** Selects the toolchain pinned in rust-toolchain.toml, builds the workspace with `--locked`, and runs `cargo test --workspace` once with CI's feature flags, recording every pre-existing failure by crate and test path.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_profile` (object, required): Output of `tkt-repo-orient-detect` with `stack` containing rust.

---

## Outputs

- `rust_baseline_report` (object): rustc and cargo versions, toolchain channel, workspace members, feature flags used, build result, test command, per-target result lines, failing tests with first panic line and classification, commit hash.

---

## Phase 1: Toolchain and Build

### Entry Criteria
- `repo_profile.stack` includes rust.

### Actions
1. Read `rust-toolchain.toml` (or legacy `rust-toolchain`) for `channel`, `components` and `targets`. rustup installs that toolchain automatically on first `cargo` call in the directory. Also read `rust-version` (MSRV) in `Cargo.toml` `[package]` or `[workspace.package]`.
2. Run `rustup show active-toolchain` and `cargo --version`. Record both.
3. List workspace members: `cargo metadata --no-deps --format-version 1` and read `packages[].name`, or read `[workspace] members` in the root `Cargo.toml`.
4. Copy CI's feature flags (`--all-features`, `--no-default-features`, `--features a,b`). Feature choice changes which code compiles.
5. Build: `cargo build --workspace --all-targets --locked <feature flags>`. `--locked` fails instead of rewriting `Cargo.lock`. `--all-targets` also compiles tests, benches and examples.

### Output
Built workspace.

### Quality Gate
- Build exits 0 and its last line starts with `Finished`.
- `git status --porcelain` shows no change to `Cargo.lock`.

---

## Phase 2: Run the Baseline

### Entry Criteria
- Build succeeded.

### Actions
1. Run `cargo test --workspace --locked <feature flags>`. If the project uses cargo-nextest (CI calls `cargo nextest run`), use that instead.
2. Read the output. Each test binary prints `running N tests`, one line per test (`test tax::tests::rounds_half_even ... ok` or `... FAILED`), then `test result: FAILED. 41 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out`. Doc tests run as a separate binary headed `Doc-tests <crate>`.
3. For each `FAILED`, read the `---- <test path> stdout ----` block; the line `thread '<name>' panicked at src/tax.rs:88:9:` gives the location and the next line the message.
4. Note: `cargo test` stops after the first failing test binary. Add `--no-fail-fast` to run all binaries and see every failure.
5. Rerun each failing test alone: `cargo test -p <crate> <test path> -- --exact`. Fails alone = `pre-existing`; passes alone = `order-dependent`. To check for parallelism interference, rerun the binary with `-- --test-threads=1`.

### Output
Per-binary results and failure list.

### Quality Gate
- Every `test result:` line is copied into the report.
- The run used `--no-fail-fast` or reported zero failures, so no failures are hidden.

---

## Phase 3: Record the Baseline

### Entry Criteria
- Suite completed.

### Actions
1. Record the single-test command: `cargo test -p <crate> <module::tests::name> -- --exact`, and `-- --nocapture` to see `println!` output.
2. Write `rust_baseline_report` with the commit hash from `git rev-parse --short HEAD`.

### Output
`rust_baseline_report`.

### Quality Gate
- Report includes toolchain, feature flags and commit hash.
- Every failure is classified.

---

## Worked Example

Illustrative only.

```
$ cat rust-toolchain.toml
[toolchain]
channel = "1.81.0"
components = ["clippy", "rustfmt"]
$ rustup show active-toolchain
1.81.0-x86_64-unknown-linux-gnu (overridden by '/work/ledger/rust-toolchain.toml')
$ cargo build --workspace --all-targets --locked
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 38.20s
$ cargo test --workspace --locked --no-fail-fast
     Running unittests src/lib.rs (target/debug/deps/ledger_core-5a1f...)
running 42 tests
test money::tests::parses_negative ... FAILED
---- money::tests::parses_negative stdout ----
thread 'money::tests::parses_negative' panicked at crates/core/src/money.rs:211:9:
assertion `left == right` failed
test result: FAILED. 41 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
$ cargo test -p ledger_core money::tests::parses_negative -- --exact
test result: FAILED. 0 passed; 1 failed
```

`rust_baseline_report`: 1.81.0, 1 pre-existing failure `ledger_core money::tests::parses_negative`, commit `5eed123`.

---

## Exit Criteria

DONE when the workspace builds with `--locked` under the pinned toolchain, the full suite has run with `--no-fail-fast`, and every failure is classified with the commit hash.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--locked` refuses because Cargo.lock needs an update | **Stop**: report it; lockfile updates are a separate change. |
| Phase 1 | Build fails on a system library (openssl, pkg-config) | **Adjust**: install the package CI installs (read its `apt-get` or `brew` step); record it. |
| Phase 1 | Toolchain older than `rust-version` | **Stop**: report MSRV and active versions. |
| Phase 2 | Tests need a database or network | **Adjust**: start the CI `services:` containers; record them. |
| Phase 2 | Test passes only with `--test-threads=1` | **Return**: classify as `order-dependent` and report shared state as a pre-existing defect. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
