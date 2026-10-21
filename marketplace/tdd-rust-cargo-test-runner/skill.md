# TDD Cargo Test Runner Setup

**One-line description:** Prepares a Rust crate for test-first work with cargo test, places unit and integration tests where cargo finds them, proves a canary passes and fails, and records the filter, exact-match, output-capture and watch commands.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Root of the crate or workspace (folder with `Cargo.toml`).

---

## Outputs

- `runner_config` (object): `crate_kind` (lib, bin, workspace), `suite_command`, `single_test_command` (template), `watch_command`, `rustc_version`.
- `smoke_result` (object): The `test result:` lines and exit codes for the canary pass run and fail run.

---

## Phase 1: Crate Layout

### Entry Criteria
- `cargo --version` and `rustc --version` print versions.

### Actions
1. Run `cargo build` in `project_dir`. It must succeed.
2. Decide where tests go:

| Test kind | Location | Sees |
|---|---|---|
| Unit test | `#[cfg(test)] mod tests { use super::*; ... }` at the bottom of the source file | private items of that module |
| Integration test | `tests/<name>.rs`, each file is its own crate | only the public API of a library crate |
| Doc test | ```` ``` ```` code block in a `///` comment | public API; run by `cargo test --doc` |

3. If the crate is a binary only (`src/main.rs`, no `src/lib.rs`), integration tests cannot import it. Move logic into `src/lib.rs` and keep `main.rs` thin. Ask before restructuring.
4. Shared helpers for integration tests go in `tests/common/mod.rs` (not `tests/common.rs`, which cargo would run as its own test crate).

### Output
Chosen test locations.

### Quality Gate
- `cargo build` exits 0.
- For integration tests, `src/lib.rs` exists.

---

## Phase 2: Canary Pass and Fail

### Entry Criteria
- Crate builds.

### Actions
1. Append to `src/lib.rs` (or the module under test):

```rust
#[cfg(test)]
mod canary_tests {
    #[test]
    fn canary_runner_executes_tests() {
        assert_eq!(1 + 1, 2);
    }
}
```

2. Run `cargo test canary_runner_executes_tests`. Expect `test canary_tests::canary_runner_executes_tests ... ok` and `test result: ok. 1 passed`, exit 0.
3. Change `2` to `3`. Run again. Expect `assertion `left == right` failed`, `left: 2`, `right: 3`, `test result: FAILED`, exit 101.
4. Remove the `canary_tests` module. Record both runs.
5. Read the summary line: `N passed; M failed; K ignored; J measured; F filtered out`. A large `filtered out` with `0 passed` means the filter matched nothing.

### Output
`smoke_result`.

### Quality Gate
- Fail run shows `left: 2` and `right: 3` and exit code 101.
- `grep -n canary_tests src/lib.rs` returns nothing.

---

## Phase 3: Selection and Watch

### Entry Criteria
- Canary proved pass and fail.

### Actions
1. Record:

| Purpose | Command |
|---|---|
| Everything (unit, integration, doc) | `cargo test` |
| Name substring filter | `cargo test parse_` |
| Exact full path | `cargo test tests::parse_rejects_empty -- --exact` |
| Only library unit tests | `cargo test --lib` |
| One integration file | `cargo test --test api` (for `tests/api.rs`) |
| Show `println!` output | `cargo test name -- --nocapture` |
| One thread (shared global state) | `cargo test -- --test-threads=1` |
| Run ignored tests | `cargo test -- --ignored` |
| List tests | `cargo test -- --list` |

2. Arguments before `--` go to cargo; arguments after `--` go to the test binary. `--exact`, `--nocapture`, `--test-threads` and `--ignored` must come after `--`.
3. Tests run in parallel threads by default. Tests that set environment variables or the current directory interfere with each other; inject config instead (see `tdd-filesystem-env-boundary`).
4. Watch mode: `cargo install --locked bacon` then `bacon test`. The older `cargo watch -x test` (crate cargo-watch) also works but its README points users to bacon. Check `bacon --help` for the installed version.
5. Use `assert_eq!(actual, expected, "context {}", x)`; the third argument adds a message. Do not use `assert!(a == b)`, which hides both values.

### Output
`runner_config`.

### Quality Gate
- `cargo test -- --list` exits 0.
- `watch_command` is shown working once, or recorded as "none" with the reason.

---

## Worked Example

Illustrative only. Library crate `tally`.

```
$ cargo test canary_runner_executes_tests
running 1 test
test canary_tests::canary_runner_executes_tests ... FAILED

---- canary_tests::canary_runner_executes_tests stdout ----
assertion `left == right` failed
  left: 2
 right: 3
test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
error: test failed, to rerun pass `--lib`
```

`runner_config.single_test_command` = `cargo test {module}::{name} -- --exact`.

---

## Exit Criteria

DONE when the crate builds, a canary was seen passing and failing, it is removed, and the commands are recorded with flags on the correct side of `--`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Integration test cannot `use mycrate::...` | **Adjust**: the item must be `pub` in `src/lib.rs`; binaries need a lib target. |
| Phase 2 | `0 passed; ... N filtered out` | **Retry**: the filter is a substring of the full path; copy it from `cargo test -- --list`. |
| Phase 3 | `error: unexpected argument '--exact'` | **Adjust**: move the flag after `--`. |
| Phase 3 | Tests pass alone, fail together | **Return**: send to `tdd-test-isolation-audit`; do not paper over with `--test-threads=1`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
