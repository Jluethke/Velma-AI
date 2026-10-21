# Rust API Reference With cargo doc and docs.rs Metadata

**One-line description:** Builds a crate's rustdoc reference with `cargo doc --no-deps` under `RUSTDOCFLAGS="-D warnings"` so broken intra-doc links, bare URLs and invalid code block attributes fail the build, covers every feature combination users see on docs.rs through `[package.metadata.docs.rs]`, and records each rustdoc lint fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the crate or workspace root.
- `docstring_report` (object[], required): Result of `dfc-rust-doc-comments`; must show zero remaining warnings.

---

## Outputs

- `api_reference_dir` (string): `target/doc/<crate_name>/index.html` locally, and `https://docs.rs/<crate>` for published versions.
- `api_build_log` (object[]): rustdoc lint findings by lint name before and after, with the fix per finding.

---

## Phase 1: Strict Local Build

### Entry Criteria
- `docstring_report` shows zero remaining warnings.
- `cargo build` succeeds.

### Actions
1. Build with warnings denied, skipping dependency docs: `RUSTDOCFLAGS="-D warnings" cargo doc --no-deps --all-features 2>&1 | tee /tmp/rustdoc.log`. On Windows PowerShell set the variable with `$env:RUSTDOCFLAGS="-D warnings"` first.
2. Count by lint: `grep -o -E 'rustdoc::[a-z_]+' /tmp/rustdoc.log | sort | uniq -c`.
3. Fix with this table:

   | Lint | Typical message | Fix |
   |---|---|---|
   | `rustdoc::broken_intra_doc_links` | `unresolved link to 'Foo'` | Use the full path (`` [`crate::parse::Foo`] ``) or fix the name |
   | `rustdoc::private_intra_doc_links` | public item links to a private item | Link to a public item or remove the link |
   | `rustdoc::bare_urls` | `this URL is not a hyperlink` | Wrap in angle brackets: `<https://example.com>` |
   | `rustdoc::invalid_codeblock_attributes` | unknown attribute such as `should-panic` | Use the real attribute `should_panic` |
   | `rustdoc::invalid_html_tags` | unclosed HTML tag such as `<T>` in prose | Put generic types in backticks: `` `Vec<T>` `` |

4. Fix one lint per rebuild. Do NOT add `#![allow(rustdoc::...)]` to get a clean build; an allow needs a written reason in `api_build_log` and the user's approval.

### Output
Strict build passing; findings in `api_build_log`.

### Quality Gate
- `RUSTDOCFLAGS="-D warnings" cargo doc --no-deps --all-features; echo $?` prints `0` last.
- `ls target/doc/<crate_name>/index.html` succeeds (hyphens in the package name become underscores in the directory).

---

## Phase 2: Feature Coverage and docs.rs Configuration

### Entry Criteria
- Strict build passes.

### Actions
1. List features: `cargo metadata --no-deps --format-version 1 | jq '.packages[] | {name, features: (.features | keys)}'`.
2. Decide the docs.rs build:

   | Crate features | `[package.metadata.docs.rs]` |
   |---|---|
   | No features | Omit the table |
   | Features that can all be enabled together | `all-features = true` |
   | Mutually exclusive features (compile error with `--all-features`) | `features = ["<the set users mostly use>"]` |
   | Platform-specific APIs | Add `targets = [...]` with the targets that expose them |

3. To show which feature an item needs, the common pattern is `rustdoc-args = ["--cfg", "docsrs"]` in that table plus a crate attribute gated on `docsrs` that enables rustdoc's feature-badge support. The unstable feature name has changed across nightly versions; take the current attribute from the docs.rs "About / Metadata" page and the rustdoc book's `doc_cfg` section, do not copy one from memory.
4. Build each documented feature set locally at least once: `cargo doc --no-deps --no-default-features` and `cargo doc --no-deps --features <set>`.

### Output
`[package.metadata.docs.rs]` written when needed.

### Quality Gate
- `cargo doc --no-deps --no-default-features; echo $?` prints `0` last.
- `cargo doc --no-deps` with the exact feature list from the docs.rs table prints `0` last.

---

## Phase 3: Review the Rendered Output

### Entry Criteria
- Feature builds pass.

### Actions
1. Open `target/doc/<crate_name>/index.html` (`cargo doc --no-deps --open`).
2. Check the crate root page shows the `//!` crate docs, the "All Items" page lists the public items expected from `lib.rs` re-exports, and re-exported items appear where users import them (`pub use` makes them inline; `#[doc(no_inline)]` keeps them as links).
3. For a published version, check `https://docs.rs/crate/<crate>/<version>/builds` for a successful build; a failed docs.rs build shows the log there.

### Output
`api_reference_dir`.

### Quality Gate
- `grep -c 'class="item-name"\|<dt>' target/doc/<crate_name>/all.html` returns a count greater than 0 (rustdoc HTML markup varies by version; if both patterns return 0, open the page and count items by eye and record the count).
- For a published crate, the docs.rs builds page lists the version with status success.

---

## Worked Example

Illustrative only. Phase 1:
```
$ RUSTDOCFLAGS="-D warnings" cargo doc --no-deps --all-features
error: unresolved link to `Verison`
 --> src/lib.rs:5:22
  |
5 | //! Start with [`parse`], which returns a [`Verison`].
  |                                            ^^^^^^^ no item named `Verison` in scope
  = note: `-D rustdoc::broken-intra-doc-links` implied by `-D warnings`
error: this URL is not a hyperlink
 --> src/version.rs:3:5
```
Fixes: typo `Verison` to `Version`; URL wrapped in `<...>`. Rebuild prints `Finished` and `Generated target/doc/semverlite/index.html`.

Phase 2: features `serde` and `std` combine safely, so `[package.metadata.docs.rs] all-features = true`.

---

## Exit Criteria

DONE when the strict rustdoc build passes for every documented feature set, docs.rs metadata matches the feature decision table, and the rendered crate root shows crate docs and all public items.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--all-features` fails to compile | **Adjust**: features are mutually exclusive; build per feature set and use the `features = [...]` row in Phase 2. |
| Phase 1 | Warnings come from a dependency | **Adjust**: confirm `--no-deps` is set; dependency docs are not built with it. |
| Phase 2 | docs.rs build fails but local passes | **Adjust**: docs.rs builds without network access; move build-script downloads behind a `docsrs` cfg check per the docs.rs documentation. |
| Phase 3 | Workspace with many crates | **Adjust**: run Phase 1 with `--workspace --no-deps` and review each crate root. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
