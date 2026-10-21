# Rust Reproducible Release Build

**One-line description:** Builds Rust release binaries and the `.crate` package from the release tag twice, in two different directories, with a pinned `rust-toolchain.toml`, `--locked`, and `--remap-path-prefix` for the checkout and Cargo home paths, then compares SHA-256 values and names any cause of difference.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the crate or workspace root.
- `release_tag` (object, required): Tag name and commit SHA.

---

## Outputs

- `rust_dist` (object): Paths and SHA-256 of release binaries (per target) and the `.crate` file from build A, plus the toolchain used.
- `rust_repro_report` (object): Hashes of A and B, `identical` per file, `RUSTFLAGS` used, and causes for any difference.

---

## Phase 1: Pin Toolchain and Flags

### Entry Criteria
- `Cargo.lock` committed at the tag: `git show <tag>:Cargo.lock | head -3` prints lock content.

### Actions
1. If the tag has `rust-toolchain.toml`, rustup uses it automatically. If not, choose the exact version the release CI used (for example `1.83.0`), and run every command with `cargo +1.83.0`. Record `rustc -Vv`.
2. Build flags, identical in both builds:
   - `--release --locked`: `--locked` fails instead of silently updating `Cargo.lock`.
   - `CARGO_INCREMENTAL=0`.
   - `RUSTFLAGS="--remap-path-prefix=<checkout path>=. --remap-path-prefix=$CARGO_HOME=/cargo --remap-path-prefix=$HOME/.rustup=/rustup"`. The checkout path differs per build, so each build sets its own value. Panic messages and debug info otherwise contain absolute paths.
   - `SOURCE_DATE_EPOCH=$(git log -1 --format=%ct <tag>)` for build scripts that honor it.
3. Search build scripts for time and environment reads: `git grep -nE "SystemTime::now|Utc::now|Local::now|env!\(\"HOME|std::env::var\(\"USER" -- '*build.rs'`. Record each hit; it is a likely cause of non-reproducibility.

### Output
Toolchain and flag record.

### Quality Gate
- `rustc -Vv` output recorded, including `commit-hash`.
- The `git grep` result is recorded (empty or the hits).

---

## Phase 2: Build Twice

### Entry Criteria
- Phase 1 done.

### Actions
1. `git worktree add /tmp/rs-a <tag>` and `git worktree add /tmp/rs-b-elsewhere <tag>`.
2. In each, with its own `--remap-path-prefix=<that path>=.`: `cargo build --release --locked --target <triple>` for each target triple the project ships (list with `rustup target list --installed`). Use a separate `CARGO_TARGET_DIR` per build so artifacts do not mix.
3. Package the crate in each: `cargo package --locked --no-verify -p <crate>`; the file lands at `target/package/<crate>-<version>.crate`. (`--no-verify` skips the extra compile; verification is done in Phase 2 of rel-rust-publish-crates.)
4. Hash: `sha256sum <target dir>/<triple>/release/<bin> <target dir>/package/*.crate` for both.

### Output
Two artifact sets.

### Quality Gate
- Both builds exit 0 with `--locked` (no lockfile change).
- `git -C /tmp/rs-a status --porcelain` is empty after building (the build did not modify tracked files).

---

## Phase 3: Compare and Explain

### Entry Criteria
- Both artifact sets hashed.

### Actions
1. Compare hashes per file.
2. For differing binaries: `strings <a> | grep -E '/tmp/rs-|/home/|\.cargo/registry'` to find path leaks; `diffoscope <a> <b>` for a structural diff. Map:

   | Evidence | Cause | Fix in a later release |
   |---|---|---|
   | checkout or registry paths in `strings` output | missing remap for that path | add the `--remap-path-prefix` pair |
   | a timestamp string | `build.rs` reads the clock | read `SOURCE_DATE_EPOCH` instead |
   | different symbol order or code generation | different toolchain or codegen units | pin toolchain; set `codegen-units = 1` in `[profile.release]` if the project accepts the build-time cost |

3. For differing `.crate` files: unpack both (`tar -xzf`) and `diff -r`. Cargo normalizes `Cargo.toml` inside the package; a difference usually means an uncommitted file was included (check `cargo package --list`).
4. Fill `rust_dist` from build A.

### Output
`rust_dist`, `rust_repro_report`.

### Quality Gate
- Every file has `identical` set, and each false value has a cause backed by `strings`, `diffoscope` or `diff -r` output.
- `cargo package --list -p <crate>` output is saved with the report.

---

## Worked Example

Illustrative. Crate `acme-cli` at tag `v0.8.0`, toolchain `1.83.0`, target `x86_64-unknown-linux-gnu`.

- Phase 1: `rust-toolchain.toml` has `channel = "1.83.0"`. `git grep` finds no clock reads.
- Phase 2: build A in `/tmp/rs-a` with `--remap-path-prefix=/tmp/rs-a=.`, build B in `/tmp/rs-b-elsewhere` with its own prefix.
- Phase 3: first attempt binaries differ; `strings a | grep .cargo/registry` prints `/home/ci/.cargo/registry/src/index.crates.io-.../serde-1.0.215/src/de/mod.rs`. `CARGO_HOME` remap was missing in build B's shell. After adding it, both hashes are `e71c...9a`. The `.crate` files match on the first attempt.

---

## Exit Criteria

DONE when binaries and the `.crate` file were built twice from tag checkouts at different paths with recorded toolchain and flags, every hash pair is compared, and each difference has an evidenced cause.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `Cargo.lock` at the tag (library crate) | **Adjust**: binaries cannot be pinned; reproduce only the `.crate` file and record the gap. |
| Phase 2 | `--locked` fails: lock file needs updating | **Stop**: the tag is inconsistent; fix in a new release. |
| Phase 2 | Cross target needs a linker | **Adjust**: build that target on a native runner or with `cross`, recording the image digest it used. |
| Phase 3 | Differences remain after all remaps | **Return**: publish build A, record the open cause. |
| Any | Changing `RUSTFLAGS` between A and B other than the remap path | **Stop**: the comparison is invalid; rebuild both. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
