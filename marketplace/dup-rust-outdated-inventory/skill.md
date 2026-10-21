# Rust Outdated Inventory

**One-line description:** Produces a normalized list of outdated crates with `cargo outdated` (Compat versus Latest columns) cross-checked by `cargo update --dry-run`, separating workspace-direct from transitive crates and flagging crates whose new versions exceed the project MSRV.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `target_packages`, `work_dir`.
- `lockfile_status` (object, required): From `dup-rust-lockfile-hygiene`. Uses `rust_version`, `workspace_members`.

---

## Outputs

- `outdated_inventory` (object[]): One record per outdated crate: `ecosystem` (`crates.io`), `name`, `current`, `wanted` (Compat column), `latest`, `update_type`, `direct`, `dev` (only in `[dev-dependencies]`), `member` (workspace member), `rust_version_of_latest`. Also written to `<work_dir>/outdated.json`.

---

## Phase 1: Collect Raw Data

### Entry Criteria
- `cargo metadata --locked` passes.

### Actions
1. Install the subcommand if missing (third-party tool, not bundled with Cargo): `cargo install --locked cargo-outdated`.
2. Direct dependencies only: `cargo outdated --root-deps-only --format json > .dep-upgrade/cargo-outdated.json` (`-R` is the short form). For a workspace add `--workspace`. Check `cargo outdated --help` for the installed version's flags.
3. Read the text columns if you run without `--format json`: `Name`, `Project` (locked version), `Compat` (newest semver-compatible version, `---` when none newer), `Latest` (newest overall), `Kind` (`Normal`, `Development`, `Build`), `Platform`.
4. Cross-check with Cargo itself (no plugin): `cargo update --dry-run --verbose 2>&1 | tee .dep-upgrade/cargo-update-dry.txt`. It prints `Updating <crate> vA -> vB` for compatible moves and, with `--verbose`, `Unchanged <crate> vA (available: vC)` for crates held back by requirements. Nothing is written with `--dry-run`.
5. If `cargo outdated` fails to build its own resolver against the workspace, use step 4 output plus `cargo search <crate> --limit 1` or `cargo info <crate>` (Cargo 1.82+) for `latest`.

### Output
Raw outdated data.

### Quality Gate
- At least one of the two raw files exists with exit code 0 recorded.
- `git status --porcelain Cargo.lock` prints nothing (the dry run wrote nothing).

---

## Phase 2: Normalize And Classify

### Entry Criteria
- Raw data exists.

### Actions
1. `direct=true` for crates listed in any member's `[dependencies]`, `[dev-dependencies]`, `[build-dependencies]` or `[workspace.dependencies]`. `dev=true` when only in `[dev-dependencies]`.
2. `update_type` follows Cargo's compatibility rules: for `>=1.0.0`, major when the first number changes; for `0.y.z` with `y > 0`, major when `y` changes; for `0.0.z`, every change is major. Minor and patch otherwise.
3. `rust_version_of_latest`: `cargo info <crate>@<latest>` prints `rust-version` (Cargo 1.82+), or read `rust_version` from `https://crates.io/api/v1/crates/<crate>/<latest>`. If it exceeds `lockfile_status.rust_version`, mark `blocked_by_msrv`.
4. Note yanked versions: `cargo update --dry-run` warns when the locked version is yanked; record those with high priority.
5. Filter to `target_packages`; merge into `<work_dir>/outdated.json` by (`ecosystem`, `name`).

### Output
`outdated_inventory`.

### Quality Gate
- Every record has `update_type`, `direct`, and `rust_version_of_latest` (or `unknown`).

---

## Worked Example

Illustrative only. Workspace with MSRV 1.74.

- Phase 1: `cargo outdated -R --workspace` table rows: `tokio 1.36.0 1.47.1 1.47.1 Normal`, `clap 3.2.25 --- 4.5.47 Normal`, `rand 0.8.5 --- 0.9.2 Normal`. `cargo update --dry-run --verbose` prints `Updating tokio v1.36.0 -> v1.47.1` and `Unchanged clap v3.2.25 (available: v4.5.47)`.
- Phase 2: tokio `minor`; clap `major`; rand `major` (0.8 to 0.9). `cargo info tokio@1.47.1` shows `rust-version: 1.70`, fine; `cargo info clap@4.5.47` shows `rust-version: 1.74`, fine.

---

## Exit Criteria

DONE when `<work_dir>/outdated.json` holds classified crate records with MSRV checks.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `cargo install cargo-outdated` fails to compile | **Adjust**: use `cargo update --dry-run --verbose` plus `cargo info` only. |
| Phase 1 | Dry run modified `Cargo.lock` | **Stop**: `git checkout -- Cargo.lock`; report the command that wrote it. |
| Phase 2 | `cargo info` not available (Cargo older than 1.82) | **Adjust**: use the crates.io API URL. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
