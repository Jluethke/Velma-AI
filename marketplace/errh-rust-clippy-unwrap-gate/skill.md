# Rust Clippy Unwrap and Panic Gate

**One-line description:** Denies `clippy::unwrap_used`, `expect_used`, `panic`, `todo`, `unimplemented`, `map_err_ignore` and `let_underscore_must_use` in non-test code through the Cargo `[lints]` table, allows them in tests through `clippy.toml`, fixes or annotates each hit with a reason, and fails CI on regressions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Workspace root.
- `rust_failure_tests` (object, required): From `errh-rust-failure-path-tests`.
- `triage_table` (object[], required): From `errh-catch-site-triage`.

---

## Outputs

- `rust_lint_gate` (object): `{ rustc_version, clippy_version, lints, allow_attributes: [ { file, line, lint, reason } ], ci_step }`.

---

## Phase 1: Measure

### Entry Criteria
- `cargo clippy --version` prints a version. The `[lints]` table in `Cargo.toml` needs Rust 1.74+; `#[expect(...)]` with a reason needs 1.81+.

### Actions
1. Run without config changes:
   `cargo clippy --all-features --lib --bins -- -W clippy::unwrap_used -W clippy::expect_used -W clippy::panic -W clippy::todo -W clippy::unimplemented -W clippy::map_err_ignore -W clippy::let_underscore_must_use`
2. Confirm each lint exists in your clippy: `cargo clippy --explain unwrap_used` (repeat per lint). These are `restriction` group lints, off by default.
3. Note: `unused_must_use` is a rustc lint (warn by default) that fires when a `Result` is dropped without `let _ =`; keep it at least warn and add `-D warnings` in CI.
4. Count per lint: pipe output to `rg -o "clippy::\w+" | sort | uniq -c`.

### Output
Counts per lint.

### Quality Gate
- Each lint's `--explain` succeeded or the lint is recorded as unavailable.

---

## Phase 2: Configure

### Entry Criteria
- Counts recorded.

### Actions
1. Workspace `Cargo.toml`:
```toml
[workspace.lints.clippy]
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
todo = "deny"
unimplemented = "deny"
map_err_ignore = "deny"
let_underscore_must_use = "deny"
```
   Each member crate adds `[lints] workspace = true`. For a single crate, use `[lints.clippy]` directly.
2. `clippy.toml` at the workspace root:
```toml
allow-unwrap-in-tests = true
allow-expect-in-tests = true
```
   Confirm both keys in the clippy configuration docs for your version.
3. Run `cargo clippy --all-targets --all-features -- -D warnings` and save the output.

### Output
Config and findings.

### Quality Gate
- `cargo clippy` runs and reports findings only in non-test code (test modules allowed by `clippy.toml`).

---

## Phase 3: Fix, Annotate, Enforce

### Entry Criteria
- Findings saved.

### Actions
1. Fix with the idiom table in `errh-rust-thiserror-anyhow`, one module at a time; run `cargo test -p <crate>` after each.
2. For true invariants (`keep_documented` triage rows), annotate the narrowest item: `#[expect(clippy::expect_used, reason = "regex literal is a compile-time constant")]` (1.81+), else `#[allow(...)]` with a `// reason:` comment. `#[expect]` warns if the lint stops firing, so stale annotations surface.
3. Do NOT put `#![allow(clippy::unwrap_used)]` at crate level. Do NOT downgrade the lints to `warn` to get green.
4. CI step: `cargo clippy --all-targets --all-features -- -D warnings`.
5. Prove it is live: add `let _x = "1".parse::<u8>().unwrap();` in a library function, run clippy, confirm `clippy::unwrap_used` error and non-zero exit, then `git checkout -- <file>`.

### Output
`rust_lint_gate`.

### Quality Gate
- Clippy exits 0 on the clean tree and non-zero with the planted unwrap.
- `rg -n "allow\(clippy::(unwrap_used|expect_used|panic)|expect\(clippy::(unwrap_used|expect_used|panic)" --type rust` count equals recorded annotations, each with a reason.
- The test command recorded by `errh-boundary-map` passes.

---

## Worked Example

Illustrative.
```
$ cargo clippy --all-targets --all-features -- -D warnings
error: used `unwrap()` on a `Result` value
  --> src/config.rs:22:17
   |
22 |     let port = env::var("PORT").unwrap().parse::<u16>().unwrap();
   = help: if this value is an `Err`, it will panic
```
Fix: `let port: u16 = env::var("PORT").context("PORT not set")?.parse().context("PORT not a u16")?;` in a function returning `anyhow::Result`.

---

## Exit Criteria

DONE when the restriction lints are denied workspace-wide outside tests, every exception is a scoped annotation with a reason, and CI fails on a planted unwrap.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rust older than 1.74 | **Adjust**: put `#![deny(clippy::unwrap_used, ...)]` in each crate root with `#![cfg_attr(test, allow(...))]`; record upgrading as an owner decision. |
| Phase 2 | Lint name unknown | **Adjust**: remove it and record; do not invent an alternative name. |
| Phase 3 | Hundreds of hits in one crate | **Adjust**: fix per module across several runs; keep the deny in config and track remaining hits; do not lower the level. |
| Phase 3 | Fix breaks a test | **Retry**: revert the module and redo; never delete the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
