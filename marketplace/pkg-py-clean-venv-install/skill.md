# Python Clean venv Install Test

**One-line description:** Installs the built wheel and sdist into fresh virtual environments outside the source tree and proves that the installed copy, not the checkout, imports, exposes every `__all__` name, passes `pip check` and passes the test suite.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_dist_files` (object, required): From `pkg-py-build-wheel-sdist`.
- `py_export_surface` (object, required): From `pkg-py-dunder-all-exports`.

---

## Outputs

- `py_install_report` (object): For the wheel and the sdist: Python version used, the `__file__` path of the imported package, `pip check` output, the `__all__` smoke result, and the pytest summary line.

---

## Phase 1: Install the Wheel in a Fresh venv

### Entry Criteria
- `py_dist_files` paths exist.

### Actions
1. Create a venv in a temp directory outside the repo, using the lowest Python in `requires-python` if it is installed (`py -3.9` on Windows, `python3.9` elsewhere):
   ```
   python3.9 -m venv /tmp/pkgtest-whl
   /tmp/pkgtest-whl/bin/python -m pip install --upgrade pip
   ```
   Windows: `py -3.9 -m venv $env:TEMP\pkgtest-whl` and use `$env:TEMP\pkgtest-whl\Scripts\python.exe`.
2. Install the wheel file by path, never with `-e` and never `pip install .`: `/tmp/pkgtest-whl/bin/python -m pip install /abs/path/dist/<file>.whl`.
3. Change directory away from the repo before importing: `cd /tmp`. Running from the repo root puts the source folder on `sys.path` (for flat layouts) and hides packaging bugs.
4. Prove the import location: `/tmp/pkgtest-whl/bin/python -c "import <pkg>; print(<pkg>.__file__)"`. The path must contain `site-packages`. A path inside the repo means the test is invalid.
5. Run `/tmp/pkgtest-whl/bin/python -m pip check`. It must print `No broken requirements found.`

### Output
Wheel install verified.

### Quality Gate
- `__file__` path contains `site-packages`.
- `pip check` prints `No broken requirements found.`

---

## Phase 2: Smoke-Test the Public Surface and Run Tests

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Check every exported name: `python -c "import <pkg> as m; bad=[n for n in m.__all__ if not hasattr(m,n)]; print('missing', bad)"` prints `missing []`. Repeat for every public submodule in `py_export_surface`.
2. Check the version metadata: `python -c "import importlib.metadata as md; print(md.version('<name>'))"` prints `release_version`.
3. Run the test suite against the installed copy. Copy the tests out so the source tree is not importable: `cp -r <project_dir>/tests /tmp/pkgtests`, install test dependencies into the venv (`pip install pytest` plus any listed in the dev group), then `cd /tmp && /tmp/pkgtest-whl/bin/python -m pytest /tmp/pkgtests -q -p no:cacheprovider`.
4. If tests import from the source path (for example `from src.<pkg> import`), that is a test bug; report it, do not edit the package to accommodate it.
5. Never skip, delete or mark tests `xfail` to get a pass here.

### Output
Smoke and test results.

### Quality Gate
- `missing []` printed for every public module.
- pytest summary line shows `passed` and no `failed` or `error`.

---

## Phase 3: Repeat From the sdist

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. New venv: `python3.9 -m venv /tmp/pkgtest-sdist`.
2. Install from the sdist file, which forces a local build from source: `/tmp/pkgtest-sdist/bin/python -m pip install /abs/path/dist/<file>.tar.gz`.
3. Repeat Phase 1 steps 3 to 5 and Phase 2 steps 1 to 3 with this venv.
4. Optional, when `uv` is installed: `uv pip install --python /tmp/pkgtest-sdist/bin/python --resolution lowest-direct <file>.whl` installs the lowest allowed versions of direct dependencies, which tests the declared lower bounds. Run the tests again.
5. Delete both venvs after recording results.

### Output
`py_install_report`.

### Quality Gate
- sdist install exits 0 and the same smoke and pytest gates pass.

---

## Worked Example

Illustrative. `tinyretry-1.0.0`, `requires-python = ">=3.9"`.

Phase 1:
```
$ cd /tmp && /tmp/pkgtest-whl/bin/python -c "import tinyretry; print(tinyretry.__file__)"
/tmp/pkgtest-whl/lib/python3.9/site-packages/tinyretry/__init__.py
$ /tmp/pkgtest-whl/bin/python -m pip check
No broken requirements found.
```

Phase 2:
```
missing []
1.0.0
42 passed in 0.88s
```

Phase 3: sdist install builds the wheel locally with hatchling; same results. Report: wheel PASS, sdist PASS on Python 3.9.19.

---

## Exit Criteria

DONE when both the wheel and the sdist install into fresh venvs, import from `site-packages`, expose every `__all__` name, pass `pip check`, report `release_version`, and pass the test suite.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `__file__` points into the repo | **Retry**: change to a directory outside the repo and rerun; never accept this result. |
| Phase 1 | Lowest supported Python not installed | **Adjust**: use the lowest installed version and record the untested lower bound as an open item. |
| Phase 2 | `ModuleNotFoundError` for a private module | **Return**: to `pkg-py-dist-inspect`; the wheel is missing a file. |
| Phase 3 | sdist build fails while wheel installs | **Return**: to `pkg-py-build-wheel-sdist`; files are missing from the sdist. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
