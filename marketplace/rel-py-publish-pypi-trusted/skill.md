# PyPI Publish with Trusted Publishing

**One-line description:** Configures a PyPI Trusted Publisher (OIDC, no API token) tied to one workflow file and one GitHub environment, publishes the already-built and provenance-verified distribution with `pypa/gh-action-pypi-publish` from a separate job that only downloads artifacts, rehearses on TestPyPI, and confirms the release and its PEP 740 attestations on PyPI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_dist` (object, required): From rel-py-reproducible-build; the exact files to upload.
- `package_name` (string, required): The distribution name on PyPI (as in `[project] name`).
- `next_version` (object, required): Uses `pep440`.
- `provenance_verification` (object, required): From rel-slsa-provenance-attest; must have `verified` = true.

---

## Outputs

- `pypi_release_url` (object): `https://pypi.org/project/<name>/<version>/`, the uploaded file names with sha256 as reported by the PyPI JSON API, and whether attestations are present.

---

## Phase 1: Preflight

### Entry Criteria
- `provenance_verification.verified` = true.

### Actions
1. Confirm the version is free on PyPI. PyPI never allows reusing a file name or version, even after deletion: `curl -s -o /dev/null -w '%{http_code}\n' https://pypi.org/pypi/<package_name>/<pep440>/json` must print `404`. A `200` means the version is taken; stop.
2. `twine check --strict <py_dist files>` must print `PASSED` for each file.
3. Confirm the file names carry the version: wheel `<name>-<pep440>-*.whl` and sdist `<name>-<pep440>.tar.gz` (normalized name, PEP 625 for sdists).

### Output
Preflight record.

### Quality Gate
- The `curl` status is `404`.
- `twine check --strict` output shows `PASSED` for every file.

---

## Phase 2: Configure Trusted Publishing

### Entry Criteria
- Preflight passed. The user has owner rights on the PyPI project (or will create it).

### Actions
1. On pypi.org: project, Settings, Publishing, add a GitHub publisher with owner, repository, workflow file name (for example `release.yml`) and environment name `pypi`. For a project that does not exist yet, add a "pending publisher" under your account's Publishing page. Do the same on test.pypi.org with environment `testpypi`.
2. In GitHub: Settings, Environments, create `pypi` and `testpypi`. On `pypi`, add required reviewers if the user wants a manual approval gate, and restrict deployment to tags matching `v*`.
3. Workflow publish job (separate from the build job; only this job gets `id-token: write`):
   ```yaml
   publish-pypi:
     needs: [build]
     runs-on: ubuntu-latest
     environment:
       name: pypi
       url: https://pypi.org/project/<package_name>/${{ github.ref_name }}
     permissions:
       id-token: write
     steps:
       - uses: actions/download-artifact@v4
         with: {name: python-dist, path: dist/}
       - uses: pypa/gh-action-pypi-publish@release/v1
   ```
   The action generates and uploads PEP 740 attestations by default in current releases (see its README `attestations` input). Do not add `password:` when trusted publishing is configured.
4. Never run `twine upload` from a laptop for a release; it bypasses the environment gate and attestations.

### Output
Publisher and workflow configured.

### Quality Gate
- `actionlint` reports no errors.
- The publish job is the only job with `id-token: write` (`grep -n "id-token" .github/workflows/release.yml`).

---

## Phase 3: Rehearse, Publish, Confirm

### Entry Criteria
- Workflow merged.

### Actions
1. TestPyPI rehearsal: a `publish-testpypi` job with `environment: testpypi` and `with: repository-url: https://test.pypi.org/legacy/`. Run it for a pre-release tag first.
2. Install from TestPyPI in a temp venv: `pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ "<package_name>==<pep440>"`. The extra index supplies dependencies that do not exist on TestPyPI.
3. Push the release tag; approve the `pypi` environment if reviewers are required.
4. Confirm: `curl -s https://pypi.org/pypi/<package_name>/<pep440>/json | jq -r '.urls[] | "\(.filename) \(.digests.sha256)"'`. Each sha256 must equal the hash in `py_dist`.
5. Confirm attestations through PyPI's Integrity API per its documentation (provenance endpoint for each file), or with the `pypi-attestations` tool (`pypi-attestations verify pypi --help` shows the exact syntax).

### Output
`pypi_release_url`.

### Quality Gate
- Every PyPI file sha256 equals the corresponding `py_dist` sha256.
- The provenance lookup returns an attestation for each file, or the absence is recorded with the action version used.

---

## Worked Example

Illustrative. `package_name` = `acme-parser`, `pep440` = `1.9.0`.

- Phase 1: `curl ... https://pypi.org/pypi/acme-parser/1.9.0/json` prints `404`; `twine check --strict dist/*` prints `PASSED` twice.
- Phase 2: publisher on PyPI: `acme/parser`, workflow `release.yml`, environment `pypi`.
- Phase 3: after the run, `jq` prints:
  ```
  acme_parser-1.9.0-py3-none-any.whl 9b1e...c4
  acme_parser-1.9.0.tar.gz 51aa...07
  ```
  Both equal `py_dist`. `pypi_release_url` = `https://pypi.org/project/acme-parser/1.9.0/`.

---

## Exit Criteria

DONE when the release is on PyPI through Trusted Publishing from a gated environment, every file hash on PyPI matches the reproducible build, and attestation presence is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Version already exists on PyPI (`200`) | **Stop**: PyPI versions are immutable; return to rel-semver-bump-decision for a new version. |
| Phase 3 | `invalid-publisher: valid token, but no corresponding publisher` | **Adjust**: the workflow file name, repository or environment name differs from the PyPI publisher; make them match exactly. |
| Phase 3 | `400 File already exists` | **Stop**: a partial upload happened; do not retry with a renamed file. Check which files exist and publish a new version. |
| Phase 3 | Hash on PyPI differs from `py_dist` | **Stop**: the job rebuilt instead of downloading artifacts; yank (rel-yank-bad-release) and fix the workflow. |
| Any | Tempted to use a long-lived API token | **Return**: ask the user; trusted publishing is the documented PyPA recommendation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
