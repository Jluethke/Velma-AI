# crates.io Publish

**One-line description:** Publishes a Rust crate to crates.io after `cargo package --list` and `cargo publish --dry-run --locked` pass, authenticates with crates.io trusted publishing from GitHub Actions or a scoped token, publishes workspace crates in dependency order, and confirms the version and checksum on the registry.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the crate or workspace root.
- `package_name` (string, required): Crate to publish (for a workspace, the crate the user asked for; dependencies are handled in Phase 2).
- `next_version` (object, required): Uses `semver`.
- `rust_dist` (object, required): From rel-rust-reproducible-build; includes the `.crate` sha256.
- `provenance_verification` (object, required): From rel-slsa-provenance-attest; must have `verified` = true.

---

## Outputs

- `crates_release_url` (object): `https://crates.io/crates/<name>/<version>`, the registry checksum, publish order for workspace crates, and the docs.rs build URL.

---

## Phase 1: Preflight

### Entry Criteria
- `provenance_verification.verified` = true. Checked out at the release tag.

### Actions
1. Version in the manifest: `cargo metadata --no-deps --format-version 1 | jq -r '.packages[] | select(.name=="<package_name>") | .version'` equals `next_version.semver`.
2. Version unused: `cargo info <package_name>@<version>` (available in recent Cargo; otherwise `curl -s -A "<your contact>" https://crates.io/api/v1/crates/<package_name>/<version>` and look for an error). crates.io never allows re-publishing a version; yanking does not free it.
3. Package contents: `cargo package --list -p <package_name>`. Stop if it lists secrets, large test data, or files that `include`/`exclude` in `Cargo.toml` should drop. The crates.io upload size limit is documented by crates.io; check it if the package is large.
4. Every `path` dependency must also have a `version` (for example `acme-core = { path = "../core", version = "0.8.0" }`); `cargo publish` rejects path-only dependencies.

### Output
Preflight record.

### Quality Gate
- Manifest version equals `next_version.semver`.
- `cargo package --list` output is saved and contains no secret or credential file.

---

## Phase 2: Dry Run and Order

### Entry Criteria
- Preflight passed.

### Actions
1. `cargo publish --dry-run --locked -p <package_name>`. It packages and compiles the crate from the packaged sources, which catches files missing from the package.
2. Workspace: list unpublished internal dependencies of `<package_name>` with `cargo metadata --format-version 1 | jq -r '.packages[] | select(.source==null) | .name'` and order them so each crate is published after the crates it depends on. Recent Cargo versions can publish several workspace crates in one command; check `cargo publish --help` for `--workspace` or multiple `-p` support before relying on it.
3. Compare the packaged file with the reproducible build: `sha256sum target/package/<name>-<version>.crate` against `rust_dist`. A difference means the dry run packaged from a different tree.

### Output
Dry-run log and publish order.

### Quality Gate
- `cargo publish --dry-run` ends with `warning: aborting upload due to dry run` and exit code 0.
- The packaged `.crate` sha256 equals the `rust_dist` value.

---

## Phase 3: Publish and Confirm

### Entry Criteria
- Dry run passed.

### Actions
1. Authentication, first match wins:

   | Situation | Method |
   |---|---|
   | crates.io trusted publishing configured for this repo and workflow | job with `permissions: id-token: write` and `uses: rust-lang/crates-io-auth-action@v1` (id `auth`), then `cargo publish` with `CARGO_REGISTRY_TOKEN: ${{ steps.auth.outputs.token }}`. Check the action README for current input and output names. |
   | Otherwise | a crates.io API token scoped to `publish-update` for these crates only, stored as `CARGO_REGISTRY_TOKEN` |

2. Publish in the Phase 2 order: `cargo publish --locked -p <crate>` for each. Cargo waits for each crate to appear in the index before returning in recent versions; if yours does not, wait until `cargo info <crate>@<version>` resolves before publishing the next one.
3. Confirm: `curl -s -A "<your contact>" https://crates.io/api/v1/crates/<package_name>/<version> | jq -r '.version.checksum'` equals the sha256 of the `.crate` file.
4. docs.rs builds automatically; record `https://docs.rs/crate/<package_name>/<version>` and check its build status later.

### Output
`crates_release_url`.

### Quality Gate
- The registry checksum equals the `.crate` sha256 from Phase 2.
- `cargo info <package_name>@<version>` resolves.

---

## Worked Example

Illustrative. Workspace with `acme-core` and `acme-cli` (depends on core), both `0.8.0`, `package_name` = `acme-cli`.

- Phase 1: versions match; `cargo package --list -p acme-cli` shows `src/`, `Cargo.toml`, `README.md`, `LICENSE-MIT`.
- Phase 2: order `acme-core`, `acme-cli`. `cargo publish --dry-run --locked -p acme-core` prints `Packaging acme-core v0.8.0 ... Uploading acme-core v0.8.0 ... warning: aborting upload due to dry run`.
- Phase 3: trusted publishing; `cargo publish --locked -p acme-core` then `-p acme-cli`. `jq -r '.version.checksum'` prints `e71c...9a`, equal to `rust_dist`.

---

## Exit Criteria

DONE when every crate in the order is on crates.io at `next_version`, registry checksums equal the reproducible `.crate` hashes, and the docs.rs URL is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Version already on crates.io | **Stop**: versions are permanent; return to rel-semver-bump-decision. |
| Phase 2 | `all dependencies must have a version specified when publishing` | **Adjust**: add `version` to the path dependency in a release commit; retag only if the tag is not yet pushed anywhere. |
| Phase 2 | Dry run fails to compile from the package | **Adjust**: a needed file is excluded; fix `include`/`exclude`. |
| Phase 3 | `the remote server responded with an error: crate ... already uploaded` mid-workspace | **Adjust**: that crate was published; continue with the next one in order. |
| Phase 3 | Trusted publishing token exchange fails | **Return**: compare the repository, workflow file and environment configured on crates.io with the running job. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
