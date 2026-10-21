# Rust Post-Publish Install Verification

**One-line description:** Creates a fresh Cargo project outside the workspace, depends on the exact just-published version from crates.io (`=x.y.z`), builds it with default features, with no default features and with each documented feature, installs binaries with `cargo install --locked --version`, and records the docs.rs build status.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `package_name` (string, required): Crate name.
- `next_version` (object, required): Uses `semver`.
- `crates_release_url` (object, required): From rel-rust-publish-crates; holds the registry checksum.

---

## Outputs

- `rust_install_report` (object): `status` (`PASS` or `FAIL`), resolved version and checksum from `Cargo.lock`, build results per feature set, `cargo install` result, MSRV build result, docs.rs status.

---

## Phase 1: Fresh Consumer Project

### Entry Criteria
- `crates_release_url` present.

### Actions
1. `D=$(mktemp -d) && cd "$D" && cargo new verify && cd verify`. Run outside any workspace; a parent `Cargo.toml` with `[workspace]` would capture it (`cargo locate-project --workspace` must print `$D/verify/Cargo.toml`).
2. Add the exact version: `cargo add <package_name>@=<semver>`. The `=` stops Cargo from picking a newer compatible release.
3. `cargo generate-lockfile`. If the version is not found right after publish, run `cargo update` once the index has it, within the user's attempt limit.
4. Read the lockfile entry: `grep -A3 'name = "<package_name>"' Cargo.lock`. `version` must equal `semver` and `checksum` must equal the registry checksum in `crates_release_url`.

### Output
Consumer project with resolved dependency.

### Quality Gate
- `cargo locate-project --workspace` prints the new project's manifest.
- `Cargo.lock` version and checksum equal the published values.

---

## Phase 2: Build Feature Sets

### Entry Criteria
- Dependency resolved.

### Actions
1. Use the crate in `src/main.rs`: reference one public item. Find a real one with the crate's docs or `cargo doc --open` in the consumer; do not invent names.
2. Build with default features: `cargo build`.
3. List the crate's features: `cargo metadata --format-version 1 | jq -r '.packages[] | select(.name=="<package_name>") | .features | keys[]'`.
4. No default features: `cargo add <package_name>@=<semver> --no-default-features` then `cargo build`.
5. Each non-default feature on its own: `cargo add <package_name>@=<semver> --no-default-features --features <feature>` then `cargo build`. Restore with `cargo add <package_name>@=<semver>` at the end.
6. MSRV: if the crate declares `rust-version`, build once with that toolchain: `cargo +<rust-version> build`. Install it with `rustup toolchain install <rust-version>` if missing.

### Output
Build results per feature set.

### Quality Gate
- Each feature-set build exit code is recorded.
- MSRV build exit code is recorded, or "no rust-version declared".

---

## Phase 3: Binaries and docs.rs

### Entry Criteria
- Phase 2 done.

### Actions
1. If the crate has binaries (`[[bin]]` or `src/main.rs`): `cargo install <package_name> --version <semver> --locked --root $(mktemp -d)`. `--locked` uses the `Cargo.lock` shipped in the package; without it users get different dependency versions than you tested.
2. Run the installed binary with `--version` and require exit 0 and the version string.
3. docs.rs: open `https://docs.rs/crate/<package_name>/<semver>` and read the build status, or query the docs.rs build status page for that version. A failed docs build is a FAIL for libraries because users rely on the docs.
4. Set `status` = `PASS` only if all checks passed.

### Output
`rust_install_report`.

### Quality Gate
- `cargo install` exit code and the binary's `--version` output are recorded (or "library only").
- `status` agrees with recorded exit codes.

---

## Worked Example

Illustrative. `acme-codec` `0.8.0`, features `default = ["std"]`, `simd`, `serde`.

- Phase 1: `cargo add acme-codec@=0.8.0`; `Cargo.lock` shows `version = "0.8.0"`, `checksum = "e71c...9a"`, equal to crates.io.
- Phase 2: default build passes; `--no-default-features` fails with `error[E0433]: failed to resolve: use of undeclared crate or module std` in `acme-codec/src/buf.rs`: the `no_std` path is broken.
- Phase 3: library only. docs.rs shows build succeeded. `status` = `FAIL` with the `--no-default-features` error; rel-yank-bad-release decides whether to yank.

---

## Exit Criteria

DONE when the exact published version resolved from crates.io with a matching checksum in a fresh project, every feature set and the MSRV were built, binaries installed with `--locked`, docs.rs status is recorded, and `status` reflects all results.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `failed to select a version for the requirement` right after publish | **Retry**: index propagation, within the user's attempt limit. |
| Phase 1 | Checksum differs | **Stop**: FAIL; report immediately. |
| Phase 2 | Feature combination fails to compile | **Return**: FAIL with the exact error; the fix ships in a patch release. |
| Phase 3 | `cargo install --locked` fails because the package has no lockfile | **Adjust**: record "no shipped lockfile", install without `--locked`, and note reduced reproducibility. |
| Phase 3 | docs.rs build failed | **Return**: FAIL for libraries; read the docs.rs build log for the cause. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
