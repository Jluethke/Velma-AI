# TestPyPI Upload Rehearsal

**One-line description:** Rehearses a Python release by uploading the inspected artifacts to TestPyPI with twine and a project-scoped token, then installing that version back from the TestPyPI index into a fresh environment.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_dist_report` (object, required): From `pkg-py-dist-inspect`; must have verdict PASS.
- `py_install_report` (object, required): From `pkg-py-clean-venv-install`; must show wheel and sdist PASS.
- `package_name` (string, required): The project name.

---

## Outputs

- `testpypi_record` (object): TestPyPI project URL, uploaded filenames, twine output, and the install-back result (`__file__` path, version, smoke result).

---

## Phase 1: Prepare Credentials

### Entry Criteria
- `py_dist_report` verdict PASS and `py_install_report` both PASS.

### Actions
1. TestPyPI is a separate site with separate accounts: `https://test.pypi.org`. Register there if needed.
2. Create an API token at `https://test.pypi.org/manage/account/token/`. For a first upload the token must be account-scoped; after the project exists, replace it with a token scoped to that project.
3. Provide it to twine through environment variables for this shell only, never in a committed file:
   ```
   export TWINE_USERNAME=__token__
   export TWINE_PASSWORD=<pypi-... token>
   ```
   PowerShell: `$env:TWINE_USERNAME="__token__"; $env:TWINE_PASSWORD="<token>"`. The username is the literal string `__token__`.
4. Alternative: CI with trusted publishing to TestPyPI (the publish action with `repository-url: https://test.pypi.org/legacy/`), configured as in `pkg-py-trusted-publishing`.

### Output
Credentials set for this shell.

### Quality Gate
- `git status --porcelain` shows no file containing the token, and `git grep -n "pypi-" -- . ':!*.lock'` prints nothing.

---

## Phase 2: Upload

### Entry Criteria
- Phase 1 done; `dist/` holds exactly the two inspected files.

### Actions
1. Upload: `python -m twine upload --repository testpypi dist/*`. The `testpypi` repository name is built into twine; with a `~/.pypirc`, it reads `[testpypi] repository = https://test.pypi.org/legacy/`. Alternatively pass `--repository-url https://test.pypi.org/legacy/`.
2. Read the output: each file shows a progress bar and the run ends with `View at: https://test.pypi.org/project/<name>/<version>/`.
3. A `400 File already exists` error means this version was uploaded before. PyPI and TestPyPI never accept the same filename twice, even after deletion. Do not retry with the same files.

### Output
Uploaded files and URL.

### Quality Gate
- twine prints `View at:` with the version URL.
- `curl -s -o /dev/null -w "%{http_code}" https://test.pypi.org/pypi/<name>/<version>/json` prints `200`.

---

## Phase 3: Install Back From TestPyPI

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Fresh venv outside the repo: `python -m venv /tmp/testpypi-env && cd /tmp`.
2. Install the exact version, pulling dependencies from real PyPI:
   ```
   /tmp/testpypi-env/bin/python -m pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ "<name>==<version>"
   ```
   Pin the version with `==`. Without the pin, pip may pick a different or malicious package of the same name from either index; TestPyPI names are not reserved.
3. If the install picks up a cached file, add `--no-cache-dir`.
4. Run the smoke checks from `pkg-py-clean-venv-install` Phase 2 steps 1 and 2 against this venv.

### Output
`testpypi_record`.

### Quality Gate
- `pip show <name>` in the venv prints `Version: <version>`.
- `__all__` smoke check prints `missing []`.

---

## Worked Example

Illustrative. `tinyretry` 1.0.0.

Phase 2:
```
$ python -m twine upload --repository testpypi dist/*
Uploading distributions to https://test.pypi.org/legacy/
Uploading tinyretry-1.0.0-py3-none-any.whl
Uploading tinyretry-1.0.0.tar.gz
View at:
https://test.pypi.org/project/tinyretry/1.0.0/
```

Phase 3:
```
$ /tmp/testpypi-env/bin/python -m pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ "tinyretry==1.0.0"
Successfully installed tinyretry-1.0.0
missing []
```

---

## Exit Criteria

DONE when the version is on TestPyPI, installs back by exact pin into a fresh environment, and passes the smoke checks, with no token committed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `403 Invalid or non-existent authentication` | **Adjust**: username must be `__token__`; the token must be from test.pypi.org, not pypi.org. |
| Phase 2 | `400 File already exists` | **Adjust**: TestPyPI keeps this version forever; for rehearsal only, bump to a pre-release such as `1.0.0rc1`, rebuild and upload; never reuse files. |
| Phase 2 | Name taken on TestPyPI by someone else | **Adjust**: rehearse with trusted publishing configured for the real index only, and record that the TestPyPI step was skipped. |
| Phase 3 | Dependency not found | **Adjust**: it must come from `--extra-index-url https://pypi.org/simple/`; check the flag is present. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
