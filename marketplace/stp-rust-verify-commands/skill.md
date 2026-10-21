# Find the Rust Verify Commands the Repo Already Uses

**One-line description:** Reads `Cargo.toml`, the workspace members, `rust-toolchain.toml` and CI to write the exact `cargo check`, filtered `cargo test`, `clippy` and `fmt` commands for the crate being changed, including the filter rules that stop "running 0 tests" from being read as a pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `goal_check` (object, required): From `stp-goal-to-runnable-check`.

---

## Outputs

- `rust_verify_commands` (object): `{ "package": str, "compile_one": str, "test_one": str, "check_touched": [str], "full_suite": str, "collect_count": str, "sources": [str] }`.

---

## Phase 1: Read the Workspace and Toolchain

### Entry Criteria
- `repo_path` contains `Cargo.toml`.

### Actions
1. Read the root `Cargo.toml`. If it has `[workspace]`, list `members`. Find the member whose directory contains the goal's file; its `[package] name` is `package`.
2. If `rust-toolchain.toml` or `rust-toolchain` exists, read `channel`; `cargo` will use that toolchain automatically through rustup.
3. Run `cargo --version` and `rustc --version`; record both.
4. Note `[features]` in the package's `Cargo.toml` and the `default` list. Code under `#[cfg(feature = "x")]` is compiled only when feature `x` is on.

### Output
`package`, toolchain, features.

### Quality Gate
- `cargo metadata --no-deps --format-version 1` exits 0 and its JSON contains `"name":"<package>"`.

---

## Phase 2: Read What CI Runs

### Entry Criteria
- `package` known.

### Actions
1. Run `rg -n "cargo (build|check|test|clippy|fmt|nextest)" .github Makefile justfile 2>/dev/null` and copy hits with `file:line` into `sources`.
2. Record CI flags: `--all-features`, `--no-default-features`, `--features x`, `--workspace`, `--locked`, and clippy's `-- -D warnings` (turns every warning into an error).
3. If CI runs `cargo nextest run`, the repo uses cargo-nextest; check `cargo nextest --version` works locally before using it.

### Output
`sources` and CI flags.

### Quality Gate
- Each command in `check_touched` appears in `sources` (apart from the `-p` scope).

---

## Phase 3: Write the Four-Speed Command Set

### Entry Criteria
- Phase 2 complete.

### Actions
1. `compile_one`: `cargo check -p <package> --all-targets` plus CI's feature flags. `--all-targets` includes tests, examples and benches, so test code is type-checked too. `cargo check` skips code generation and is the fastest compile signal.
2. `test_one`: `cargo test -p <package> <filter> -- --exact`.
   - `<filter>` is matched against the full test path, such as `slug::tests::strips_accents`. Without `--exact`, the filter is a substring and can match several tests.
   - Integration tests in `tests/foo.rs`: add `--test foo` to run only that file.
   - Doc tests run under `--doc`; a filter applies to them too.
   - Add `-- --nocapture` only when you need `println!` output; it does not change pass or fail.
3. `check_touched`: `cargo fmt -p <package> -- --check` (prints a diff and exits 1 if not formatted) and, if CI runs clippy, the CI clippy line scoped with `-p <package>`, for example `cargo clippy -p <package> --all-targets -- -D warnings`.
4. `full_suite`: CI's test line, usually `cargo test --workspace` with CI's flags.
5. `collect_count`: `cargo test -p <package> -- --list` prints `name: test` lines; count them.
6. Write the trap table into the output:

| Output line | Meaning | Treat as |
|---|---|---|
| `running 0 tests` followed by `test result: ok. 0 passed` | the filter matched nothing in that binary | FAIL of the check (wrong filter), unless another binary in the same run printed `1 passed` |
| `test result: ok. 1 passed; 0 failed` | the test ran and passed | PASS |
| `test result: FAILED.` | at least one test failed | read the `---- name stdout ----` block |
| `error: could not compile` | compile error | read the `error[E....]` blocks above it |
| `N filtered out` | tests skipped by the filter | normal for `test_one` |

### Output
`rust_verify_commands`.

### Quality Gate
- `test_one` contains `-p <package>` and `--exact`.
- `cargo check -p <package> --all-targets` exits 0 or prints `error[E` lines that are recorded (baseline errors go to `stp-baseline-capture`).

---

## Worked Example

Illustrative only.

Repo `/work/slugrs`: workspace members `["slugrs", "slugrs-cli"]`, `rust-toolchain.toml` channel `1.79`, CI line `run: cargo clippy --all-targets -- -D warnings` and `run: cargo test --workspace --locked`.

- Phase 1: `package` = `slugrs`; `cargo 1.79.0`.
- Phase 2: `sources` = [`.github/workflows/ci.yml:18 cargo clippy ...`, `.github/workflows/ci.yml:19 cargo test --workspace --locked`].
- Phase 3:
```
compile_one:   cargo check -p slugrs --all-targets
test_one:      cargo test -p slugrs <filter> -- --exact
check_touched: cargo fmt -p slugrs -- --check ; cargo clippy -p slugrs --all-targets -- -D warnings
full_suite:    cargo test --workspace --locked
collect_count: cargo test -p slugrs -- --list
$ cargo test -p slugrs tests::strips_accents -- --exact
running 0 tests
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 12 filtered out
```
Selector miss: the test is not written yet.

---

## Exit Criteria

DONE when `rust_verify_commands` contains a package-scoped `cargo check`, an exact-filter `cargo test`, and CI-sourced `full_suite`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Toolchain in `rust-toolchain.toml` not installed | **Stop**: report `rustup toolchain install <channel>`; do not edit the toolchain file. |
| Phase 2 | `--locked` fails with "lock file needs to be updated" | **Stop**: the lockfile is stale at baseline; report it. |
| Phase 3 | Test lives behind a feature | **Adjust**: add `--features <name>` from the `#[cfg(feature = ...)]` line. |
| Phase 3 | `cargo nextest` missing locally | **Adjust**: use `cargo test` for `test_one`; record the difference. |
| Phase 3 | `-- --list` prints nothing for a crate | **Adjust**: the crate has only doc tests; use `cargo test -p <package> --doc -- --list`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
