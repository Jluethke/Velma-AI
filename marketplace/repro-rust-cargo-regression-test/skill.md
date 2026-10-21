# Rust Failing Regression Test with cargo test

**One-line description:** Converts the minimal repro into one failing Rust test, choosing between a unit test in the module's `#[cfg(test)] mod tests`, an integration test under `tests/`, or a doctest, and confirms the red run with an exact-name filter and the same profile (debug or release) the reporter used.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `minimal_repro` (object, required): Output of `repro-ddmin-minimize`.
- `minimal_input` (object, required): Output of `repro-ddmin-minimize`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `rust_regression_test` (object): File path, crate and test path (`module::tests::name`), full source, run command with profile and features, and the red run output. Empty when `stack` is not rust.

---

## Phase 1: Choose Test Kind and Profile

### Entry Criteria
- `rustc -vV` matches `env_snapshot`.
- `cargo test --no-run --locked` succeeds before any change.

### Actions
1. Choose the test kind:

| Failing item | Test kind | Location |
|---|---|---|
| Private function or type | Unit test | `#[cfg(test)] mod tests { use super::*; ... }` at the bottom of the same `.rs` file |
| Public API of a library crate | Integration test | `tests/<area>.rs` (each file is its own crate; only public items are visible) |
| Binary-only crate behavior (CLI) | Integration test running the binary | `tests/cli.rs` using `env!("CARGO_BIN_EXE_<name>")` with `std::process::Command`, or `assert_cmd` if already a dev-dependency |
| Example in documentation is wrong | Doctest | The `///` comment block of the item |

2. Choose the profile: if the reporter used `--release`, run tests with `cargo test --release`. Integer overflow panics only in debug (`overflow-checks` default on in dev, off in release), and `debug_assert!` is compiled out in release. A bug that is a wrong wrapped value in release can be a panic in debug, and the reverse.
3. Record features: if the reporter enabled features, use the same `--features <list>` or `--no-default-features`.
4. Workspace: if the crate is a workspace member, pass `-p <crate>`.

### Output
Test kind, location, profile, features.

### Quality Gate
- The chosen profile and features match `minimal_repro` build flags (compare the command lines).

---

## Phase 2: Write the Test

### Entry Criteria
- Kind chosen.

### Actions
1. Name in snake case stating behavior: `parses_exponent_without_digits_as_error`.
2. Assertions:

| Bug kind | Assertion |
|---|---|
| Wrong value | `assert_eq!(actual, expected);` (types must implement `PartialEq` and `Debug`) |
| Should return `Err` | `let err = f(x).unwrap_err(); assert!(matches!(err, ParseError::InvalidExponent { .. }));` |
| Panics but should not | Call directly; the panic fails the test with `thread '...' panicked at` |
| Should panic with message | `#[should_panic(expected = "exact substring")]` (always give `expected`; a bare `#[should_panic]` passes on any panic) |
| Floating point | `assert!((a - b).abs() <= tol)` with `tol` from the spec or user |

3. Files: use `std::env::temp_dir()` with a unique subdirectory, or the `tempfile` crate only if it is already in `[dev-dependencies]`. Fixtures: `include_str!("../tests/data/x.txt")` or `concat!(env!("CARGO_MANIFEST_DIR"), "/tests/data/x.txt")`.
4. Do not add `#[ignore]`. Do not add new dev-dependencies to `Cargo.toml` for this test; that changes `Cargo.lock` and confuses later bisects.
5. Edit only the test location.

### Output
Test source.

### Quality Gate
- `cargo fmt -- --check <file>` exits 0 (or the repo has no rustfmt config and neighbors are unformatted; then match neighbors).
- `git diff --stat` shows the test file only, and `Cargo.lock` unchanged.

---

## Phase 3: Confirm the Red Run

### Entry Criteria
- Test written.

### Actions
1. Run one test: `cargo test --locked [-p <crate>] [--release] [--features <list>] <test_name> -- --exact --nocapture`. `--exact` needs the full path for unit tests: `parser::tests::parses_exponent_without_digits_as_error`. Integration test: add `--test <file stem>`.
2. Set `RUST_BACKTRACE=1` to get the frame list in the panic output.
3. Read: output must contain `test <path> ... FAILED`, the `---- <path> stdout ----` block with the panic message or the `assert_eq!` left/right values matching the bug, and `test result: FAILED. 0 passed; 1 failed`.
4. If the line says `running 0 tests`, the filter matched nothing; fix the path. A compile error (`error[E....]`) means the test is broken, not red.

### Output
`rust_regression_test` with red output.

### Quality Gate
- Output contains `1 failed` and the panic or left/right values from the bug.
- Output does not contain `running 0 tests` for the target binary.

---

## Worked Example

Illustrative only. CLI from the bisect example, release build used by reporter.

```rust
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_exponent_without_digits_as_error() {
        assert!(matches!(parse_number("1e"), Err(ParseError::InvalidExponent { .. })));
    }
}
```

`RUST_BACKTRACE=1 cargo test --locked --release parser::tests::parses_exponent_without_digits_as_error -- --exact`:

```
---- parser::tests::parses_exponent_without_digits_as_error stdout ----
thread 'parser::tests::parses_exponent_without_digits_as_error' panicked at src/parser.rs:212:9:
assertion failed: matches!(parse_number("1e"), Err(ParseError::InvalidExponent { .. }))
test result: FAILED. 0 passed; 1 failed; 0 ignored
```

Red confirmed (the function returned `Ok(1.0)`).

---

## Exit Criteria

DONE when one Rust test fails under the reporter's profile and features with the reported symptom, and `Cargo.lock` is unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Bug only in release but test needs debug assertions | **Adjust**: run with `--release`; to keep overflow checks in release for diagnosis use `CARGO_PROFILE_RELEASE_OVERFLOW_CHECKS=true` as a diagnostic run only. |
| Phase 2 | `#[should_panic]` without `expected` | **Retry**: add the exact substring; otherwise any unrelated panic passes. |
| Phase 3 | `running 0 tests` | **Retry**: use the full module path with `--exact`, or drop `--exact` to see what matches. |
| Phase 3 | Weak model adds `#[ignore]` to pass CI | **Stop**: remove it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
