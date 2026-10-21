# Cargo Publish With Dry Run

**One-line description:** Publishes a crate by running `cargo publish --dry-run` first to build the packaged crate in isolation, then a real publish through crates.io trusted publishing or a scoped token, and confirms the crates.io record and the docs.rs build.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cargo_manifest_report` (object, required): From `pkg-rust-cargo-manifest`; verdict PASS.
- `project_dir` (string, required): Crate root.

---

## Outputs

- `crate_publish_record` (object): Dry-run output, auth method, publish output, crates.io version record, and docs.rs build status.

---

## Phase 1: Dry Run

### Entry Criteria
- `cargo_manifest_report` verdict PASS.
- `git status --porcelain` empty.

### Actions
1. Run `cargo publish --dry-run`. It packages the crate, unpacks it into `target/package/<name>-<version>/`, and builds it there with only the packaged files. A build failure here means a file the build needs is not packaged.
2. Do not add `--allow-dirty`. Uncommitted files would be packaged without being in git, and the published source would not match any commit.
3. For a workspace, publish members in dependency order, one `cargo publish -p <crate> --dry-run` at a time. Recent Cargo can publish several workspace members in one command; check `cargo publish --help` for `--workspace` before relying on it.
4. Read the end of the output: `Uploading <name> v<version>` followed by `warning: aborting upload due to dry run`.

### Output
Dry-run log.

### Quality Gate
- Output contains `aborting upload due to dry run` and the command exits 0.

---

## Phase 2: Authenticate and Publish

### Entry Criteria
- Dry run passed.

### Actions
1. Choose auth:

   | Situation | Method |
   |---|---|
   | Crate already exists and the owner configured trusted publishing on crates.io (crate Settings, Trusted Publishing, GitHub repo and workflow file) | GitHub Actions job with `permissions: id-token: write`, step `uses: rust-lang/crates-io-auth-action@v1` with `id: auth`, then `cargo publish` with `env: CARGO_REGISTRY_TOKEN: ${{ steps.auth.outputs.token }}` |
   | First publish, or local publish | API token from `https://crates.io/settings/tokens` with the `publish-new` (first time) or `publish-update` scope, limited to this crate name; `cargo login` reads it from stdin, or set `CARGO_REGISTRY_TOKEN` for one command |

2. Publish: `cargo publish` (add `-p <crate>` in a workspace).
3. Every published version is permanent. It can be yanked (`cargo yank --version <v>`) to stop new lockfiles from selecting it, but never deleted or overwritten.
4. Tag the commit: `git tag -a v<version> -m v<version> && git push origin v<version>`.

### Output
Published crate.

### Quality Gate
- `cargo publish` output ends with `Published <name> v<version>` (or `Uploaded` followed by the index wait message), exit 0.

---

## Phase 3: Confirm crates.io and docs.rs

### Entry Criteria
- Publish succeeded.

### Actions
1. `cargo info <name>@<version>` (Cargo 1.82 or later) shows the version, license and features. Older Cargo: `curl -s -H "User-Agent: release-check" https://crates.io/api/v1/crates/<name>/<version>` returns JSON with `version.num`.
2. Clean consumer: `cargo new /tmp/crateconsumer && cd /tmp/crateconsumer && cargo add <name>@<version> && cargo build`. Call one README example in `main.rs` and run it.
3. docs.rs builds automatically after publish. Check `https://docs.rs/crate/<name>/<version>/builds`. A failed build often needs `[package.metadata.docs.rs]` settings such as `all-features = true` or a feature that avoids native libraries; fix in the next patch.

### Output
`crate_publish_record`.

### Quality Gate
- `cargo info` or the API JSON shows `release_version`.
- The consumer `cargo build` exits 0.
- docs.rs build status is recorded (success, or failure with its log excerpt).

---

## Worked Example

Illustrative. `fastcsv` 0.4.0, token auth.

Phase 1:
```
$ cargo publish --dry-run
   Packaging fastcsv v0.4.0 (/work/fastcsv)
   Verifying fastcsv v0.4.0 (/work/fastcsv)
   Compiling fastcsv v0.4.0 (/work/fastcsv/target/package/fastcsv-0.4.0)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.21s
   Uploading fastcsv v0.4.0 (/work/fastcsv)
warning: aborting upload due to dry run
```
Phase 2: `cargo publish` ends with `Published fastcsv v0.4.0 at registry crates-io`.
Phase 3: `cargo info fastcsv@0.4.0` shows `version: 0.4.0`, `license: MIT OR Apache-2.0`; consumer builds; docs.rs build succeeded.

---

## Exit Criteria

DONE when the dry run passed from a clean tree, the real publish succeeded, a clean consumer builds the version, and the docs.rs result is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Build fails inside `target/package` | **Return**: to `pkg-rust-cargo-manifest`; a needed file is excluded. |
| Phase 1 | `files in the working directory contain changes` | **Adjust**: commit or remove the changes; never use `--allow-dirty` for a release. |
| Phase 2 | `crate version is already uploaded` | **Stop**: bump through `pkg-release-version-lock`. |
| Phase 2 | `403` token scope error | **Adjust**: create a token with the right scope for this crate. |
| Phase 3 | Released version is broken | **Return**: publish a fixed patch, then `cargo yank --version <bad>`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
