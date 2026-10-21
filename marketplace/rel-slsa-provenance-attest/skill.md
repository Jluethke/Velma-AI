# SLSA Build Provenance Attestation

**One-line description:** Picks the provenance generator from the required SLSA Build level (GitHub `actions/attest-build-provenance` or the `slsa-github-generator` reusable workflows), wires it to the exact release artifacts or image digest, and verifies the result with `gh attestation verify` or `slsa-verifier` pinned to the source repository and tag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_slug` (string, required): `OWNER/REPO` on GitHub.
- `slsa_build_level` (string, optional): `L2` or `L3` (SLSA v1.0 Build track). Default `L2` unless the user or a customer contract states L3.
- `py_dist` (object, optional): From rel-py-reproducible-build.
- `node_dist` (object, optional): From rel-node-reproducible-pack.
- `go_dist` (object, optional): From rel-go-reproducible-build.
- `rust_dist` (object, optional): From rel-rust-reproducible-build.
- `image_digest` (object, optional): From rel-container-image-build-push.

---

## Outputs

- `provenance_attestation` (object): Generator used, workflow file, subjects (name and sha256), and where the attestation is stored (GitHub attestations API, release asset `.intoto.jsonl`, or registry).
- `provenance_verification` (object): The verify command per subject, its output, and `verified` (bool). Downstream publish steps require `verified` = true.

---

## Phase 1: Choose the Generator

### Entry Criteria
- At least one of the artifact inputs is present. The build runs in GitHub Actions (provenance generated on a laptop is not SLSA Build L2 or higher).

### Actions
1. Collect subjects: every file path in the provided dist objects (for Go use the files listed in `SHA256SUMS`), and `image_digest.repository@image_digest.digest` for an image.
2. Choose with this table:

   | `slsa_build_level` | Subject | Generator |
   |---|---|---|
   | L2 | files | `actions/attest-build-provenance@v2` with `subject-path` |
   | L2 | image | `actions/attest-build-provenance@v2` with `subject-name`, `subject-digest`, `push-to-registry: true` |
   | L3 | files | `slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml` |
   | L3 | image | `slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml` |

   GitHub documents that artifact attestations reach Build L3 when the build runs in a reusable workflow that isolates it; if the user wants L3 with `attest-build-provenance`, the build job must move into a reusable workflow, and you must cite that GitHub documentation page in the output.
3. Registry-native attestations are separate and complementary: PyPI Trusted Publishing produces PEP 740 attestations and `npm publish --provenance` produces npm provenance. They do not replace this step for GitHub release assets and images.

### Output
Generator choice and subject list.

### Quality Gate
- Every subject has a sha256 recorded from the dist inputs.
- The chosen row is recorded.

---

## Phase 2: Wire the Workflow

### Entry Criteria
- Generator chosen.

### Actions
1. `attest-build-provenance` (in the build job, after the build step):
   ```yaml
   permissions:
     contents: read
     id-token: write
     attestations: write
   steps:
     - uses: actions/attest-build-provenance@v2
       with:
         subject-path: 'dist/*'
   ```
   For an image add `packages: write` and use `subject-name: ghcr.io/acme/parser`, `subject-digest: ${{ steps.build.outputs.digest }}`, `push-to-registry: true`.
2. `generator_generic_slsa3.yml`: the build job outputs base64 of the checksum lines, `echo "hashes=$(sha256sum dist/* | base64 -w0)" >> "$GITHUB_OUTPUT"`, and a separate job calls:
   ```yaml
   provenance:
     needs: [build]
     permissions:
       actions: read
       id-token: write
       contents: write
     uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.1.0
     with:
       base64-subjects: "${{ needs.build.outputs.hashes }}"
       upload-assets: true
   ```
   Reference the generator by a version tag such as `@v2.1.0` (check the newest on its releases page). The project documents that it must be referenced by tag, not by commit SHA, because slsa-verifier checks the builder identity by tag. This is the one place where pinning to a SHA is wrong.
3. Use the same files that were hashed by the reproducible build flow. Do not rebuild in the provenance job.

### Output
Workflow changes merged; a release run completed.

### Quality Gate
- `actionlint` reports no errors on the changed workflow.
- The release run (`gh run view <id>`) shows the attestation or provenance job as successful.

---

## Phase 3: Verify

### Entry Criteria
- A release run has produced provenance.

### Actions
1. `attest-build-provenance` subjects: `gh attestation verify <file> --repo <repo_slug>`; for images `gh attestation verify oci://<repository>@<digest> --repo <repo_slug>`. Tighten with `--signer-workflow <repo_slug>/.github/workflows/release.yml` when the flag is listed in `gh attestation verify --help`.
2. `slsa-github-generator` subjects: download `<name>.intoto.jsonl` from the release, then `slsa-verifier verify-artifact <file> --provenance-path <name>.intoto.jsonl --source-uri github.com/<repo_slug> --source-tag <tag>`. For images: `slsa-verifier verify-image <repository>@<digest> --source-uri github.com/<repo_slug> --source-tag <tag>`.
3. Read the result: `gh attestation verify` ends with a success line and exits 0; slsa-verifier prints `PASSED: SLSA verification passed` (wording may vary by version; rely on exit code 0).
4. Verify EVERY subject, not one sample. Set `verified` = true only if all exit 0.

### Output
`provenance_attestation`, `provenance_verification`.

### Quality Gate
- One verify command and exit code per subject is recorded.
- `provenance_verification.verified` is true only when every exit code is 0.

---

## Worked Example

Illustrative. `repo_slug` = `acme/parser`, L2, `py_dist` with `acme-1.9.0-py3-none-any.whl` and `acme-1.9.0.tar.gz`.

- Phase 1: row "L2, files": `attest-build-provenance`.
- Phase 2: build job gains `attestations: write` and `id-token: write`; `subject-path: 'dist/*'`.
- Phase 3: `gh attestation verify dist/acme-1.9.0-py3-none-any.whl --repo acme/parser` prints:
  ```
  Loaded digest sha256:9b1e...c4 for file://dist/acme-1.9.0-py3-none-any.whl
  Loaded 1 attestation from GitHub API
  ✓ Verification succeeded!
  ```
  Same for the sdist. `verified` = true.

---

## Exit Criteria

DONE when provenance exists for every release subject from the chosen generator and every subject verifies against the source repository (and tag, for slsa-verifier), with `provenance_verification.verified` = true.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Build does not run in GitHub Actions | **Adjust**: GitLab can emit SLSA provenance with the `RUNNER_GENERATE_ARTIFACTS_METADATA` CI variable; follow GitLab's artifact provenance docs. Otherwise **Stop**. |
| Phase 2 | `Resource not accessible by integration` | **Adjust**: add the missing permission (`id-token: write`, `attestations: write`) to that job. |
| Phase 2 | slsa-verifier rejects builder referenced by SHA | **Adjust**: reference the generator by its release tag. |
| Phase 3 | Digest mismatch | **Stop**: the file you verified is not the file that was attested; never publish it. |
| Phase 3 | Private repo on a plan without attestations | **Return**: report the plan limit; fall back to slsa-github-generator. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
