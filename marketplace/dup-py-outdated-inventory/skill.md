# Python Outdated Inventory

**One-line description:** Produces a normalized list of outdated Python dependencies with current, in-range and latest versions, direct versus transitive, and a semver-or-calver update type, using `pip list --outdated`, `uv`, or `poetry show --outdated` as the project's tool requires.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager`, `target_packages`, `work_dir`.
- `lockfile_status` (object, required): From `dup-py-lockfile-hygiene`. Must show `in_sync` true (or `unknown` for plain pip).

---

## Outputs

- `outdated_inventory` (object[]): One record per outdated package: `ecosystem` (`pypi`), `name`, `current`, `wanted` (newest allowed by the declared specifier), `latest`, `update_type` (`patch`, `minor`, `major`, `calver`), `direct` (bool), `dev` (bool), `requires_python` of `latest`. Also written to `<work_dir>/outdated.json`.

---

## Phase 1: Collect Raw Outdated Data

### Entry Criteria
- The environment was installed with the frozen install command (so installed versions equal locked versions).

### Actions
1. Run the command for the tool and save raw output to `<work_dir>/py-outdated-raw.*`:

| Tool | Command | Output fields |
|---|---|---|
| pip / pip-tools | `python -m pip list --outdated --format=json` | `name`, `version`, `latest_version`, `latest_filetype` |
| pip, top-level only | `python -m pip list --outdated --not-required --format=json` | same, limited to packages no other installed package requires |
| uv | `uv pip list --outdated --format json` (check `uv pip list --help`; older uv lacks `--outdated`) | `name`, `version`, `latest_version` |
| uv tree view | `uv tree --outdated --depth 1` | prints `(latest: vX)` next to behind packages |
| poetry | `poetry show --outdated --top-level` (`-o -T`) | name, current, latest, description |
| pipenv | `pipenv update --outdated` (reports only; check `--help` for the installed version) | text |

2. Note: `pip list --outdated` cannot be combined with `--format=freeze`; use `json` or `columns`.
3. `pip list --outdated` reports the newest version on the index, ignoring the project's specifiers. To get `wanted`, read the declared specifier for each package from `pyproject.toml` (`[project].dependencies`, `[project.optional-dependencies]`, `[dependency-groups]`, `[tool.poetry.dependencies]`, `[tool.poetry.group.*.dependencies]`) or `requirements.in`, then pick the highest released version satisfying it: `python -m pip index versions <name>` (marked experimental by pip; if unavailable, read `https://pypi.org/pypi/<name>/json` key `releases`).

### Output
Raw outdated list with declared specifiers.

### Quality Gate
- The raw output file exists and the command's exit code is 0.

---

## Phase 2: Normalize And Classify

### Entry Criteria
- Raw list exists.

### Actions
1. Mark `direct=true` when the name (normalize per PEP 503: lowercase, runs of `-`, `_`, `.` become `-`) appears in a declared dependency list; otherwise `direct=false`. Use `pipdeptree --reverse --packages <name>` to show which direct dependency pulls a transitive one in.
2. Mark `dev=true` when declared only in a dev group (`[dependency-groups] dev`, `[tool.poetry.group.dev]`, `requirements-dev.txt`).
3. Classify `update_type` by comparing `current` to `latest` release segments:

| Condition | update_type |
|---|---|
| first segment is a year (for example `2024.8.30`) or the project documents calendar versioning | `calver` (treat as `major` for planning; read the changelog) |
| first segment differs | `major` |
| first segment is `0` and second segment differs | `major` (0.x minors break by convention) |
| second segment differs | `minor` |
| only later segments differ | `patch` |

4. Record `requires_python` of `latest`: `curl -s https://pypi.org/pypi/<name>/<latest>/json | python -c "import json,sys; print(json.load(sys.stdin)['info']['requires_python'])"`. If it excludes the project's Python version, mark the record `blocked_by_runtime`.
5. If `target_packages` is non-empty, keep only those names plus any transitive package that a target's new version requires at a higher version.
6. Write `<work_dir>/outdated.json` (a JSON array of the records). If the file already exists from another ecosystem in the same run, merge by (`ecosystem`, `name`); never overwrite other ecosystems' records.

### Output
`outdated_inventory` and `<work_dir>/outdated.json`.

### Quality Gate
- Every record has all fields filled; `python -c "import json; d=json.load(open('.dep-upgrade/outdated.json')); assert all(r['update_type'] for r in d)"` exits 0.
- The count of `direct=true` records is less than or equal to the number of declared dependencies.

---

## Worked Example

Illustrative only. uv project on Python 3.11.

- Phase 1: `uv pip list --outdated --format json` prints entries including `{"name":"django","version":"4.2.16","latest_version":"5.2.7"}`, `{"name":"requests","version":"2.31.0","latest_version":"2.32.3"}`, `{"name":"certifi","version":"2024.2.2","latest_version":"2024.8.30"}`. Declared: `django>=4.2,<5`, `requests>=2.31`.
- Phase 2: django: `wanted=4.2.x latest patch`, `latest=5.2.7`, `major`, direct. requests: `minor`, direct. certifi: `calver`, transitive (pulled in by requests per `pipdeptree -r -p certifi`). django 5.2 `requires_python=">=3.10"`, not blocked.

---

## Exit Criteria

DONE when `<work_dir>/outdated.json` holds one classified record per outdated Python package in scope.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tool lacks an outdated flag (old uv or pipenv) | **Adjust**: fall back to `python -m pip list --outdated --format=json` inside the project environment. |
| Phase 1 | Private index requires auth | **Stop**: ask for index credentials setup; do not query PyPI for private package names. |
| Phase 2 | `pip index versions` unavailable | **Adjust**: read releases from the PyPI JSON API. |
| Phase 2 | Version string is not PEP 440 | **Return**: record `update_type=major` and note it for changelog reading. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
