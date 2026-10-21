# Rust Crate SemVer Check with cargo-semver-checks

**One-line description:** Runs `cargo semver-checks` against the last published or tagged version of a crate, reads which lints failed and what release type they require, and adds the Cargo-specific breaks the tool does not cover (removed features, raised `rust-version`).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the crate or workspace root.
- `last_tag` (string, optional): Git tag of the previous release. If empty, compare against the newest version published on crates.io.
- `package_name` (string, required): Crate name as in `Cargo.toml` `[package] name`.

---

## Outputs

- `rust_api_breaks` (object): `failed_lints` (list of `{lint, description, items}`), `required_bump` (`major`, `minor` or `none` as printed by the tool), `cargo_breaks` (features removed, `rust-version` raised), `baseline` used.

---

## Phase 1: Install and Choose the Baseline

### Entry Criteria
- `cargo build -p <package_name>` succeeds at HEAD.

### Actions
1. Install: `cargo install cargo-semver-checks --locked`. Confirm `cargo semver-checks --version`.
2. Choose the baseline with this table:

   | Situation | Flag |
   |---|---|
   | `last_tag` given | `--baseline-rev <last_tag>` |
   | No tag, crate is on crates.io | default (the tool compares against the newest crates.io version) or `--baseline-version <x.y.z>` |
   | Baseline is a local checkout | `--baseline-root <path>` |

3. Read `cargo semver-checks --help` and confirm the flags you will use are listed. Older releases used the subcommand form `cargo semver-checks check-release`; use the form `--help` shows.

### Output
Chosen baseline flag.

### Quality Gate
- `cargo semver-checks --version` prints a version.
- The chosen flag appears in `--help` output.

---

## Phase 2: Run the Check

### Entry Criteria
- Phase 1 done.

### Actions
1. Run: `cargo semver-checks -p <package_name> <baseline flag>`. The tool builds rustdoc JSON for both versions; the first run is slow.
2. Read the output:
   - One line per lint: `PASS` or `FAIL` with the lint id (for example `function_missing`, `enum_variant_added`, `struct_pub_field_missing`, `trait_method_added`).
   - For each failure, a block `--- failure <lint>: <description> ---` with the affected items and file locations.
   - A summary such as `Summary semver requires new major version: 2 major and 0 minor checks failed`.
3. Copy each failure into `failed_lints` and the required release type into `required_bump`.
4. Know the Cargo rules (Cargo Book, "SemVer Compatibility"): for `0.y.z` versions Cargo treats a change of `y` as the major change, so "new major version" on a 0.x crate means bump `y`.
5. The tool checks the public API only. Behavior changes, `unsafe` contract changes and changes hidden behind `#[doc(hidden)]` are not checked; record that limit in the output.

### Output
`failed_lints`, `required_bump`.

### Quality Gate
- The command line and full summary line are saved verbatim.
- The count of `failed_lints` equals the failure count in the summary line.

---

## Phase 3: Cargo-Level Breaks

### Entry Criteria
- Phase 2 done.

### Actions
1. `git diff <baseline> HEAD -- Cargo.toml` and record in `cargo_breaks`:
   - A feature removed from `[features]`: breaking (dependents enabling it fail to resolve).
   - A feature that was in `default` removed from `default`: breaking for users relying on default features.
   - A public dependency's major version bumped when its types appear in your public API (for example a function returning `serde_json::Value`): breaking.
   - `rust-version` raised: Cargo Book treats MSRV policy as project choice; record as a policy question.
2. Confirm features compile in isolation: `cargo check -p <package_name> --no-default-features` and `cargo check -p <package_name> --all-features`.

### Output
Final `rust_api_breaks`.

### Quality Gate
- Both `cargo check` commands exit 0 or their failure is recorded as a break.
- Every `[features]` and `rust-version` hunk in the diff has an entry or an explicit "no break" note.

---

## Worked Example

Illustrative. `package_name` = `acme-codec`, `last_tag` = `v0.7.3`.

- Phase 1: `--baseline-rev v0.7.3`.
- Phase 2: `cargo semver-checks -p acme-codec --baseline-rev v0.7.3` prints (shape representative):
  ```
  --- failure enum_variant_added: enum variant added on exhaustive enum ---
  Failed in:
    variant Error:Truncated in src/error.rs:22
  Summary semver requires new major version: 1 major and 0 minor checks failed
  ```
  Because the crate is 0.x, "major" means `0.7.3` to `0.8.0`. Fix option for later: mark `Error` `#[non_exhaustive]` in the next breaking release.
- Phase 3: `[features]` lost `simd`: one `cargo_breaks` entry.

---

## Exit Criteria

DONE when `rust_api_breaks` has the tool's failed lints, its required bump copied from the summary, and the Cargo manifest breaks, each traceable to command output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Install fails compiling | **Retry**: `rustup update stable`, then reinstall with `--locked`. |
| Phase 2 | Error about rustdoc JSON format version | **Adjust**: update cargo-semver-checks to the newest release; it pins supported rustdoc formats. |
| Phase 2 | Baseline crate not found on crates.io | **Adjust**: pass `--baseline-rev <last_tag>` instead. |
| Phase 2 | Workspace with many crates | **Adjust**: run with `-p` once per published crate; skip `publish = false` crates. |
| Any | Tempted to add `#[doc(hidden)]` to silence a failure | **Stop**: that hides a real break; report it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
