# Package Scope Intake

**One-line description:** Detects a library's stack, build tool, current version, repository layout and registry name availability from files and commands, so every later packaging step works from verified facts instead of guesses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Absolute path to the library's repository root (the directory holding `pyproject.toml`, `package.json`, `go.mod` or `Cargo.toml`).
- `stack` (string, required): The stack the user says this library is: one of `python`, `node`, `go`, `rust`. Phase 1 confirms it against the files on disk.
- `package_name` (string, required): The name the library will have on its registry (PyPI project name, npm name including any `@scope/`, Go module path, or crate name).

---

## Outputs

- `package_profile` (object): `stack`, `manifest_file`, `build_backend` or build tool, `current_version`, `version_source` (static field, git tag, or dynamic plugin), `layout` (for Python: `src` or flat), `workspace` (true/false plus member list), `registry_name_status` (`free`, `owned_by_user`, `taken_by_other`), `normalized_name`, and `tool_versions` (exact output of each `--version` command run).

---

## Phase 1: Confirm the Stack From Files

### Entry Criteria
- `project_dir` exists and is a git work tree (`git -C <project_dir> rev-parse --is-inside-work-tree` prints `true`).

### Actions
1. List the root files: `ls -a <project_dir>` (PowerShell: `Get-ChildItem -Force <project_dir>`).
2. Map files to stack with this table. Use the first row that matches:

   | File present at root | Stack |
   |---|---|
   | `Cargo.toml` | rust |
   | `go.mod` | go |
   | `package.json` without `"private": true` | node |
   | `pyproject.toml`, `setup.py` or `setup.cfg` | python |

3. If the table result differs from `stack`, stop and report both values. Do not pick one yourself.
4. If more than one manifest exists (for example a Rust crate with Python bindings has both `Cargo.toml` and `pyproject.toml` with `build-backend = "maturin"`), record every manifest and keep the user's `stack` as primary.
5. Record tool versions by running only the tools for the confirmed stack:
   - python: `python --version`, `python -m pip --version`
   - node: `node --version`, `npm --version`
   - go: `go version`
   - rust: `cargo --version`, `rustc --version`

### Output
Confirmed stack, manifest list and `tool_versions`.

### Quality Gate
- The manifest file named for the stack exists (`test -f <project_dir>/<manifest>` exits 0).
- Every tool version line in `tool_versions` is pasted from real command output.

---

## Phase 2: Read Build Tool, Version and Layout

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. python: read `[build-system] build-backend` in `pyproject.toml`. Known values: `hatchling.build`, `setuptools.build_meta`, `flit_core.buildapi`, `pdm.backend`, `poetry.core.masonry.api`, `maturin`. If there is no `[build-system]` table, record `build_backend = "missing"` (pip then falls back to legacy setuptools, which later flows must fix).
2. python version: if `[project] version` exists, record it with `version_source = "static"`. If `[project] dynamic` contains `"version"`, read `[tool.hatch.version]` or `[tool.setuptools.dynamic] version` or `[tool.setuptools_scm]` and record that source.
3. python layout: `src` if `<project_dir>/src/<import_name>/__init__.py` exists, otherwise `flat`.
4. node: run `npm pkg get name version type main exports private workspaces` in `project_dir` and record the JSON.
5. go: run `go list -m` for the module path and `git describe --tags --abbrev=0` for the latest tag (no tag means `current_version = "none"`). Check for `go.work`.
6. rust: run `cargo metadata --no-deps --format-version 1` and read `packages[].name`, `packages[].version`, and `workspace_members`.
7. Record `workspace = true` if any of these exist: Cargo `[workspace]`, npm `"workspaces"`, `go.work`, or a Python monorepo with several `pyproject.toml` files. A workspace release publishes one member at a time; name the member that matches `package_name`.

### Output
Build tool, version, version source, layout and workspace fields of `package_profile`.

### Quality Gate
- `current_version` is a literal value copied from a file or command, or the string `none` for a first release.
- `build_backend` (python) or build tool (node, go, rust) is filled.

---

## Phase 3: Check the Registry Name

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Normalize the name:
   - python: PEP 503 normalization: lowercase, and replace each run of `-`, `_`, `.` with one `-`. `My_Lib.Core` becomes `my-lib-core`.
   - node: npm names are lowercase and may carry a scope: `@scope/name`.
   - rust: crates.io treats `-` and `_` as the same name.
   - go: the module path is the name; it must start with the repository host path, for example `github.com/acme/widget`.
2. Query the registry:

   | Stack | Command | Name is free when |
   |---|---|---|
   | python | `curl -s -o /dev/null -w "%{http_code}" https://pypi.org/pypi/<normalized>/json` | prints `404` |
   | node | `npm view <name> name` | exits non-zero with `E404` |
   | rust | `curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: pkg-intake" https://crates.io/api/v1/crates/<name>` | prints `404` |
   | go | no registry; check that `go list -m` equals `package_name` | values match |

3. If the name exists, check ownership: python `https://pypi.org/pypi/<name>/json` field `info.project_urls` points at this repo; node `npm owner ls <name>` lists the user; rust the crate's `repository` field points at this repo. Matching ownership means `owned_by_user`; otherwise `taken_by_other`.

### Output
Complete `package_profile`.

### Quality Gate
- `registry_name_status` is backed by the HTTP code or command exit shown in the report.
- If `taken_by_other`, the report says so and the chain stops.

---

## Worked Example

Illustrative. `project_dir = /work/tinyretry`, `stack = python`, `package_name = TinyRetry`.

Phase 1: root has `pyproject.toml`, `src/`, `tests/`. Table row 4 gives `python`, matching the input. `python --version` prints `Python 3.12.4`.

Phase 2: `pyproject.toml` has `build-backend = "hatchling.build"`, `dynamic = ["version"]`, `[tool.hatch.version] path = "src/tinyretry/__about__.py"`, which holds `__version__ = "0.4.1"`. Layout is `src`. No workspace.

Phase 3: normalized name `tinyretry`.

```
$ curl -s -o /dev/null -w "%{http_code}" https://pypi.org/pypi/tinyretry/json
200
```

`info.project_urls.Source` is `https://github.com/acme/tinyretry`, the user's repo, so `registry_name_status = owned_by_user`.

---

## Exit Criteria

DONE when `package_profile` holds a confirmed stack, build tool, current version with its source, layout, workspace status and a registry name status backed by a real query.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Files say a different stack than `stack` | **Stop**: report both and ask the user which is correct. |
| Phase 1 | No manifest file at root | **Stop**: the library has no packaging yet; ask whether it lives in a subdirectory. |
| Phase 2 | Version cannot be found in any file or tag | **Adjust**: set `current_version = "none"` and treat the release as a first release. |
| Phase 3 | Registry query fails with a network error | **Retry**: run the query once more; if it fails again, **Return** with status `unknown`. |
| Phase 3 | Name owned by someone else | **Stop**: the user must choose a new `package_name`; never publish under a confusingly similar name. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
