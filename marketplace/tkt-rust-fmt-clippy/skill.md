# Rust Format and Lint (cargo fmt, cargo clippy)

**One-line description:** Runs `cargo fmt --all -- --check` and `cargo clippy --workspace --all-targets -- -D warnings` with the toolchain and features CI uses, fixes introduced lints by reading each lint's help line, and allows a lint only with a scoped `#[expect]` or `#[allow]` plus a reason.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `change_diff` (string, required): Output of `tkt-small-edit-loop`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.

---

## Outputs

- `rust_static_report` (object): Toolchain, rustfmt and clippy versions, commands, lints split into `introduced` and `pre-existing`, allow or expect attributes added with reasons, final exit codes.

---

## Phase 1: Format

### Entry Criteria
- Workspace builds on the branch with `--locked`.

### Actions
1. Confirm components: `cargo fmt --version` and `cargo clippy --version`. They come from the toolchain in `rust-toolchain.toml`; if missing, `rustup component add rustfmt clippy`.
2. Check: `cargo fmt --all -- --check`. It prints a diff for each unformatted region (`Diff in /work/ledger/crates/core/src/money.rs at line 211:`) and exits 1.
3. Fix: `cargo fmt --all`. `rustfmt.toml` or `.rustfmt.toml` options apply automatically. Some options are nightly-only; if CI runs `cargo +nightly fmt`, do the same.
4. Inspect `git diff --stat`: if formatting changed files you never touched, revert those with `git restore <file>` and format only yours: `rustfmt --edition <edition from Cargo.toml> <changed files>`.

### Output
Formatted changed files.

### Quality Gate
- `cargo fmt --all -- --check` exits 0, or every remaining diff is in a file outside the change and recorded as `pre-existing`.

---

## Phase 2: Clippy

### Entry Criteria
- Formatting clean.

### Actions
1. Copy CI's clippy command. Common form: `cargo clippy --workspace --all-targets --all-features --locked -- -D warnings`. `--all-targets` lints tests, benches and examples; `-D warnings` turns every warning into an error.
2. Read each lint:
```
error: this `if` has identical blocks
  --> crates/core/src/money.rs:230:9
   |
   = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#if_same_then_else
   = note: `-D clippy::if-same-then-else` implied by `-D warnings`
```
   The `-->` line is file:line:col; the `help` URL names the lint and explains the fix.
3. Classify each lint as `introduced` (on a changed line or caused by your change) or `pre-existing` (also present on the base; to check, create a separate checkout of the base with `git worktree add ../base-check <base>`, run the same clippy command inside `../base-check`, then remove it with `git worktree remove ../base-check`; this never touches your branch).
4. Machine-applicable suggestions can be applied with `cargo clippy --fix --allow-dirty` only on a tree where your edits are committed (it edits files in place). Review the diff after.
5. Fix remaining lints by hand, rerunning clippy after each file. Common ones: `needless_borrow` (remove `&`), `redundant_clone`, `clone_on_copy`, `unwrap_used` if the repo denies it (return an error with `?` instead), `too_many_arguments` (pass a struct).
6. If a lint must stay, scope the attribute to the smallest item and give a reason: `#[expect(clippy::too_many_arguments, reason = "mirrors the external API signature")]`. `#[expect]` and the `reason` key are stable since Rust 1.81; on older toolchains use `#[allow(clippy::...)]` with a `// reason` comment. Never add a crate-wide `#![allow(clippy::all)]` or `#![allow(warnings)]`.
7. Do not edit `clippy.toml`, `[lints]` tables in `Cargo.toml`, or CI flags to make clippy pass.

### Output
Clippy clean on introduced code.

### Quality Gate
- CI's clippy command exits 0, or remaining errors are all `pre-existing` and listed.
- `git diff <base>...HEAD | rg -n '^\+.*#!\[allow'` prints nothing (no crate-level allows added).

---

## Phase 3: Recheck Tests and Report

### Entry Criteria
- fmt and clippy clean.

### Actions
1. Rerun `cargo test -p <touched crates> --locked`; clippy fixes such as removing clones can change behavior if ownership changed.
2. If CI builds docs with warnings denied (`RUSTDOCFLAGS="-D warnings" cargo doc --no-deps`), run that too; broken intra-doc links fail it.
3. Write `rust_static_report`.

### Output
`rust_static_report`.

### Quality Gate
- `cargo test` summary lines for touched crates show `0 failed`.
- Report lists every `#[expect]`/`#[allow]` added with its reason.

---

## Worked Example

Illustrative only.

```
$ cargo fmt --all -- --check
Diff in /work/ledger/crates/core/src/money.rs at line 211:
$ cargo fmt --all && cargo fmt --all -- --check
$ cargo clippy --workspace --all-targets --locked -- -D warnings
error: redundant clone
   --> crates/core/src/money.rs:244:31
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#redundant_clone
error: could not compile `ledger_core` (lib) due to 1 previous error
$ (remove .clone() at money.rs:244)
$ cargo clippy --workspace --all-targets --locked -- -D warnings
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.10s
$ cargo test -p ledger_core --locked
test result: ok. 43 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

Report: 1 format fix, 1 introduced clippy fix, 0 allows.

---

## Exit Criteria

DONE when rustfmt check passes, CI's clippy command passes with `-D warnings` (or fails only on listed pre-existing lints), no crate-wide allows or lint config edits were added, and touched crates' tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | rustfmt option is nightly-only and stable warns | **Adjust**: use the toolchain CI uses for fmt (often `+nightly`); record it. |
| Phase 2 | New clippy version adds lints not seen in CI | **Adjust**: use the toolchain pinned in `rust-toolchain.toml`; lints from a newer local clippy are not part of the gate. |
| Phase 2 | Fix requires an API change across crates | **Return**: add the change as a new `edit_plan` step and run it through `tkt-small-edit-loop`. |
| Phase 3 | Tests fail after a clippy fix | **Retry**: revert that fix with `git restore -p` and apply a behavior-preserving alternative. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
