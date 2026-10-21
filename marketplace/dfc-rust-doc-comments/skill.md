# Rust Doc Comments With missing_docs and Clippy Doc Lints

**One-line description:** Turns on the `missing_docs` lint and Clippy's `missing_errors_doc`, `missing_panics_doc` and `missing_safety_doc` for a Rust crate, then writes `///` item docs and `//!` crate docs with the conventional `# Examples`, `# Errors`, `# Panics` and `# Safety` sections and intra-doc links, one module at a time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the crate or workspace root (contains `Cargo.toml`).

---

## Outputs

- `docstring_config` (string): The lint configuration added: `[lints.rust]` / `[lints.clippy]` tables in `Cargo.toml`, or crate-level attributes in `src/lib.rs`.
- `docstring_report` (object[]): Per module: public items, `missing_docs` warnings before and after, Clippy doc lint warnings before and after.

---

## Phase 1: Configure the Lints

### Entry Criteria
- `cargo --version` and `cargo clippy --version` print versions.
- The crate has a library target (`src/lib.rs` or `[lib]`); binary-only crates have no public API to document.

### Actions
1. Read the toolchain: `rustc --version`. Choose where lints live:

   | Toolchain | Where |
   |---|---|
   | Rust 1.74 or later | `Cargo.toml` `[lints]` table (for a workspace, `[workspace.lints]` in the root plus `[lints] workspace = true` in each member) |
   | Older | Attributes at the top of `src/lib.rs` |

2. `Cargo.toml` form:
   ```toml
   [lints.rust]
   missing_docs = "warn"

   [lints.clippy]
   missing_errors_doc = "warn"
   missing_panics_doc = "warn"
   missing_safety_doc = "warn"
   ```
   Attribute form: `#![warn(missing_docs, clippy::missing_errors_doc, clippy::missing_panics_doc, clippy::missing_safety_doc)]`.
3. Use `warn`, not `deny`, in source. The CI gate turns warnings into errors with `-D warnings` (Phase 3), so local builds are not blocked while authors work.

### Output
`docstring_config`.

### Quality Gate
- `cargo clippy --all-targets 2>&1 | grep -c -E 'missing documentation|missing_errors_doc|missing_panics_doc|missing_safety_doc|docs for function'` prints a number (0 or more) with no "unknown lint" warning in the output.

---

## Phase 2: Baseline

### Entry Criteria
- Lints configured.

### Actions
1. Run `cargo clippy --all-targets --message-format=short 2>&1 | tee /tmp/doclint.txt`.
2. Count per lint: `grep -o -E '\[?(missing_docs|clippy::[a-z_]+)\]?' /tmp/doclint.txt | sort | uniq -c`. If the short format does not print lint names, use `cargo clippy --message-format=json` and read each message's `code.code` field.
3. Group by file to plan module order: `cut -d: -f1 /tmp/doclint.txt | sort | uniq -c | sort -rn`.

### Output
Baseline counts per lint and per file.

### Quality Gate
- Baseline counts are recorded for each of the four lints.

---

## Phase 3: Write Docs Module by Module

### Entry Criteria
- Baseline recorded.

### Actions
1. Crate docs: at the top of `src/lib.rs`, write `//!` lines (summary sentence, a short example, links to the main types). To reuse the README, `#![doc = include_str!("../README.md")]` works, but then every README code block becomes a doctest; use it only after `dfc-rust-doctest-samples` passes on the README.
2. Item docs with sections, in this order, using exactly these headings:
   ```rust
   /// Parses a semantic version string such as `1.4.0-rc.1`.
   ///
   /// # Errors
   ///
   /// Returns [`ParseError::Empty`] if `input` is empty and
   /// [`ParseError::InvalidNumber`] if a component is not a number.
   ///
   /// # Panics
   ///
   /// Panics if `input` contains more than three dot-separated numeric parts.
   ///
   /// # Examples
   ///
   /// ```
   /// let v = semverlite::parse("1.4.0")?;
   /// assert_eq!(v.minor, 4);
   /// # Ok::<(), semverlite::ParseError>(())
   /// ```
   pub fn parse(input: &str) -> Result<Version, ParseError> {
   ```
3. Section rules:

   | Item property | Required section |
   |---|---|
   | Returns `Result` | `# Errors` naming each error variant and its cause |
   | Contains `panic!`, `unwrap()`, `expect()`, indexing that can go out of bounds, reachable from inputs | `# Panics` with the condition |
   | `unsafe fn` or `unsafe trait` | `# Safety` listing the caller's obligations |
   | Any public item | One-sentence summary line; `# Examples` for top-level entry points |

4. Write `# Panics` only after reading the body and finding the panic site. Do NOT copy the template's panic text. If Clippy reports `missing_panics_doc` for an `unwrap()` that cannot fail, replace the `unwrap()` with `expect("<reason it cannot fail>")` only if the user approves a code change; otherwise document it.
5. Use intra-doc links in backticked brackets: [`Version`], [`Version::minor`], [`std::str::FromStr`].
6. Edit ONE module, then run `cargo clippy --all-targets` and `cargo test` before the next.

### Output
`docstring_report`.

### Quality Gate
- `cargo clippy --all-targets -- -D warnings; echo $?` prints `0` last.
- `cargo test` passes, including the doctests from the new `# Examples` blocks.

---

## Worked Example

Illustrative only. Baseline:
```
$ cargo clippy --all-targets --message-format=short
src/lib.rs:1:1: warning: missing documentation for the crate
src/version.rs:12:1: warning: missing documentation for a struct
src/version.rs:40:5: warning: docs for function returning `Result` missing `# Errors` section
```
Phase 3, `src/lib.rs` first:
```rust
//! Minimal semantic version parsing.
//!
//! Start with [`parse`], which returns a [`Version`].
```
Then `src/version.rs`: struct summary added; `parse` gets `# Errors`. Final `cargo clippy --all-targets -- -D warnings` finishes with no warnings; `cargo test` reports `Doc-tests semverlite ... test result: ok. 3 passed`.

---

## Exit Criteria

DONE when every public item has a doc comment, every `Result`-returning, panicking or unsafe public function has its matching section, Clippy passes with `-D warnings`, and all doctests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `[lints]` table ignored (old Cargo) | **Adjust**: use the attribute form in `src/lib.rs`. |
| Phase 2 | Thousands of `missing_docs` warnings in a workspace | **Adjust**: enable the lint per member crate, starting with the crate other members depend on least. |
| Phase 3 | Doctest in a new `# Examples` fails | **Adjust**: fix the example against the real API; never mark it `ignore` to pass. |
| Phase 3 | A public function panics through a private helper and Clippy is silent | **Adjust**: `missing_panics_doc` only sees panic sites in the function's own body; read the call chain and add `# Panics` by hand when a helper can panic on caller input. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
