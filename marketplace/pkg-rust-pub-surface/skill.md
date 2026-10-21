# Rust Public Surface

**One-line description:** Narrows a Rust crate's public surface with `pub(crate)`, deliberate `pub use` re-exports in `lib.rs`, `#[non_exhaustive]` and sealed traits, verified with the `unreachable_pub` lint, `cargo doc` and `cargo public-api`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `public_api` (object[], required): From `pkg-public-api-inventory`; public items and leaks with fixes.
- `project_dir` (string, required): Crate root containing `Cargo.toml`.

---

## Outputs

- `rust_export_surface` (object): Final list of items reachable from the crate root, items made `pub(crate)`, types marked `#[non_exhaustive]`, sealed traits, and pasted gate output.

---

## Phase 1: Find Unintended pub Items

### Entry Criteria
- `cargo build` and `cargo test` exit 0 before changes.

### Actions
1. Add `#![warn(unreachable_pub)]` at the top of `src/lib.rs` temporarily and run `cargo check 2>&1 | grep -A3 unreachable_pub`. Each warning is an item marked `pub` that cannot be reached from outside the crate; change each to `pub(crate)`.
2. Generate the public listing: `cargo install cargo-public-api --locked` (it needs a nightly toolchain installed: `rustup toolchain install nightly`), then `cargo public-api > /tmp/api-before.txt`. If installation is not possible, use `cargo doc --no-deps` and read `target/doc/<crate>/all.html`.
3. Compare the listing against `public_api`. Every reachable item marked `leak` needs a fix.

### Output
List of reachable leaked items.

### Quality Gate
- `cargo check` prints zero `unreachable_pub` warnings after step 1 fixes.
- The listing file or `all.html` path is in the report.

---

## Phase 2: Close Leaks and Shape Re-exports

### Entry Criteria
- Leak list exists.

### Actions
1. For a leaked module: change `pub mod helpers;` to `mod helpers;` in `lib.rs`, then `pub use` only the public items: `pub use crate::helpers::Parser;`.
2. For a leaked item in a public module: change `pub fn` to `pub(crate) fn`.
3. For a re-exported dependency type (`pub use serde_json::Value;`), remove the re-export unless it is documented API; a public dependency type ties this crate's major version to that dependency's.
4. Change one module at a time and run `cargo test` after each.
5. For a shipped leak, do not remove it outside a major release; add `#[deprecated(since = "<next version>", note = "use X")]` and `#[doc(hidden)]` only after deprecation is documented.

### Output
Leaks closed or deprecated.

### Quality Gate
- `cargo test` exits 0.
- `cargo public-api` output (or `all.html`) no longer lists any never-shipped leak.

---

## Phase 3: Make Future Additions Non-Breaking

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Apply this table to each public type:

   | Item | Will gain new variants or fields later? | Action |
   |---|---|---|
   | public enum | yes or unknown | add `#[non_exhaustive]` (callers must add a `_ =>` arm) |
   | public struct with public fields | yes or unknown | add `#[non_exhaustive]` (callers cannot construct it with a literal; provide `new` or a builder) |
   | public trait that users should not implement | n/a | seal it: `pub trait Codec: private::Sealed {}` with `mod private { pub trait Sealed {} }` and impls only inside the crate |
   | anything already released without these | n/a | adding `#[non_exhaustive]` to a released type is breaking; only do it in a major release |

2. Add `#![warn(missing_docs)]` and run `cargo doc --no-deps`; document each public item it flags.
3. Remove the temporary `#![warn(unreachable_pub)]` if the project does not want it permanently, or keep it.
4. Save the final listing: `cargo public-api > /tmp/api-after.txt` and `diff /tmp/api-before.txt /tmp/api-after.txt`.

### Output
`rust_export_surface`.

### Quality Gate
- `cargo test` and `cargo doc --no-deps` exit 0.
- `cargo doc` prints zero `missing_docs` warnings for public items.
- The before and after diff is in the report.

---

## Worked Example

Illustrative. Crate `fastcsv` 0.3.0.

Phase 1:
```
warning: unreachable `pub` item
  --> src/parse/state.rs:12:1
   |
12 | pub struct ParserState {
```
Changed to `pub(crate)`. `cargo public-api` lists `pub mod fastcsv::util` and `pub fn fastcsv::util::fast_split`, both never documented and not in the README (leaks, but shipped in 0.3.0).

Phase 2: `util` is deprecated with `#[deprecated(since = "0.4.0", note = "use fastcsv::Reader")]`.

Phase 3: `pub enum ErrorKind` (new in this release) gets `#[non_exhaustive]`. `cargo doc --no-deps` finishes with no warnings.

---

## Exit Criteria

DONE when the crate root exposes only intended items, new public types that may grow carry `#[non_exhaustive]`, and test and doc builds pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | cargo-public-api cannot find nightly | **Adjust**: install nightly with rustup or fall back to `cargo doc` listing. |
| Phase 2 | `private type in public interface` error | **Adjust**: the public signature uses the item you made private; keep it public or change the signature in a major release. |
| Phase 3 | Released type would need `#[non_exhaustive]` | **Return**: record it for the next major release; do not add it now. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
