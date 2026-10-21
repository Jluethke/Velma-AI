# Dependency Upgrade Rollback Plan

**One-line description:** Writes and rehearses the rollback for each plan item before it is applied: the exact revert commands, the reinstall from the old lockfile, the previous build artifact to redeploy, and the one-way changes (database migrations, data formats, runtime images) that a code revert does not undo.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `repo_path`, `install_command`, `test_command`, `stack`, `framework`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Uses `baseline_sha`, `lockfile_hashes`.
- `upgrade_plan` (object[], required): From `dup-upgrade-order-plan`.

---

## Outputs

- `rollback_plan` (object): `baseline_tag`, `per_item` (order to revert procedure), `one_way_changes` (list with mitigation), `artifact_reference` (previous image digest or package version), `rehearsal` (commands run and results). Also written to `<work_dir>/rollback.md` and `<work_dir>/rollback.json`.

---

## Phase 1: Identify One-Way Changes

### Entry Criteria
- `<work_dir>/plan.json` exists.

### Actions
1. For each plan item, check the categories below. Each "yes" becomes a `one_way_changes` entry with the item order:

| Check | How to check | Why a revert does not undo it |
|---|---|---|
| Framework generates new DB migrations | Django: after the bump, `python manage.py makemigrations --check --dry-run` prints new operations. Rails-style or Flyway/Liquibase: new files under `db/migrate`, `src/main/resources/db/migration` | applied schema stays after code revert |
| ORM changes column types or defaults | breaking change `category=default-change` mentioning fields, for example Django 5.0 `USE_TZ` default, Hibernate 6 id generation changes | data written in the new shape |
| Serialization or cache format changes | breaking changes mentioning pickle protocol, session serializer, JSON encoding, protobuf | old code cannot read new data |
| Password hashing parameter changes | breaking changes mentioning hasher iterations or algorithms | hashes are upgraded on login; check the old version can still verify them |
| Runtime or base image change | plan item `method=runtime-flow`; `Dockerfile` `FROM` line changes | previous image must still exist in the registry |
| Lockfile format version change | npm `lockfileVersion`, uv or Poetry lock format | older tool version may not read the new lock |

2. For each one-way change, write the mitigation: reversible migration (Django migrations with a reverse operation, tested with `python manage.py migrate <app> <previous_migration>`), feature flag, dual-read code, or "deploy the schema change separately before the code change".

### Output
`one_way_changes`.

### Quality Gate
- Every plan item has been checked against all six rows (record "no" explicitly).

---

## Phase 2: Write The Per-Item Revert

### Entry Criteria
- One-way changes listed.

### Actions
1. Because each plan item lands as its own commit, the code rollback for item N is: `git revert --no-edit <sha-of-item-N>` (sha filled in by `dup-apply-one-bump`). Never use `git reset --hard` on a shared branch.
2. Reinstall from the restored lockfile with the frozen command (`npm ci`, `uv sync --locked`, `poetry sync`, `pip-sync`, `go mod download`, `cargo build --locked`, `./mvnw -B verify`).
3. Full-run rollback: `git switch -c rollback/<date> <baseline_tag>` then reinstall, build, and run tests, then deploy the previous artifact.
4. Record the previous deployable artifact: container image digest (`docker image inspect <image>:<tag> --format '{{index .RepoDigests 0}}'`) or the last released package version. Deploying by digest avoids rebuilding with a now-different dependency resolution.
5. Write `<work_dir>/rollback.md` with a table: item, commit (to be filled), revert command, reinstall command, one-way change and mitigation.

### Output
Per-item procedures.

### Quality Gate
- `rollback.md` has one row per plan item and every row has a concrete revert and reinstall command.

---

## Phase 3: Rehearse The Baseline Restore

### Entry Criteria
- Procedures written.

### Actions
1. In a separate worktree so the upgrade branch is untouched: `git worktree add <work_dir>/rehearsal <baseline_tag>`.
2. In that worktree run the frozen install and `test_command`. Results must match `baseline_report`.
3. Remove the worktree: `git worktree remove <work_dir>/rehearsal`.
4. Record commands and exit codes under `rehearsal`.

### Output
`rollback_plan`.

### Quality Gate
- The rehearsal install exited 0 and test failures equal `baseline_report.pre_existing_failures` plus at most known flaky tests.

---

## Worked Example

Illustrative only. Django 4.2 to 5.2 plan with 4 items.

- Phase 1: item 4 (Django) row 1: the release notes for 5.0 to 5.2 list no automatic model field changes, and the check will be confirmed with `makemigrations --check --dry-run` right after the bump; recorded "no, confirm after bump". Row 2: `USE_TZ = True` is already set in settings, so the 5.0 default change does not apply; "no". Row 5: the Docker base image stays `python:3.11-slim`; "no".
- Phase 2: rollback.md rows like `4 | <sha> | git revert --no-edit <sha> | uv sync --locked | none`. Previous image digest `registry.example.com/shop@sha256:4f1c...` recorded.
- Phase 3: worktree at `dep-baseline-20261020`, `uv sync --locked` exit 0, `uv run pytest -q`: `412 passed, 2 failed` (the 2 known pre-existing failures). Worktree removed.

---

## Exit Criteria

DONE when every plan item has a written revert, every one-way change has a mitigation, and the baseline restore was rehearsed with matching test results.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A one-way change has no mitigation | **Stop**: present it to the user before applying that item; they decide. |
| Phase 2 | Previous image not retained in the registry | **Return**: record as a risk; ask the user to pin or re-tag the current image before deploying. |
| Phase 3 | Baseline restore fails to install | **Stop**: the rollback path is broken; fix it (often a yanked package or a removed registry) before any upgrade. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
