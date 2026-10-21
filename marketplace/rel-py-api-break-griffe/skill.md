# Python API Break Detection with griffe

**One-line description:** Runs `griffe check` to compare a Python package's public API at the last release tag against HEAD, reads each reported breakage, and adds the packaging-level breaks griffe does not see (`requires-python`, removed extras, removed entry points).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `last_tag` (string, optional): Release tag to compare against. Defaults to `git describe --tags --abbrev=0`.
- `package_name` (string, required): Top-level import name (for example `acme`), not the distribution name if they differ.

---

## Outputs

- `py_api_breaks` (object[]): One entry per break: `object` (dotted path), `kind` (griffe breakage kind or `packaging`), `old`, `new`, `source` (`griffe` or `pyproject`), `file:line`. Empty list when none.

---

## Phase 1: Prepare griffe

### Entry Criteria
- `repo_path` is a git checkout with `last_tag` present (`git rev-parse --verify <last_tag>^{tag}` or `^{commit}` succeeds).

### Actions
1. Install into an isolated tool environment, not the project venv: `pipx install griffe` or `uv tool install griffe`. Confirm with `griffe --version`.
2. Find the source root: if `src/<package_name>/__init__.py` exists, the search path is `src`; if `<package_name>/__init__.py` is at the repo root, the search path is `.`.
3. Read `griffe check --help` and confirm the flags `--against` (`-a`), `--search` (`-s`) and `--format` (`-f`) exist in your installed version. Do not use flags that `--help` does not list.

### Output
Working griffe install and the search path.

### Quality Gate
- `griffe --version` prints a version.
- `griffe dump <package_name> -s <search path> | head -c 200` prints JSON (proves griffe can load the package statically).

---

## Phase 2: Run the Check

### Entry Criteria
- Phase 1 gates pass. Working tree is clean (`git status --porcelain` empty), because griffe compares the working tree to the ref.

### Actions
1. Run: `griffe check <package_name> -s <search path> -a <last_tag> -f verbose`. griffe checks out `<last_tag>` in a temporary git worktree, loads both versions statically and prints each breakage.
2. Record the exit code: 0 means no breakage found; non-zero with output means breakages were found.
3. Map each printed line to an entry. Common breakage kinds and what they mean:

   | griffe message (kind) | Breaking for callers because |
   |---|---|
   | Public object was removed | imports fail |
   | Parameter was removed | callers passing it get `TypeError` |
   | Positional parameter was moved | positional callers bind the wrong value |
   | Parameter kind was changed (for example positional to keyword-only) | positional callers get `TypeError` |
   | Parameter was added as required | existing calls lack it |
   | Parameter default was changed | silent behavior change; treat as breaking unless the user rules otherwise |
   | Return types are incompatible / attribute value was changed | callers may mis-handle the result |

4. griffe treats names starting with `_` as private and honors `__all__`. If a break is reported on an object that the project documents as internal, record it with `kind` and add `note: "documented internal"`; the version decision step decides.
5. Do not "fix" breaks in this flow. This flow measures; it does not edit code.

### Output
griffe-sourced entries in `py_api_breaks`.

### Quality Gate
- The full griffe command line and its exit code are recorded.
- The number of entries equals the number of breakage lines printed.

---

## Phase 3: Packaging-Level Breaks

### Entry Criteria
- Phase 2 done.

### Actions
1. Compare `pyproject.toml` at the tag and now: `git diff <last_tag> HEAD -- pyproject.toml`.
2. Record a `packaging` entry for each of these when it appears in the diff:
   - `requires-python` lower bound raised (users on the dropped Python can no longer install new versions). Whether this is MAJOR or MINOR is a project policy, not a SemVer rule; record it and flag it as a policy question.
   - An extra removed from `[project.optional-dependencies]` (`pip install pkg[extra]` warns and installs without it).
   - A console script or entry point removed from `[project.scripts]` or `[project.entry-points]`.
   - A dependency's lower bound raised past a major version (forces downstream upgrades). Record as a policy question.
3. Compiled extension modules (`.so`, `.pyd`) are not analyzed statically; if the package has them, list their public functions from the `.pyi` stubs and note that griffe coverage is partial.

### Output
Final `py_api_breaks`.

### Quality Gate
- Every `pyproject.toml` diff hunk touching the four items above has a matching entry or an explicit "no break" note.
- `py_api_breaks` is valid JSON (`python -m json.tool` succeeds on it).

---

## Worked Example

Illustrative. `package_name` = `acme`, src layout, `last_tag` = `v1.8.0`.

- Phase 1: `griffe --version` prints `griffe 1.x`. `griffe dump acme -s src` prints JSON.
- Phase 2: `griffe check acme -s src -a v1.8.0 -f verbose` prints (shape representative):
  ```
  src/acme/client.py:41: Client.fetch(timeout):
  Parameter kind was changed:
    Old: positional or keyword
    New: keyword-only
  src/acme/__init__.py:0: load_config:
  Public object was removed
  ```
  Exit code 1. Two entries recorded.
- Phase 3: `git diff v1.8.0 HEAD -- pyproject.toml` shows `requires-python = ">=3.8"` changed to `">=3.10"`: one `packaging` entry flagged as a policy question.

---

## Exit Criteria

DONE when `py_api_breaks` lists every griffe-reported breakage and every packaging-level break from `pyproject.toml`, each with old and new values, or is an empty list backed by a griffe exit code of 0 and a clean `pyproject.toml` diff.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `griffe dump` cannot find the package | **Adjust**: wrong search path or import name; check `src/` layout and `package_name`. |
| Phase 2 | griffe errors because the tree is dirty | **Stop**: commit or stash changes, then rerun. Do not compare against uncommitted code. |
| Phase 2 | Flag rejected by griffe | **Adjust**: read `griffe check --help` and use the listed spelling; never invent a flag. |
| Phase 2 | Dynamic API (`__getattr__`, generated classes) not visible | **Return**: list those names as "not statically analyzable" for manual review. |
| Phase 3 | `last_tag` predates `pyproject.toml` (setup.py era) | **Adjust**: compare `setup.py` / `setup.cfg` `python_requires`, `extras_require`, `entry_points` instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
