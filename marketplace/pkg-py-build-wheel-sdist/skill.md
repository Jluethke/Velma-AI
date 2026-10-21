# Python Wheel and sdist Build

**One-line description:** Builds a Python sdist and wheel with `python -m build` in an isolated environment from an empty `dist/` directory, then confirms the filenames, compatibility tags and embedded version match the release.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pyproject_config` (object, required): From `pkg-py-pyproject-metadata`.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `py_dist_files` (object): Absolute paths of the `.tar.gz` sdist and `.whl` wheel, the wheel tag triple, the version read from the built metadata, and the pasted build log tail.

---

## Phase 1: Prepare a Clean Build

### Entry Criteria
- `pyproject_config` validated.
- Tests pass on the commit being built: `python -m pytest -q` exits 0.

### Actions
1. Remove old artifacts so stale files are never uploaded: `rm -rf dist/ build/ *.egg-info src/*.egg-info` (PowerShell: `Remove-Item -Recurse -Force dist, build -ErrorAction SilentlyContinue`).
2. For a git-tag version source (hatch-vcs or setuptools-scm), the release tag must point at HEAD: `git describe --tags --exact-match` must print the tag. If it does not, the build produces a dev version like `1.0.1.dev3+g1a2b3c4`.
3. Commit everything first: `git status --porcelain` empty. With setuptools-scm, a dirty tree also produces a local version suffix.
4. Install the frontend: `python -m pip install --upgrade build`.

### Output
Empty `dist/`, clean tree.

### Quality Gate
- `ls dist 2>/dev/null | wc -l` prints `0`.
- `git status --porcelain` prints nothing.

---

## Phase 2: Build

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run `python -m build` from `project_dir`. With no flags it builds the sdist first, then builds the wheel from the unpacked sdist. That order catches files missing from the sdist: if the wheel build fails here but `python -m build --wheel` succeeds, the sdist is incomplete.
2. Do not pass `--no-isolation` unless offline builds are required; isolation installs exactly `[build-system] requires` into a temporary environment, which is what PyPI users will get.
3. Read the last lines: `Successfully built <name>-<ver>.tar.gz and <name>-<ver>-<tags>.whl`.

### Output
Two files in `dist/`.

### Quality Gate
- `python -m build` exit code is 0.
- `ls dist` shows exactly one `.tar.gz` and one `.whl`.

---

## Phase 3: Check Names, Tags and Version

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Read the wheel filename: `{name}-{version}-{python tag}-{abi tag}-{platform tag}.whl`. The name part uses underscores (normalized), for example `tiny_retry-1.0.0-py3-none-any.whl`.
2. Apply the tag table:

   | Package contains | Expected tag | If different |
   |---|---|---|
   | only `.py` files | `py3-none-any` | a `cp3xx` or platform tag means a compiled file or `setup.py` setting slipped in; find it |
   | C or Rust extensions | `cp3xx-cp3xx-<platform>` | one wheel per platform and Python is needed; use cibuildwheel in CI, not a local build |

3. Read the built metadata version: `unzip -p dist/*.whl '*.dist-info/METADATA' | grep -E '^(Name|Version|Metadata-Version|License-Expression):'` (PowerShell: `python -m zipfile -l dist\<file>.whl` to list, and `python -c "import zipfile,glob;z=zipfile.ZipFile(glob.glob('dist/*.whl')[0]);print([z.read(n).decode() for n in z.namelist() if n.endswith('METADATA')][0][:600])"`).
4. `Version:` must equal `release_version` exactly. A `.devN` or `+g<hash>` suffix means Phase 1 step 2 or 3 was skipped.
5. `License-Expression:` appears when the backend wrote PEP 639 metadata (Metadata-Version 2.4).

### Output
`py_dist_files`.

### Quality Gate
- `Version:` line equals `release_version`.
- The wheel tag matches the table row for the package contents.

---

## Worked Example

Illustrative. `tinyretry` 1.0.0, hatchling.

Phase 2:
```
$ python -m build
* Creating isolated environment: venv+pip...
* Installing packages in isolated environment: hatchling
* Building sdist...
* Building wheel from sdist
Successfully built tinyretry-1.0.0.tar.gz and tinyretry-1.0.0-py3-none-any.whl
```

Phase 3:
```
$ unzip -p dist/tinyretry-1.0.0-py3-none-any.whl '*.dist-info/METADATA' | grep -E '^(Name|Version|Metadata-Version|License-Expression):'
Metadata-Version: 2.4
Name: tinyretry
Version: 1.0.0
License-Expression: MIT
```
Tag `py3-none-any` matches a pure package.

---

## Exit Criteria

DONE when `dist/` holds exactly one sdist and one wheel of `release_version` with the expected tag, built in isolation from a clean committed tree.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tag not on HEAD with a VCS version source | **Stop**: create the tag on the release commit first, or switch to a static version. |
| Phase 2 | `ModuleNotFoundError` for a build plugin | **Adjust**: add the plugin to `[build-system] requires`, not to `dependencies`. |
| Phase 2 | Wheel-from-sdist build fails | **Adjust**: the sdist is missing files; include them (hatchling `[tool.hatch.build.targets.sdist] include`, setuptools `MANIFEST.in`) and rebuild. |
| Phase 3 | Version has `.dev` or `+local` suffix | **Retry**: fix the tag or dirty tree, clear `dist/`, rebuild; never upload a local version (PyPI rejects `+local`). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
