# Rust CLI Packaging for cargo install

**One-line description:** Prepares a Rust CLI crate for `cargo install --locked`: required `Cargo.toml` metadata, a committed `Cargo.lock`, package contents checked with `cargo package --list`, a local `cargo install --path . --root` run, `cargo publish --dry-run`, and a post-publish clean install.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tool_name` (string, required): Binary name.
- `release_version` (string, required): Semver version, for example `1.4.0`.
- `project_dir` (string, required): Root of the Cargo package.
- `e2e_run_log` (string, required): Passing log from `cli-rust-assert-cmd-e2e`.

---

## Outputs

- `package_artifact` (string[]): Path of the `.crate` file under `target/package/`.
- `install_check_log` (string): Output of package listing, local install, dry-run publish and clean install.

---

## Phase 1: Manifest and Lock File

### Entry Criteria
- `e2e_run_log` shows `test result: ok` everywhere.

### Actions
1. Confirm these `Cargo.toml` keys (crates.io requires `description` and a license field):
```toml
[package]
name = "logtrim"
version = "1.4.0"
edition = "2021"
description = "Trim old log lines and report counts"
license = "MIT OR Apache-2.0"
repository = "https://github.com/acme/logtrim"
rust-version = "1.74"
exclude = ["tests/fixtures/big/*"]

[[bin]]
name = "logtrim"
path = "src/main.rs"
```
   `license` and `rust-version` come from the user and from the oldest toolchain CI tested; the values above are examples. Use `license-file` for a non-SPDX license.
2. Commit `Cargo.lock`. `cargo install --locked` uses the lock file shipped in the crate so users get the dependency versions you tested.
3. The version string in `--version` comes from `CARGO_PKG_VERSION` through clap's `#[command(version)]`; no extra step is needed.

### Output
Manifest ready.

### Quality Gate
- `cargo metadata --no-deps --format-version 1 | grep -o '"version":"1.4.0"'` prints a match.
- `git ls-files Cargo.lock` prints `Cargo.lock`.

---

## Phase 2: Package and Local Install

### Entry Criteria
- Manifest ready.

### Actions
1. `cargo package --list` shows every file that would ship. Confirm `src/`, `Cargo.toml`, `Cargo.lock`, `README` and license files are present, and large fixtures or secrets are absent.
2. `cargo package` builds the `.crate` and compiles it in isolation under `target/package/`; this catches files referenced by `include_str!` but excluded from the package.
3. Install locally into a throwaway root:
```
ROOT=$(mktemp -d)
cargo install --path . --locked --root "$ROOT"
"$ROOT/bin/logtrim" --version; echo "exit=$?"
```
4. `cargo publish --dry-run` runs every publish check without uploading.

### Output
`.crate` file and local install log.

### Quality Gate
- `cargo package` ends without errors and prints `Packaged`.
- The local install prints `logtrim 1.4.0` and `exit=0`.

---

## Phase 3: Publish and Clean Install

### Entry Criteria
- Dry run passes.

### Actions
1. Publish only with the user's go-ahead: `cargo publish`. A version can be yanked (`cargo yank --version 1.4.0`) but never replaced; mistakes need a new version.
2. After the index updates, install from crates.io into a new root, from a directory outside the project:
```
cd "$(mktemp -d)"
cargo install logtrim --version 1.4.0 --locked --root "$PWD/r"
./r/bin/logtrim --version; echo "exit=$?"
```
3. Optional: add `[package.metadata.binstall]` for `cargo binstall` users if the release also ships prebuilt archives; follow the cargo-binstall docs for the URL template.
4. Save all outputs as `install_check_log`.

### Output
`package_artifact`, `install_check_log`.

### Quality Gate
- The crates.io install prints the released version and `exit=0`.

---

## Do Not

- Do not run `cargo install` without `--locked` in verification; it resolves newer dependencies than you tested.
- Do not publish with uncommitted changes; `cargo publish` refuses unless `--allow-dirty`, and you must not pass that flag for a release.
- Do not add `exclude` patterns that drop files the build needs; `cargo package` would fail, and that failure is the check working.

---

## Worked Example

Illustrative.
```
$ cargo package --list | head
.cargo_vcs_info.json
Cargo.lock
Cargo.toml
Cargo.toml.orig
LICENSE-MIT
README.md
src/cli.rs
src/main.rs
$ cargo install --path . --locked --root "$ROOT"
  Installing logtrim v1.4.0 (/home/dev/logtrim)
   Installed package `logtrim v1.4.0` (executable `logtrim`)
$ "$ROOT/bin/logtrim" --version; echo "exit=$?"
logtrim 1.4.0
exit=0
$ cargo publish --dry-run
   Packaging logtrim v1.4.0
   Verifying logtrim v1.4.0
   Uploading logtrim v1.4.0
warning: aborting upload due to dry run
```

---

## Exit Criteria

DONE when the crate packages and verifies in isolation, installs with `--locked` into a clean root, and after an approved publish installs from crates.io and reports the released version.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `e2e_run_log` has failures | **Stop**: return to `cli-rust-assert-cmd-e2e`. |
| Phase 2 | `cargo package` fails on a missing file | **Adjust**: remove it from `exclude` or stop referencing it; rerun. |
| Phase 3 | `crate name is already taken` | **Stop**: ask the user for a new crate name; the binary name can stay via `[[bin]] name`. |
| Phase 3 | Clean install cannot find the version | **Retry**: the index may not have updated yet; rerun the install. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
