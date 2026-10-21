# PyPI Trusted Publishing From GitHub Actions

**One-line description:** Publishes to PyPI from GitHub Actions using trusted publishing (OpenID Connect, no stored API token) with `pypa/gh-action-pypi-publish`, a protected deployment environment, and separate build and publish jobs so only the publish job can mint credentials.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `testpypi_record` (object, required): From `pkg-py-testpypi-upload`; proves the rehearsal passed.
- `package_name` (string, required): The PyPI project name.
- `repo_slug` (string, required): GitHub `owner/repo`.
- `release_tag` (string, required): From `pkg-release-version-lock`, for example `v1.0.0`.

---

## Outputs

- `py_publish_record` (object): Workflow file path, PyPI publisher settings used, the workflow run URL, uploaded filenames, and the attestation status.

---

## Phase 1: Register the Trusted Publisher on PyPI

### Entry Criteria
- `testpypi_record` shows install-back success.
- The user has owner or maintainer rights on the PyPI project, or the project does not exist yet.

### Actions
1. Existing project: PyPI project page, Manage, Publishing, add a GitHub publisher. New project: account Publishing page, add a "pending publisher" (it creates the project on first upload).
2. Enter exactly: owner and repository from `repo_slug`, workflow filename `release.yml` (filename only, not the path), environment name `pypi`.
3. In GitHub repo Settings, Environments, create `pypi`. Add required reviewers and limit deployment to tags matching `v*` if the user wants a manual approval gate.

### Output
Publisher registered.

### Quality Gate
- The PyPI Publishing page lists the publisher with the same owner, repo, workflow file and environment (screenshot or copied text in the report).

---

## Phase 2: Write the Workflow

### Entry Criteria
- Phase 1 done.

### Actions
1. Create `.github/workflows/release.yml` (the same filename as registered):
   ```yaml
   name: release
   on:
     push:
       tags: ["v*"]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-python@v5
           with: { python-version: "3.x" }
         - run: python -m pip install build twine
         - run: python -m build
         - run: python -m twine check --strict dist/*
         - uses: actions/upload-artifact@v4
           with: { name: dist, path: dist/ }
     publish:
       needs: build
       runs-on: ubuntu-latest
       environment: pypi
       permissions:
         id-token: write
       steps:
         - uses: actions/download-artifact@v4
           with: { name: dist, path: dist/ }
         - uses: pypa/gh-action-pypi-publish@release/v1
   ```
2. Rules for this file:
   - `id-token: write` only on the publish job. The build job runs project code (build hooks) and must not be able to mint a token.
   - No `password:` input and no `PYPI_API_TOKEN` secret; trusted publishing replaces them.
   - Never trigger publishing on `pull_request` or `pull_request_target`.
   - Pin third-party actions to a full commit SHA if the project's policy requires it; check each action's release page for the SHA.
3. The publish action generates and uploads PEP 740 attestations by default in current versions; confirm in the action README for the version you use.

### Output
Workflow file committed.

### Quality Gate
- `grep -n "id-token: write" .github/workflows/release.yml` prints one line, inside the publish job.
- `grep -nE "password:|PYPI_API_TOKEN" .github/workflows/release.yml` prints nothing.
- If `actionlint` is installed, `actionlint .github/workflows/release.yml` exits 0.

---

## Phase 3: Release and Read the Run

### Entry Criteria
- Workflow on the default branch; release commit merged.

### Actions
1. Create and push the tag on the release commit: `git tag -a <release_tag> -m "<release_tag>"` then `git push origin <release_tag>`.
2. Watch the run: `gh run watch` or `gh run list --workflow release.yml --limit 1`.
3. Read the publish job log: success shows the files uploaded and the PyPI URL. A `trusted publishing exchange failure` message lists the claims GitHub sent (repository, workflow_ref, environment); compare each with the publisher settings.
4. Confirm on PyPI: `curl -s https://pypi.org/pypi/<name>/<version>/json | python -c "import json,sys; print([u['filename'] for u in json.load(sys.stdin)['urls']])"`.

### Output
`py_publish_record`.

### Quality Gate
- `gh run view <id> --json conclusion` prints `"conclusion":"success"`.
- The PyPI JSON lists both the wheel and the sdist filenames.

---

## Worked Example

Illustrative. `tinyretry`, `repo_slug = acme/tinyretry`, tag `v1.0.0`.

Phase 1: pending publisher: owner `acme`, repo `tinyretry`, workflow `release.yml`, environment `pypi`.

Phase 3:
```
$ git tag -a v1.0.0 -m v1.0.0 && git push origin v1.0.0
$ gh run list --workflow release.yml --limit 1
completed  success  v1.0.0  release  push  12345678
$ curl -s https://pypi.org/pypi/tinyretry/1.0.0/json | python -c "..."
['tinyretry-1.0.0-py3-none-any.whl', 'tinyretry-1.0.0.tar.gz']
```

---

## Exit Criteria

DONE when the publisher is registered, the workflow mints credentials only in the publish job, the tag-triggered run succeeds, and PyPI lists both files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User lacks rights on the PyPI project | **Stop**: an owner must add the publisher. |
| Phase 3 | `invalid-publisher` exchange error | **Adjust**: fix the mismatched claim (often the workflow filename or environment name) on PyPI, then re-run the failed job. |
| Phase 3 | Upload fails `File already exists` | **Stop**: the version is already on PyPI; bump the version through `pkg-release-version-lock`. |
| Phase 3 | Published release has a defect | **Return**: publish a fixed patch version; yank the bad one on PyPI only if installing it causes harm. Files cannot be replaced. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
