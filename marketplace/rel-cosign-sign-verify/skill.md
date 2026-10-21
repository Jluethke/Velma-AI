# Keyless Signing with cosign

**One-line description:** Signs release files (or one `SHA256SUMS` file that covers them) and container image digests with Sigstore cosign keyless signing from GitHub Actions OIDC, stores Sigstore bundles next to the release, and verifies every signature against the exact workflow identity and OIDC issuer rather than "any valid signature".

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_slug` (string, required): `OWNER/REPO` on GitHub.
- `py_dist` (object, optional): From rel-py-reproducible-build.
- `node_dist` (object, optional): From rel-node-reproducible-pack.
- `go_dist` (object, optional): From rel-go-reproducible-build (includes `SHA256SUMS`).
- `rust_dist` (object, optional): From rel-rust-reproducible-build.
- `image_digest` (object, optional): From rel-container-image-build-push.

---

## Outputs

- `signature_bundles` (object[]): Per signed subject: subject (file path or `repo@digest`), bundle file path or registry location, signer identity.
- `signature_verification` (object[]): Per subject: the verify command, exit code and output line.

---

## Phase 1: Decide What to Sign

### Entry Criteria
- At least one artifact input is present. Signing runs in GitHub Actions with `id-token: write`.

### Actions
1. Use this table:

   | Subjects | Sign |
   |---|---|
   | Many files (multi-platform binaries) | Write or reuse one `SHA256SUMS` covering all files and sign only that file; users verify the signature, then `sha256sum -c` |
   | A few files | Each file |
   | Container image | The image by digest: `<repository>@sha256:...`. Never by tag. |

2. Install cosign in the job: `uses: sigstore/cosign-installer@v3`. Record `cosign version`. Flags and default bundle formats have changed between cosign major versions; read `cosign sign-blob --help` for the installed version before writing commands.
3. Compute the expected signer identity now, because verification must match it exactly: for a workflow at `.github/workflows/release.yml` running on tag `v1.9.0`, the identity is `https://github.com/<repo_slug>/.github/workflows/release.yml@refs/tags/v1.9.0` and the issuer is `https://token.actions.githubusercontent.com`.

### Output
Subject list and expected identity.

### Quality Gate
- Every subject is a file with a recorded sha256 or a `repo@sha256:` reference.
- The expected identity string and issuer are written down before signing.

---

## Phase 2: Sign

### Entry Criteria
- Phase 1 done.

### Actions
1. Job permissions: `id-token: write`, plus `packages: write` for images in GHCR.
2. Files: `cosign sign-blob --yes --bundle <file>.sigstore.json <file>`. `--yes` skips the interactive transparency log consent prompt in CI. The bundle holds the signature, the short-lived Fulcio certificate and the Rekor transparency log entry.
3. Images: `cosign sign --yes <repository>@<digest>`. cosign stores the signature in the registry next to the image.
4. Upload bundles as release assets: `gh release upload <tag> *.sigstore.json --clobber` (only for bundles of this release).
5. Do NOT generate a long-lived key pair (`cosign generate-key-pair`) unless the user requires key-based signing for an air-gapped verifier; if they do, the private key goes in a secret store, never in the repository.

### Output
`signature_bundles`.

### Quality Gate
- One bundle file per signed file exists in the release (`gh release view <tag> --json assets --jq '.assets[].name'`).
- The signing job log shows a transparency log index for each signature (`tlog entry created with index:` or the equivalent line for your cosign version).

---

## Phase 3: Verify with Identity Pinning

### Entry Criteria
- Signatures exist.

### Actions
1. Files:
   `cosign verify-blob <file> --bundle <file>.sigstore.json --certificate-identity "https://github.com/<repo_slug>/.github/workflows/release.yml@refs/tags/<tag>" --certificate-oidc-issuer https://token.actions.githubusercontent.com`
   Success prints `Verified OK` and exits 0.
2. Images:
   `cosign verify <repository>@<digest> --certificate-identity "https://github.com/<repo_slug>/.github/workflows/release.yml@refs/tags/<tag>" --certificate-oidc-issuer https://token.actions.githubusercontent.com`
   Success prints JSON with the verified claims and exits 0.
3. Never verify with `--certificate-identity-regexp '.*'`. That accepts a signature from anyone with a GitHub Actions workflow. If a regexp is needed (for example several release tags), anchor it: `'^https://github.com/<repo_slug>/\.github/workflows/release\.yml@refs/tags/v'`.
4. Negative test: verify one subject with a wrong identity (for example `@refs/heads/main`); it must fail. This proves the check is not a no-op.
5. Publish the exact verify command in the release notes so users can run it.

### Output
`signature_verification`.

### Quality Gate
- Every subject has a verify exit code 0 with the exact identity.
- The negative test exits non-zero and its error output is recorded.

---

## Worked Example

Illustrative. `repo_slug` = `acme/tool`, tag `v2.1.0`, `go_dist` with four binaries and `SHA256SUMS`, plus `image_digest` `ghcr.io/acme/tool@sha256:a9e0...`.

- Phase 1: sign `SHA256SUMS` and the image digest. Identity `https://github.com/acme/tool/.github/workflows/release.yml@refs/tags/v2.1.0`.
- Phase 2: `cosign sign-blob --yes --bundle SHA256SUMS.sigstore.json SHA256SUMS`; `cosign sign --yes ghcr.io/acme/tool@sha256:a9e0...`.
- Phase 3: `cosign verify-blob SHA256SUMS --bundle SHA256SUMS.sigstore.json --certificate-identity https://github.com/acme/tool/.github/workflows/release.yml@refs/tags/v2.1.0 --certificate-oidc-issuer https://token.actions.githubusercontent.com` prints `Verified OK`. The same command with `@refs/heads/main` fails with `none of the expected identities matched what was in the certificate`.

---

## Exit Criteria

DONE when every subject is signed keylessly in CI, bundles are attached or stored, every signature verifies with the exact identity and issuer, and a wrong-identity verification fails.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `getting key from Fulcio: ... no token` | **Adjust**: the job lacks `id-token: write`. |
| Phase 2 | Signing an image by tag | **Stop**: resolve the digest (`docker buildx imagetools inspect`) and sign `repo@sha256:...`. |
| Phase 3 | Identity mismatch on a real release | **Adjust**: read the certificate identity from the bundle (`cosign verify-blob ... --certificate-identity-regexp '^https://github.com/<repo_slug>/'` once, read the printed identity), then fix the documented command. Never loosen the published command to `.*`. |
| Phase 3 | Flag not recognized | **Adjust**: check `cosign <cmd> --help` for the installed major version and use its spelling. |
| Any | Private repository and public Rekor log | **Return**: signing records the repository and workflow names in a public log; ask the user before signing private releases. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
