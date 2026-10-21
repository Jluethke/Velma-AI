# Rust Doctests for Item Docs and the README

**One-line description:** Makes every Rust code block in doc comments and the README run under `cargo test --doc`, uses hidden `#` lines for setup and `?` error handling, chooses `no_run`, `should_panic`, `compile_fail` or `ignore` from a fixed table instead of by convenience, and tests the README through a `#[cfg(doctest)]` include.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the crate root.
- `docstring_report` (object[], required): Result of `dfc-rust-doc-comments`; lists modules with new `# Examples` sections.

---

## Outputs

- `sample_test_command` (string): The command CI runs: `cargo test --doc --all-features`.
- `sample_test_report` (object[]): Per doctest: file and line, attribute used, result, failure class and fix.

---

## Phase 1: Baseline

### Entry Criteria
- The crate has a library target (doctests run only for library crates).
- `cargo test --lib` passes.

### Actions
1. Run `cargo test --doc --all-features 2>&1 | tee /tmp/doctest.log`.
2. Read the summary under `Doc-tests <crate>`: `test result: ok. N passed; M failed; K ignored`.
3. List attributes in use: `git grep -n -E '^\s*(///|//!)\s*```[a-z_,]+' -- '*.rs' | grep -o -E '```[a-z_,]+' | sort | uniq -c`.
4. Every `ignore` found is a sample that never runs; record each one for review in Phase 2.

### Output
Baseline counts and attribute list.

### Quality Gate
- Baseline passed, failed and ignored counts are recorded from the log line.

---

## Phase 2: Fix Failures and Choose Attributes

### Entry Criteria
- Baseline recorded.

### Actions
1. Choose each block's attribute from this table:

   | The sample | Attribute |
   |---|---|
   | Runs and finishes quickly offline | none (plain ```` ``` ````) |
   | Compiles, but running it needs network, a server, or runs forever | `no_run` |
   | Demonstrates a documented panic | `should_panic` |
   | Demonstrates code that must not compile (type-state, lifetimes) | `compile_fail` (add the error code, for example `compile_fail,E0382`, so it fails for the right reason) |
   | Not Rust (shell, TOML, output) | `text`, `toml`, `sh` |
   | Pseudo-code that cannot compile | `ignore`, with a sentence above the block saying it is illustrative |

2. Use hidden lines (prefix `# `) for setup the reader does not need:
   ```rust
   /// ```
   /// # use semverlite::{parse, ParseError};
   /// let v = parse("2.0.1")?;
   /// assert_eq!(v.patch, 1);
   /// # Ok::<(), ParseError>(())
   /// ```
   ```
   The last hidden line makes `?` compile, because doctests are wrapped in a `fn main()` that returns `()` unless the block ends with an `Ok` value of a stated type.
3. Prefer `assert_eq!` over `println!` in samples: a printed value is not checked, an assertion is.
4. Fix one failing doctest at a time and rerun only it: `cargo test --doc <path::to::item>` (the filter matches the test name shown in the log, for example `src/lib.rs - parse (line 12)`).
5. Do NOT change a failing block to `ignore` or `no_run` to pass it. `no_run` is only for the reasons in the table.

### Output
Fixed doctests with recorded attributes.

### Quality Gate
- `cargo test --doc --all-features` reports `0 failed`.
- The ignored count in the summary equals the number of `ignore` rows in `sample_test_report`, each with a reason.

---

## Phase 3: Test the README

### Entry Criteria
- Item doctests pass.

### Actions
1. Add to `src/lib.rs`:
   ```rust
   #[doc = include_str!("../README.md")]
   #[cfg(doctest)]
   pub struct ReadmeDoctests;
   ```
   `cfg(doctest)` is set only while rustdoc collects doctests, so this item never appears in the build or the docs.
2. Mark README blocks that are not Rust with their language (`sh`, `toml`, `text`); an untagged fenced block in the README is treated as Rust and will fail.
3. Run `cargo test --doc --all-features` and fix README blocks with the Phase 2 table.

### Output
`sample_test_command`, `sample_test_report`.

### Quality Gate
- `cargo test --doc --all-features 2>&1 | grep -c 'README.md'` is greater than 0 (README doctests are collected).
- `cargo test --doc --all-features; echo $?` prints `0` last.

---

## Worked Example

Illustrative only. Phase 1:
```
$ cargo test --doc --all-features
   Doc-tests semverlite
test src/lib.rs - parse (line 12) ... FAILED
test src/version.rs - Version::bump_minor (line 30) ... ok
---- src/lib.rs - parse (line 12) stdout ----
error[E0277]: the `?` operator can only be used in a function that returns `Result` or `Option`
test result: FAILED. 1 passed; 1 failed; 0 ignored
```
Phase 2: add hidden `# Ok::<(), ParseError>(())`. Rerun `cargo test --doc parse` passes.

Phase 3: README has an untagged block with `cargo add semverlite`; tagged as `sh`. Final summary: `test result: ok. 4 passed; 0 failed; 0 ignored`.

---

## Exit Criteria

DONE when all doc comment and README Rust blocks are collected by `cargo test --doc`, none fail, and every `ignore` or `no_run` has a reason that matches the attribute table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Binary-only crate | **Stop**: doctests do not run for binaries; move samples to an integration test or add a library target. |
| Phase 2 | `compile_fail` passes for the wrong reason | **Adjust**: add the expected error code; rustdoc then checks the code matches. |
| Phase 2 | Sample needs a feature flag | **Adjust**: run with `--all-features`, or gate the block with `#[cfg(feature = "...")]` on hidden lines; record it. |
| Phase 3 | README badges or HTML break the include | **Adjust**: they are not code blocks and do not run; only fenced blocks matter. Investigate the actual failing block from the log. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
