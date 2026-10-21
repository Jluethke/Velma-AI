# Python pyproject.toml Metadata

**One-line description:** Writes a valid PEP 621 `pyproject.toml` for hatchling or setuptools, with the `[build-system]` table, a single-sourced version, PEP 639 license fields, `requires-python`, URLs and package discovery, and validates it with `validate-pyproject`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `package_profile` (object, required): From `pkg-scope-intake`; build backend, layout, version source.
- `license_report` (object, required): From `pkg-license-metadata`; `registry_fields` for python.
- `release_version` (string, required): From `pkg-release-version-lock`.

---

## Outputs

- `pyproject_config` (object): The final `pyproject.toml` text, the backend chosen, where the version lives, and pasted validator output.

---

## Phase 1: Choose and Pin the Build Backend

### Entry Criteria
- `package_profile.stack == "python"`.

### Actions
1. Decide the backend:

   | Situation | Backend |
   |---|---|
   | `build_backend` already set and works | keep it |
   | `build_backend = "missing"` and pure Python | hatchling |
   | Package has C extensions in `setup.py` | setuptools |
   | Rust extension (`Cargo.toml` present) | maturin (not covered here; use maturin docs) |

2. Write the table exactly:
   - hatchling: `[build-system]` `requires = ["hatchling"]`, `build-backend = "hatchling.build"`.
   - setuptools: `requires = ["setuptools>=77"]`, `build-backend = "setuptools.build_meta"` (the lower bound is the release that added PEP 639 license expressions; confirm in the setuptools changelog).
3. Do not keep a `setup.py` that duplicates metadata in `[project]`; two sources drift. If `setup.py` exists only to call `setup()`, delete it once `[project]` is complete (setuptools reads `pyproject.toml`).

### Output
`[build-system]` table.

### Quality Gate
- `python -c "import tomllib; d=tomllib.load(open('pyproject.toml','rb')); print(d['build-system'])"` prints the table (Python 3.11 or later; earlier: `pip install tomli` and use `tomli`).

---

## Phase 2: Fill the [project] Table

### Entry Criteria
- Phase 1 done.

### Actions
1. Fill these keys (PEP 621 names, exact spelling):

   | Key | Value rule |
   |---|---|
   | `name` | the PyPI name |
   | `version` | `release_version`, or list `"version"` in `dynamic` (step 2) |
   | `description` | one sentence |
   | `readme` | `"README.md"` (content type inferred from the extension) |
   | `requires-python` | lowest Python the tests actually pass on, for example `">=3.9"`; ask the user if unknown; never add an upper bound like `<4` |
   | `license`, `license-files` | from `license_report.registry_fields` |
   | `authors` | `[{ name = "...", email = "..." }]` |
   | `classifiers` | `Programming Language :: Python :: 3.x` per tested version, `Typing :: Typed` when `py.typed` ships; no `License ::` classifier when `license` is an expression |
   | `dependencies` | runtime deps with lower bounds only (`"httpx>=0.27"`); add an upper cap only for a version known to break, with a comment naming it |
   | `[project.optional-dependencies]` | extras users install, not test tools |
   | `[project.urls]` | `Homepage`, `Source`, `Changelog`, `Issues` |

2. Single-source the version. Pick one:
   - static: `version = "<release_version>"` in `[project]`.
   - hatchling file: `dynamic = ["version"]` and `[tool.hatch.version] path = "src/<pkg>/__about__.py"` holding `__version__ = "<release_version>"`.
   - from git tag: hatchling with `requires = ["hatchling", "hatch-vcs"]` and `[tool.hatch.version] source = "vcs"`; setuptools with `requires = ["setuptools>=77", "setuptools-scm>=8"]` and an empty `[tool.setuptools_scm]` table. The tag must exist before building.
3. At runtime, read the version with `importlib.metadata.version("<name>")`, not a second hard-coded string.
4. Test tools (pytest, ruff) go in `[dependency-groups]` (PEP 735) or a dev extra, not in `dependencies`.

### Output
`[project]` table.

### Quality Gate
- `version` or `dynamic = ["version"]` appears once, never both.
- `grep -c "License ::" pyproject.toml` prints `0` when `license` is a string expression.

---

## Phase 3: Package Discovery and Validation

### Entry Criteria
- Phase 2 done.

### Actions
1. Discovery:
   - hatchling, src layout with `src/<name>/`: auto-detected. If the import name differs from the project name, add `[tool.hatch.build.targets.wheel] packages = ["src/<import_name>"]`.
   - setuptools, src layout: `[tool.setuptools.packages.find] where = ["src"]`.
   - flat layout with a `tests/` folder beside the package: setuptools may refuse auto-discovery with several top-level packages; list the package explicitly.
2. Validate: `python -m pip install "validate-pyproject[all]"` then `validate-pyproject pyproject.toml`. It prints `Valid file: pyproject.toml` on success.
3. Validate the backend actually reads it: `python -m pip install build` then `python -m build --sdist` (the next flow does the full build; this is a quick read check). Delete `dist/` after.

### Output
`pyproject_config`.

### Quality Gate
- `validate-pyproject pyproject.toml` prints `Valid file`.
- `python -m build --sdist` exits 0.

---

## Worked Example

Illustrative. `tinyretry`, hatchling, `release_version = 1.0.0`, `license_report.registry_fields = ['license = "MIT"', 'license-files = ["LICENSE"]']`.

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "tinyretry"
dynamic = ["version"]
description = "Retry functions with exponential backoff."
readme = "README.md"
requires-python = ">=3.9"
license = "MIT"
license-files = ["LICENSE"]
authors = [{ name = "Acme Dev", email = "dev@acme.example" }]
classifiers = ["Programming Language :: Python :: 3", "Typing :: Typed"]
dependencies = []

[project.urls]
Source = "https://github.com/acme/tinyretry"
Changelog = "https://github.com/acme/tinyretry/blob/main/CHANGELOG.md"

[tool.hatch.version]
path = "src/tinyretry/__about__.py"
```
`__about__.py` holds `__version__ = "1.0.0"`. `validate-pyproject pyproject.toml` prints `Valid file: pyproject.toml`.

---

## Exit Criteria

DONE when `pyproject.toml` validates, names one version source, carries the license fields from `license_report`, and a test sdist build succeeds.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | C extensions with hatchling requested | **Adjust**: keep setuptools; hatchling needs a build hook plugin for extensions. |
| Phase 2 | Tests have not run on the claimed lowest Python | **Return**: ask the user for the tested range; do not guess `requires-python`. |
| Phase 3 | validate-pyproject reports an unknown key | **Adjust**: fix the spelling it names (for example `requires_python` must be `requires-python`). |
| Phase 3 | Build error `Multiple top-level packages discovered` | **Adjust**: list packages explicitly as in Phase 3 step 1. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
