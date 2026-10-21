# Rust API Diff With cargo-semver-checks

**One-line description:** Classifies a Rust crate release as major, minor or patch by running `cargo semver-checks` against the previous published version or git tag and reading each failed lint and its required bump.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rust_export_surface` (object, required): From `pkg-rust-pub-surface`.
- `previous_release_ref` (string, optional): Previous release git tag, for example `v0.3.0`. Absent means compare with the latest crates.io version, or a first release if the crate is unpublished.
- `project_dir` (string, required): Crate root.

---

## Outputs

- `rust_change_class` (string): One of `initial`, `major`, `minor`, `patch`, `none`.
- `rust_api_diff` (object): Each failed lint (name, required bump, item, location), the tool's summary line, and pasted output.

---

## Phase 1: Run cargo semver-checks

### Entry Criteria
- `cargo build` exits 0.
- If the crate was never published and no ref is given, set `rust_change_class = initial` and skip to Phase 3.

### Actions
1. Install: `cargo install cargo-semver-checks --locked`. Record `cargo semver-checks --version`.
2. Pick the baseline:

   | Situation | Command |
   |---|---|
   | ref given | `cargo semver-checks --baseline-rev <previous_release_ref>` |
   | no ref, crate on crates.io | `cargo semver-checks` (default baseline is the latest crates.io version) |
   | workspace member | add `-p <crate>` |

3. Run it. It builds rustdoc JSON for both versions; the first run takes longer.
4. Read each block: `--- failure <lint_name>: <description> ---`, with `Description:`, `ref:` (link to the rule) and `Failed in:` lines listing items and file positions. The final `Summary` line states the bump the failures require.

### Output
Raw lint failures and summary.

### Quality Gate
- Command and full output are in the report.
- Number of failure blocks in the report equals the number in the output.

---

## Phase 2: Cover What the Tool Does Not Check

### Entry Criteria
- Phase 1 ran.

### Actions
1. cargo-semver-checks only checks what its lints cover. Check these by hand from `git diff <ref> -- Cargo.toml src`:
   - `rust-version` (MSRV) raised: treat per the project's stated policy; if none is written, ask the user.
   - A Cargo feature removed from `[features]`: breaking.
   - A public dependency's major version bumped (its types appear in this crate's public API): breaking.
   - Default features changed: ask the user.
2. Ask the user about behavior changes listed in `git log --oneline <ref>..HEAD`.

### Output
Manual findings and user answers.

### Quality Gate
- Each manual item is marked breaking, non-breaking, or open question with the diff line as evidence.

---

## Phase 3: Decide the Class

### Entry Criteria
- Phases 1 and 2 done (or first release).

### Actions
1. Decide:

   | # | Condition | `rust_change_class` |
   |---|---|---|
   | 1 | Never published | initial |
   | 2 | Summary requires a major bump, or any manual item is breaking | major |
   | 3 | Summary requires a minor bump, or new public items exist | minor |
   | 4 | Code changed but no API change | patch |
   | 5 | No change | none |

2. Keep the class as measured; `pkg-release-version-lock` maps it onto a 0.x version (where Cargo treats a minor bump as breaking).

### Output
`rust_change_class`, `rust_api_diff`.

### Quality Gate
- The class cites its table row and the Summary line.

---

## Worked Example

Illustrative. `fastcsv`, baseline `v0.3.0`.

```
$ cargo semver-checks --baseline-rev v0.3.0
     Parsing fastcsv v0.4.0 (current)
     Parsing fastcsv v0.3.0 (baseline)
    Checking fastcsv v0.3.0 -> v0.4.0 (minor change)
--- failure enum_variant_added: enum variant added on exhaustive enum ---
Failed in:
  variant ErrorKind:Utf8 in src/error.rs:14
     Summary semver requires new major version: 1 major and 0 minor checks failed
```
Adding a variant to an enum without `#[non_exhaustive]` breaks exhaustive `match` in callers. Row 2: `rust_change_class = major`.

---

## Exit Criteria

DONE when every lint failure and every manual item is recorded and the class cites its row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline rev fails to build | **Adjust**: use `--baseline-version <x.y.z>` from crates.io instead. |
| Phase 1 | rustdoc JSON format error | **Adjust**: update the tool with `cargo install cargo-semver-checks --locked --force`; each release supports specific toolchain versions. |
| Phase 3 | Failure is unintended | **Return**: give it back to the developer to restore compatibility; do not downgrade the class. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
