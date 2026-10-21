# Rust Vulnerability Scan With cargo audit

**One-line description:** Scans `Cargo.lock` against the RustSec advisory database with `cargo audit` (and optionally `cargo deny check advisories`), separates vulnerabilities from unmaintained and yanked warnings, and finds the minimal crate update that patches each one.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `work_dir`.
- `lockfile_status` (object, required): From `dup-rust-lockfile-hygiene`. Uses `lock_tracked`, `rust_version`.

---

## Outputs

- `vuln_findings` (object[]): One record per (crate, advisory): `ecosystem` (`crates.io`), `name`, `installed`, `advisory_id` (RUSTSEC-YYYY-NNNN), `aliases`, `kind` (`vulnerability`, `unmaintained`, `unsound`, `yanked`), `patched` (version requirements), `min_fix`, `fix_update_type`, `dependents` (workspace path from `cargo tree -i`). Also written to `<work_dir>/vulns.json`.

---

## Phase 1: Run cargo audit

### Entry Criteria
- `Cargo.lock` exists (cargo audit reads only the lockfile).

### Actions
1. Install: `cargo install --locked cargo-audit`. Record `cargo audit --version`.
2. Run: `cargo audit --json > .dep-upgrade/cargo-audit.json` and the readable form `cargo audit | tee .dep-upgrade/cargo-audit.txt`.
3. Exit code is non-zero when vulnerabilities are found. Warnings (unmaintained, unsound, yanked) do not fail the run unless `--deny warnings` (check `cargo audit --help` for the `--deny` values in your version).
4. Optional second opinion if the project already uses cargo-deny (`deny.toml` present): `cargo deny check advisories`. Do not add `deny.toml` without asking.
5. Do not run `cargo audit fix`. It is an optional, feature-gated subcommand that edits `Cargo.toml` requirements; changes go through the plan instead.

### Output
JSON and text results.

### Quality Gate
- The JSON parses and contains `vulnerabilities.found` (bool) and `warnings`.

---

## Phase 2: Normalize And Find Fixes

### Entry Criteria
- JSON parses.

### Actions
1. For each `vulnerabilities.list[]`: `advisory.id`, `advisory.aliases`, `package.name`, `package.version`, `versions.patched` (semver requirements such as `>=1.8.1`), `versions.unaffected`. `kind=vulnerability`.
2. For each entry under `warnings` (`unmaintained`, `unsound`, `yanked`): record with that `kind`. `unmaintained` has no patched version; the response is a replacement crate, chosen by the user from the advisory text.
3. `min_fix`: smallest published version matching a `patched` requirement. List versions: `cargo info <crate>` or `cargo search <crate>`; confirm the version exists before recording it.
4. `dependents`: `cargo tree -i <crate>@<installed> --locked` shows which workspace crate pulls it in.
5. Decide whether a lock-only fix works:

| Check | Route |
|---|---|
| `min_fix` is semver-compatible with every requirement on the crate in the tree | lock-only: `cargo update -p <crate>@<installed> --precise <min_fix>` (applied later by `dup-apply-one-bump`) |
| a dependent's requirement excludes `min_fix` | the dependent crate must be upgraded first; record that dependent as the target |
| `min_fix` needs a newer rustc than `rust_version` | blocked by MSRV; record |

6. `fix_update_type` with Cargo semver rules (0.x minor counts as major).
7. Merge into `<work_dir>/vulns.json` by (`ecosystem`, `name`, `advisory_id`).

### Output
`vuln_findings`.

### Quality Gate
- Every `vulnerability` record has `min_fix` or `no_fix=true`, and a route from the table.

---

## Worked Example

Illustrative only.

- Phase 1: `cargo audit` prints `Crate: h2 Version: 0.3.24 Title: Degradation of service in h2 servers with CONTINUATION Flood ID: RUSTSEC-2024-0332 Solution: Upgrade to ^0.3.26 OR >=0.4.4` and a warning `Crate: atty ... Warning: unmaintained`.
- Phase 2: `cargo tree -i h2@0.3.24` shows `hyper v0.14.28` requires `h2 ^0.3.24`; `0.3.26` is compatible, route lock-only `cargo update -p h2 --precise 0.3.26`. `atty` unmaintained, used by `clap v3`; record it; it goes away with the clap 4 upgrade.

---

## Exit Criteria

DONE when every RustSec vulnerability and warning in the lock is recorded with a route.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Advisory DB fetch fails | **Retry**: once; offline use `--no-fetch` only with a recent local DB, and record its date. |
| Phase 1 | `Cargo.lock` missing | **Stop**: run `dup-rust-lockfile-hygiene` first. |
| Phase 2 | Patched version requires a newer rustc | **Return**: record `blocked_by_msrv` and ask whether to raise `rust-version`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
