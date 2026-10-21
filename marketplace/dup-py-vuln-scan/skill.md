# Python Vulnerability Scan With pip-audit

**One-line description:** Scans the locked Python dependency set with `pip-audit`, maps every advisory to the smallest fixing version, and records findings that have no fix or are accepted, without letting `--fix` upgrade anything behind the plan's back.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager`, `work_dir`.
- `lockfile_status` (object, required): From `dup-py-lockfile-hygiene`. Lock must be in sync.

---

## Outputs

- `vuln_findings` (object[]): One record per (package, advisory): `ecosystem` (`pypi`), `name`, `installed`, `advisory_id` (PYSEC or GHSA), `aliases` (CVE ids), `fixed_in` (list), `min_fix` (smallest fixed version above installed), `fix_update_type`, `no_fix` (bool), `ignored` (bool, with reason). Also written to `<work_dir>/vulns.json`.

---

## Phase 1: Produce An Auditable Requirements Set

### Entry Criteria
- `lockfile_status.in_sync` is true or `unknown` (plain pip).

### Actions
1. Install the tool in an isolated place: `pipx install pip-audit` or `python -m pip install pip-audit` inside a separate virtual environment. Do not add it to project dependencies.
2. Export the locked set to a pinned requirements file pip-audit can read:

| Tool | Export command |
|---|---|
| uv | `uv export --format requirements-txt --no-hashes > .dep-upgrade/audit-reqs.txt` (check `uv export --help` for the installed version) |
| poetry 2.x | `poetry export -f requirements.txt --without-hashes -o .dep-upgrade/audit-reqs.txt` (needs the `poetry-plugin-export` plugin) |
| poetry 1.x | same command; the export plugin is bundled through 1.x |
| pip-tools / pip | use `requirements.txt` directly |
| pipenv | `pipenv requirements > .dep-upgrade/audit-reqs.txt` |

3. Check every line is pinned with `==`: `grep -vcE '^\s*(#|$)|==' .dep-upgrade/audit-reqs.txt` should print `0`.

### Output
`.dep-upgrade/audit-reqs.txt`.

### Quality Gate
- The export command exited 0 and the pin check printed `0`.

---

## Phase 2: Run pip-audit

### Entry Criteria
- Pinned requirements file exists.

### Actions
1. Run without resolving again (the file is already fully pinned): `pip-audit -r .dep-upgrade/audit-reqs.txt --no-deps --format json --output .dep-upgrade/pip-audit.json`. If the file was exported with hashes, add `--require-hashes` instead of `--no-deps`.
2. Also produce a readable table: `pip-audit -r .dep-upgrade/audit-reqs.txt --no-deps --desc`. Columns: `Name`, `Version`, `ID`, `Fix Versions`, `Description`.
3. Exit codes: `0` no known vulnerabilities; `1` vulnerabilities found (normal, parse the JSON). Any other failure (network, resolution) is a tool error.
4. Vulnerability source: default is the PyPI JSON API (`-s pypi`); `-s osv` queries OSV. When results look incomplete, run both and union them by `advisory_id` and `aliases`.
5. Do NOT run `pip-audit --fix` in this flow. It installs fixed versions into the environment immediately, outside the lockfile and outside the upgrade plan. A dry view is allowed: `pip-audit --fix --dry-run` prints what it would install.

### Output
`.dep-upgrade/pip-audit.json`.

### Quality Gate
- The JSON parses and its `dependencies` array length equals the number of lines in the pinned file (packages with no findings appear with an empty `vulns` list).

---

## Phase 3: Normalize, Pick Minimum Fixes, Record Exceptions

### Entry Criteria
- JSON parses.

### Actions
1. For each `dependencies[].vulns[]`: record `advisory_id=id`, `aliases`, `fixed_in=fix_versions`.
2. `min_fix`: the smallest version in `fix_versions` greater than `installed`. Prefer a fix in the same release line (for example installed `4.2.10`, fix versions `4.2.14, 5.0.7`: pick `4.2.14`).
3. `fix_update_type`: classify `installed` to `min_fix` with the same rules as `dup-py-outdated-inventory` (major, minor, patch, calver).
4. `no_fix=true` when `fix_versions` is empty. Record the advisory text; options for the user are: remove or replace the package, accept with a written reason, or patch locally. Do not decide for them.
5. Accepted findings use `pip-audit --ignore-vuln <ID>` only with a written reason stored in `<work_dir>/vulns.json` (`ignored=true`, `reason`, `review_by` date from the user). Never ignore to make the command exit 0.
6. Merge into `<work_dir>/vulns.json` by (`ecosystem`, `name`, `advisory_id`).

### Output
`vuln_findings`.

### Quality Gate
- Every finding has `min_fix` or `no_fix=true`.
- Every `ignored=true` finding has a non-empty `reason` that came from the user.

---

## Worked Example

Illustrative only. uv project.

- Phase 1: `uv export --format requirements-txt --no-hashes > .dep-upgrade/audit-reqs.txt`; pin check prints `0`.
- Phase 2: `pip-audit -r .dep-upgrade/audit-reqs.txt --no-deps --desc` prints rows like `jinja2 3.1.3 GHSA-h75v-3vvj-5mfj 3.1.4` and `requests 2.31.0 GHSA-9wx4-h78v-vm56 2.32.0`. Exit code 1.
- Phase 3: jinja2 `min_fix=3.1.4` (patch); requests `min_fix=2.32.0` (minor). No `no_fix` entries.

---

## Exit Criteria

DONE when `<work_dir>/vulns.json` lists every Python advisory with its minimum fix or an explicit no-fix or accepted status.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Poetry export plugin missing | **Adjust**: `poetry self add poetry-plugin-export`, with user approval; or audit the installed environment with plain `pip-audit` (no `-r`). |
| Phase 2 | Private packages not on PyPI cause lookup errors | **Adjust**: they are skipped with a warning (`--skip-editable` for editable installs); record them as unscanned. |
| Phase 2 | Network failure to the vulnerability service | **Retry**: once; then **Return** with `scan_incomplete=true`. |
| Phase 3 | User asks to ignore everything to pass CI | **Stop**: each ignore needs its own reason. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
