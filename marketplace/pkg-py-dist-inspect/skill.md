# Python Distribution Inspection

**One-line description:** Inspects a built wheel and sdist file by file with `unzip -l`, `tar -tzf`, `twine check --strict` and `check-wheel-contents`, and blocks the release on missing modules, stray top-level packages, test or secret files, or a README that PyPI cannot render.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_dist_files` (object, required): From `pkg-py-build-wheel-sdist`.
- `py_export_surface` (object, required): From `pkg-py-dunder-all-exports`; the modules and `py.typed` that must ship.

---

## Outputs

- `py_dist_report` (object): File lists of both artifacts, `twine check` and `check-wheel-contents` output, and a findings list with each finding's fix. Empty findings means pass.

---

## Phase 1: List Every File

### Entry Criteria
- Both files in `py_dist_files` exist.

### Actions
1. Wheel: `unzip -l dist/<file>.whl` (or `python -m zipfile -l dist/<file>.whl`).
2. sdist: `tar -tzf dist/<file>.tar.gz`.
3. Check the wheel against this table:

   | Must be present | Must be absent |
   |---|---|
   | every module in `py_export_surface` | top-level `tests/`, `test/`, `docs/`, `examples/` packages |
   | `<pkg>/py.typed` | `__pycache__/`, `*.pyc` |
   | `<name>-<ver>.dist-info/METADATA`, `WHEEL`, `RECORD` | `.env`, `*.pem`, `*.key`, `.git/`, editor folders |
   | the license file under `.dist-info/licenses/` (PEP 639) or `.dist-info/` | a second copy of the package under `src/` |

4. Check the sdist: it must contain `pyproject.toml`, `README`, the license file, the package source and the tests (downstream packagers run tests from the sdist). It must not contain `.env`, credentials, `dist/` or large data files.
5. Scan both lists for secrets by name: `unzip -l dist/*.whl | grep -iE '\.env|secret|\.pem|\.key|id_rsa'` and the same for `tar -tzf`. Any hit is a blocking finding.

### Output
File lists and table findings.

### Quality Gate
- Every row of the "must be present" column is checked with its matching line quoted.
- The secret-name grep output is pasted (empty means none).

---

## Phase 2: Run the Checkers

### Entry Criteria
- Phase 1 done.

### Actions
1. `python -m pip install twine check-wheel-contents`.
2. `python -m twine check --strict dist/*`. Each file must print `PASSED`. A `WARNING` about `long_description_content_type` or a rendering error fails under `--strict`; it means the PyPI page will show raw text or the upload will be rejected.
3. `check-wheel-contents dist/*.whl`. It prints `OK` or lines with codes such as `W002` (duplicate files), `W005` (common top-level name such as `tests`), `W009` (wheel has multiple top-level entries) and so on. Read the message on each line; look up any code you do not recognize in the project README rather than guessing what it means.
4. Copy every non-OK line into findings.

### Output
Checker output.

### Quality Gate
- `twine check --strict` prints `PASSED` for both files.
- `check-wheel-contents` prints `OK` or each warning is in findings.

---

## Phase 3: Decide and Record Fixes

### Entry Criteria
- Phases 1 and 2 done.

### Actions
1. For each finding, pick the fix:

   | Finding | Fix |
   |---|---|
   | tests packaged as top-level `tests` | hatchling: limit wheel to `packages = ["src/<pkg>"]`; setuptools: `[tool.setuptools.packages.find] exclude = ["tests*"]` |
   | `py.typed` missing (setuptools) | `[tool.setuptools.package-data] "<pkg>" = ["py.typed"]` |
   | file missing from sdist | hatchling `[tool.hatch.build.targets.sdist] include = [...]`; setuptools `MANIFEST.in` with `include` lines |
   | secret file present | remove it from the tree, add to `.gitignore` and exclude rules, rotate the secret |
   | README render failure | fix the Markdown or reStructuredText error twine names |

2. Do not fix here. Hand findings back to `pkg-py-pyproject-metadata` and rebuild with `pkg-py-build-wheel-sdist`, then rerun this flow on the new files.
3. Pass only with zero findings.

### Output
`py_dist_report`.

### Quality Gate
- Findings list is empty, or the report verdict is FAIL with each finding's fix.

---

## Worked Example

Illustrative. `tinyretry-1.0.0`.

Phase 1:
```
$ unzip -l dist/tinyretry-1.0.0-py3-none-any.whl
  tinyretry/__init__.py
  tinyretry/__about__.py
  tinyretry/_core.py
  tinyretry/_errors.py
  tinyretry/_utils.py
  tinyretry/utils.py
  tinyretry/py.typed
  tinyretry-1.0.0.dist-info/METADATA
  tinyretry-1.0.0.dist-info/WHEEL
  tinyretry-1.0.0.dist-info/licenses/LICENSE
  tinyretry-1.0.0.dist-info/RECORD
```
All required files present; no tests or secrets.

Phase 2:
```
$ python -m twine check --strict dist/*
Checking dist/tinyretry-1.0.0-py3-none-any.whl: PASSED
Checking dist/tinyretry-1.0.0.tar.gz: PASSED
$ check-wheel-contents dist/*.whl
dist/tinyretry-1.0.0-py3-none-any.whl: OK
```
Verdict PASS.

---

## Exit Criteria

DONE when both artifacts are listed file by file, both checkers pass, and findings are empty; otherwise FAIL with fixes routed back.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Secret file found | **Stop**: never upload; remove, rotate the secret, rebuild. |
| Phase 2 | twine check fails on README | **Return**: to `pkg-py-pyproject-metadata` with the error line. |
| Phase 3 | Any finding | **Return**: fix in config, rebuild, rerun this flow; never edit the wheel by hand. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
