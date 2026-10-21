# Prove Each Rust API Exists for the Locked Crate Version and Features

**One-line description:** Checks every external Rust item in the edit plan against the crate version pinned in `Cargo.lock`, the features actually enabled (`cargo tree -e features`), the crate source in the cargo registry, and the toolchain's `rust-version`, so no invented method, feature-gated item or too-new std API reaches the code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_plan` (object[], required): From `stp-edit-plan-write`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `rust_api_evidence` (object[]): `[{ "symbol": str, "status": "FOUND"|"NOT_FOUND"|"WRONG_SIGNATURE"|"FEATURE_GATED"|"VERSION_GATED", "crate": str, "version": str, "evidence": str, "command": str }]`.

---

## Phase 1: Resolve Crate Version and Features

### Entry Criteria
- `edit_plan` lists at least one external symbol.

### Actions
1. Run `rustc --version`. Read `rust-version` (the MSRV) from the package's `Cargo.toml` if present; code must compile on it.
2. For each symbol, take the crate: `std`, `core`, `alloc`, or the first path segment (`serde_json::to_string` is crate `serde_json`; `unicode_normalization::UnicodeNormalization` is crate `unicode-normalization`; hyphens in the crate name become underscores in paths).
3. Locked version: `cargo tree -p <package> -i <crate> --depth 0` prints `<crate> vX.Y.Z`. An error "package ID specification `<crate>` did not match any packages" means the crate is not a dependency: `NOT_FOUND`.
4. Features enabled: `cargo tree -p <package> -e features -i <crate>` lists the features turned on for that crate in this build. Record them.

### Output
Crate, version and enabled features per symbol.

### Quality Gate
- Each non-std symbol has a version printed by `cargo tree`, or status `NOT_FOUND`.

---

## Phase 2: Find the Item in the Source

### Entry Criteria
- Phase 1 done.

### Actions
1. Locate the crate source: `cargo metadata --format-version 1 | rg -o '"manifest_path":"[^"]*<crate>-<version>[^"]*"'` gives the path to its `Cargo.toml`; the source is in the `src/` next to it (usually under `~/.cargo/registry/src/<index>/<crate>-<version>/`). On Windows the path is under `%USERPROFILE%\.cargo\registry\src\`.
2. Search the item: `rg -n "pub (async )?fn NAME\b|pub (struct|enum|trait|type|const) NAME\b" <crate src dir>`. For a trait method, find the trait: `rg -n "pub trait \w+" <src>` then the method inside it.
3. Feature gates: look at the lines above the match for `#[cfg(feature = "x")]` or `#[cfg_attr(docsrs, doc(cfg(feature = "x")))]`. If `x` is not in the enabled features from Phase 1, status `FEATURE_GATED`. Enabling a feature changes `Cargo.toml`, which is out of scope unless the user allowed it.
4. Trait methods need the trait in scope: if `NAME` is a trait method (for example `.nfkd()` from `unicode_normalization::UnicodeNormalization`), the plan must contain a `use` of that trait. Record the required `use` line in `evidence`.
5. Signature: copy the full `fn` line including generics, `where` clause and return type. Compare arguments, ownership (`self`, `&self`, `&mut self`) and whether it returns `Result` or `Option` (your `new_text` must handle it with `?`, `match` or a documented method).
6. Standard library: run `rustup doc --std` if local docs are installed, or read doc.rust-lang.org/std for the item; each item shows "since 1.N.0" at the right of its heading. Compare with `rust-version` (MSRV). Newer: `VERSION_GATED` (for example `Option::is_some_and` is since 1.70.0).
7. Fastest final proof for a single item: `cargo check -p <package>` after the edit will also catch a missing item, but this flow must give evidence before the edit.

### Output
Status and quoted signature per symbol.

### Quality Gate
- Each `FOUND` row quotes a `pub fn`/`pub struct`/`pub trait` line from the crate source (or the std "since" version).
- Each trait-method row names the trait `use` line the edit needs.

---

## Phase 3: Report

### Entry Criteria
- All symbols checked.

### Actions
1. Emit `rust_api_evidence`.
2. For non-`FOUND` rows, propose an alternative only after checking it the same way.
3. Never use docs.rs "latest" for a locked older version; open `docs.rs/<crate>/<version>/` with the exact locked version.

### Output
`rust_api_evidence`.

### Quality Gate
- Row count equals the number of distinct external symbols across `edit_plan`.

---

## Worked Example

Illustrative only.

Plan symbols: `unicode_normalization::UnicodeNormalization::nfkd`, `char::is_ascii_alphanumeric`. MSRV `1.70`.

```
$ cargo tree -p slugrs -i unicode-normalization --depth 0
unicode-normalization v0.1.23
$ rg -n "fn nfkd\b" ~/.cargo/registry/src/index.crates.io-6f17d22bba15001f/unicode-normalization-0.1.23/src
src/lib.rs:96:    fn nfkd(self) -> Decompositions<I>;
$ rg -n "pub trait UnicodeNormalization" ~/.cargo/registry/src/index.crates.io-6f17d22bba15001f/unicode-normalization-0.1.23/src/lib.rs
85:pub trait UnicodeNormalization<I: Iterator<Item = char>> {
```

`nfkd` FOUND as a trait method; `evidence` adds "needs `use unicode_normalization::UnicodeNormalization;`". `char::is_ascii_alphanumeric` FOUND, stable since 1.24.0, below MSRV.

---

## Exit Criteria

DONE when every external Rust item has a status backed by a quoted source line from the locked crate version or the std "since" version, with feature gates and required trait imports recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Crate not in the dependency tree | **Return**: `NOT_FOUND`; `cargo add` is out of scope. |
| Phase 1 | Two versions of the crate in the tree | **Adjust**: use the version `cargo tree -i` shows under your package, not the other one. |
| Phase 2 | Item generated by a macro (no `pub fn` line) | **Adjust**: run `cargo doc -p <crate> --no-deps` and search `target/doc/<crate_underscored>/` for the item page. |
| Phase 2 | Item behind a disabled feature | **Return**: `FEATURE_GATED` with the feature name. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
