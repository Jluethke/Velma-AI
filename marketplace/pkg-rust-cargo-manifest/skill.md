# Cargo.toml Publishing Metadata

**One-line description:** Sets the `Cargo.toml` fields crates.io requires and recommends, replaces path-only and git dependencies with registry versions, declares and checks `rust-version`, and confirms the packaged file list with `cargo package --list`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `license_report` (object, required): From `pkg-license-metadata`; the `license` line.
- `release_version` (string, required): From `pkg-release-version-lock`.
- `project_dir` (string, required): Crate root.

---

## Outputs

- `cargo_manifest_report` (object): Final `[package]` table, dependency fixes, MSRV check output, `cargo package --list` output with verdicts, and verdict PASS or FAIL.

---

## Phase 1: Fill the [package] Table

### Entry Criteria
- `cargo build` exits 0.

### Actions
1. Set these fields:

   | Field | Rule |
   |---|---|
   | `name` | the crate name |
   | `version` | `release_version` |
   | `edition` | the edition the code compiles under (`2021` or `2024`) |
   | `description` | required by crates.io; one sentence |
   | `license` | from `license_report` (required, or `license-file`) |
   | `repository` | the source URL |
   | `readme` | `"README.md"` (Cargo picks it up automatically when the file exists) |
   | `documentation` | omit to default to docs.rs |
   | `keywords` | up to 5 words (crates.io limit), lowercase ASCII |
   | `categories` | slugs from `https://crates.io/category_slugs` only |
   | `rust-version` | the MSRV; checked in Phase 2 |

2. Exclude files that should not ship with an allowlist: `include = ["src/**", "Cargo.toml", "README.md", "LICENSE-*"]`, or an `exclude` list. Use one, not both.
3. Workspace members may inherit with `version.workspace = true`; the published manifest then gets the resolved values.

### Output
`[package]` filled.

### Quality Gate
- `cargo metadata --no-deps --format-version 1 | python -c "import json,sys; p=json.load(sys.stdin)['packages'][0]; print(p['version'], p['license'], bool(p['description']))"` prints the version, license and `True`.

---

## Phase 2: Fix Dependencies and MSRV

### Entry Criteria
- Phase 1 done.

### Actions
1. crates.io rejects dependencies that cannot be resolved from a registry. Apply:

   | Dependency form | Section | Fix |
   |---|---|---|
   | `foo = { path = "../foo" }` | `[dependencies]` | add `version = "x.y"`; publish `foo` first |
   | `foo = { git = "..." }` | `[dependencies]` | replace with a published version |
   | `foo = { path = "../foo" }` | `[dev-dependencies]` | allowed; Cargo strips path-only dev-dependencies when packaging |

2. Check MSRV: install the declared toolchain (`rustup toolchain install <rust-version>`) and run `cargo +<rust-version> check --all-features`. If `cargo-msrv` is installed, `cargo msrv verify` does the same. If it fails, raise `rust-version` (a change the semver flow must have counted) or fix the code.
3. Run `cargo check --no-default-features` and `cargo check --all-features` to confirm feature combinations compile.

### Output
Dependency and MSRV fixes.

### Quality Gate
- `grep -nE 'git *=' Cargo.toml` prints nothing in `[dependencies]`.
- `cargo +<rust-version> check` exits 0.

---

## Phase 3: Inspect the Packaged Files

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. `cargo package --list` prints every file that goes into the `.crate`.
2. Verdicts: `Cargo.toml`, `Cargo.toml.orig`, `src/**`, `README.md`, license files, `build.rs` if used: ship. Large test data, `target/`, `.github/`, `.env`, keys, benchmark fixtures: remove via `include` or `exclude`.
3. Check size: `cargo package` writes `target/package/<name>-<version>.crate`; `ls -l` it. crates.io enforces an upload size limit (10 MB by default per the crates.io docs); a larger crate is rejected.
4. `Cargo.lock` is included for crates with binaries; it does not affect library consumers.

### Output
`cargo_manifest_report`.

### Quality Gate
- `cargo package --list | grep -iE '\.env|\.pem|\.key|^target/'` prints nothing.
- `cargo package` exits 0.

---

## Worked Example

Illustrative. `fastcsv` 0.4.0.

Phase 2: `[dependencies] fastcsv-core = { path = "../core" }` becomes `{ path = "../core", version = "0.4" }`; `fastcsv-core` must be published first. `rust-version = "1.74"`, `cargo +1.74 check` passes.

Phase 3:
```
$ cargo package --list
.cargo_vcs_info.json
Cargo.toml
Cargo.toml.orig
LICENSE-APACHE
LICENSE-MIT
README.md
src/lib.rs
src/error.rs
tests/data/huge.csv
```
`tests/data/huge.csv` is 38 MB: add `exclude = ["tests/data/*"]`. Rerun: 8 files; crate file 21 KB.

---

## Exit Criteria

DONE when required fields are set, no registry-unresolvable dependency remains, MSRV is verified with its toolchain, and the packaged file list contains only intended files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Category slug rejected | **Adjust**: pick from the crates.io slug list; never invent one. |
| Phase 2 | Path dependency is unpublished | **Stop**: publish the dependency crate first, in dependency order. |
| Phase 2 | MSRV check fails | **Return**: ask the user whether to raise `rust-version` or fix the code. |
| Phase 3 | Crate over the size limit | **Adjust**: exclude data files; rerun `cargo package`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
