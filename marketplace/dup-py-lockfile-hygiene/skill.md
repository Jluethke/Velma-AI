# Python Lockfile Hygiene

**One-line description:** Makes a Python project's lock state reproducible before any upgrade: one lock tool, a lockfile in sync with `pyproject.toml` or `requirements.in`, hashes where the tool supports them, and an install that never re-resolves.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager`, `manifest_files`, `lockfile`, `install_command`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Uses `install_ok`, `tests_passed`, `pre_existing_failures`.

---

## Outputs

- `lockfile_status` (object): `tool`, `lockfile`, `in_sync` (bool), `hashes` (bool), `fixes_committed` (commit shas), `new_baseline_sha`, `notes`. Also written to `<work_dir>/lockfile.json`.

---

## Phase 1: Check The Lock Is In Sync

### Entry Criteria
- `upgrade_scope.stack == "python"`.

### Actions
1. If `package_manager == CONFLICT` (for example both `poetry.lock` and `uv.lock`), stop and ask the user which tool CI uses. Read the CI file install step to show them the evidence. Never delete a lockfile on your own.
2. Run the sync check for the tool. Each command exits non-zero when the lock does not match the manifest:

| Tool | Sync check command | What a failure prints |
|---|---|---|
| uv | `uv lock --check` (older uv: `uv lock --locked`) | a message that the lockfile needs to be updated |
| poetry 2.x | `poetry check --lock` | `pyproject.toml changed significantly since poetry.lock was last generated` |
| poetry 1.x | `poetry check --lock` (1.6+) or `poetry lock --check` (older) | same message |
| pipenv | `pipenv verify` | `Pipfile.lock is out-of-date` |
| pip-tools | `pip-compile --quiet --dry-run requirements.in 2>&1 \| diff - requirements.txt` after stripping comment lines | any diff line |
| plain pip | not checkable; record `in_sync=unknown` | none |

3. Check for hashes: `grep -c -- '--hash=sha256' requirements.txt` (pip-tools/pip), or note that `uv.lock`, `poetry.lock` and `Pipfile.lock` store hashes by design.
4. Check unpinned lines in plain requirements files: `grep -vE '^\s*(#|$|-r|-c|--)' requirements*.txt | grep -vE '=='`. Every printed line is an unpinned dependency.

### Output
`in_sync`, `hashes`, list of unpinned lines.

### Quality Gate
- The sync check command and its exit code are recorded in `<work_dir>/lockfile.json`.
- The unpinned-line grep output is saved, even when empty.

---

## Phase 2: Repair Without Upgrading

### Entry Criteria
- `in_sync == false`, or unpinned lines exist, or the user asked for hashes.

### Actions
1. Regenerate the lock with the flag that keeps current versions. Do not use the upgrade flag here:

| Tool | Command that relocks WITHOUT upgrading | Never use here |
|---|---|---|
| uv | `uv lock` (keeps locked versions that still satisfy constraints) | `uv lock --upgrade` |
| poetry 2.x | `poetry lock` (2.x default keeps versions) | `poetry update`, `poetry lock --regenerate` |
| poetry 1.x | `poetry lock --no-update` | `poetry lock` without the flag (1.x upgrades) |
| pipenv | `pipenv lock` then compare versions (pipenv may move versions; review step 3) | `pipenv update` |
| pip-tools | `pip-compile requirements.in` (keeps pins already in requirements.txt) | `pip-compile --upgrade` |
| pip-tools hashes | `pip-compile --generate-hashes requirements.in` | |

2. For plain pip with unpinned lines: freeze what the baseline installed. `python -m pip freeze --exclude-editable > <work_dir>/frozen.txt`, then copy the exact `==` versions of the unpinned packages into `requirements.txt`, one line at a time. Do not paste the whole freeze over the file (it adds transitive packages the project never declared).
3. Diff the lock: `git diff --stat` and `git diff <lockfile> | grep -E '^[-+](name|version) ='` (uv/poetry) or `git diff requirements.txt | grep -E '^[-+][A-Za-z]'`. Any version that changed is an upgrade sneaking in. Revert it with `git checkout -- <lockfile>` and use the no-upgrade command from the table.
4. Re-run `install_command` and the test suite. Results must match `baseline_report` (same failures, no new ones).
5. Commit alone: `git commit -am "deps: repair python lock state (no version changes)"`. Record the sha as `new_baseline_sha`.

### Output
Repaired lockfile, `fixes_committed`, `new_baseline_sha`.

### Quality Gate
- The sync check from Phase 1 now exits 0.
- The version diff from step 3 prints zero changed versions.
- Test failures equal `baseline_report.pre_existing_failures` plus at most the known `flaky_tests`.

---

## Phase 3: Lock Rules For The Rest Of The Run

### Entry Criteria
- Lock is in sync.

### Actions
1. Write the rules into `<work_dir>/lockfile.json` under `notes` so `dup-apply-one-bump` follows them:
   - Upgrade one package at a time: uv `uv lock --upgrade-package <name>`, poetry `poetry update <name>`, pip-tools `pip-compile --upgrade-package <name> requirements.in`.
   - Always commit the manifest and the lockfile in the same commit.
   - CI and local installs use the frozen command (`uv sync --locked`, `poetry sync` or `poetry install --sync`, `pip-sync`, `pip install --require-hashes -r requirements.txt`).
2. Record the tool's Python constraint: `requires-python` in `pyproject.toml`. Later upgrades that need a newer Python are blocked until the runtime moves.

### Output
`lockfile_status`.

### Quality Gate
- `<work_dir>/lockfile.json` parses with `python -m json.tool`.

---

## Worked Example

Illustrative only. Poetry 1.8 project; CI runs `poetry install --sync`.

- Phase 1: `poetry check --lock` exits 1: `pyproject.toml changed significantly since poetry.lock was last generated. Run poetry lock [--no-update] to fix the lock file.` (Someone added `httpx = "^0.27"` without relocking.)
- Phase 2: `poetry lock --no-update` adds only `httpx`, `httpcore`, `h11`. `git diff poetry.lock | grep -E '^[-+]version ='` shows only new entries, no changed versions. Tests: same 2 pre-existing failures. Commit `a41d9be`.
- Phase 3: notes say `poetry update <name>` per package; `requires-python = ">=3.10"`.

---

## Exit Criteria

DONE when the sync check exits 0, any repair changed zero existing versions, tests match the baseline, and the lock rules are written for later flows.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two Python lockfiles | **Stop**: show the CI install step and ask which tool is authoritative. |
| Phase 2 | Relock changes existing versions | **Retry**: revert the lockfile and use the no-upgrade command for the installed tool version. |
| Phase 2 | Resolver reports a conflict on relock | **Return**: record the conflict text; the manifest was already unsatisfiable, report it to the user. |
| Phase 2 | Tests differ from baseline after repair | **Stop**: revert the commit with `git revert`; report which test changed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
