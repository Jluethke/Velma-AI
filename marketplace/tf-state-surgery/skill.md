# Safe State Surgery: removed Blocks, state mv and state rm

**One-line description:** Performs state edits that config refactors cannot (forget a resource without destroying it, split one state into two, fix a bad address) using `removed` blocks first and CLI `state` commands with `-dry-run` second, always behind a versioned backup and a locked workspace.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root modules involved (source and, for splits, destination).
- `state_operations` (object[], required): Each: operation (`forget`, `move-within`, `move-across`), address, and destination address or root.

---

## Outputs

- `state_backup_path` (string): Path of the pre-surgery state backup for every touched root (stored outside the repo).
- `state_change_log` (object[]): Each operation: command or block used, dry-run output, and post-change plan exit code for every touched root.

---

## Phase 1: Back Up and Freeze

### Entry Criteria
- No other run is active; CI applies for these roots are paused.

### Actions
1. For each touched root: `terraform state pull > ../backups/<root>-$(date +%Y%m%d%H%M%S).tfstate` (PowerShell: `terraform state pull | Out-File -Encoding utf8 ..\backups\<root>-<timestamp>.tfstate`). Store backups outside the repo; they contain secrets.
2. Record `terraform state list | wc -l` and the `serial` and `lineage` fields: `jq '{serial, lineage}' <backup>`.
3. HCP Terraform: lock the workspace in the UI ("Lock workspace") before surgery.

### Output
`state_backup_path`.

### Quality Gate
- Every backup file is non-empty and `jq .serial <backup>` prints a number.

---

## Phase 2: Choose the Mechanism

### Entry Criteria
- Backups exist.

### Actions
1. Prefer config-driven changes because they are reviewed in a plan:

| Operation | Terraform 1.7+ | Older |
|---|---|---|
| `forget`: stop managing, keep the real resource | `removed { from = aws_instance.legacy  lifecycle { destroy = false } }` and delete the resource block | `terraform state rm 'aws_instance.legacy'` |
| `move-within`: rename in same state | `moved` block (use `tf-moved-refactor`) | `terraform state mv` |
| `move-across`: to another root's state | `removed` (destroy = false) in source + `import` block in destination | same two steps with `state rm` and `terraform import` |

2. Avoid `terraform state mv -state-out`: it works only with local state files. For remote backends, use the removed-plus-import pattern.
3. Quote addresses with brackets. Bash: `'aws_subnet.private["a"]'`. PowerShell: `'aws_subnet.private[\"a\"]'` (PowerShell strips inner quotes when passing to native programs in older versions; confirm with `-dry-run`).

### Output
Mechanism per operation.

### Quality Gate
- Every `move-across` has both a source `removed` step and a destination `import` step listed.

---

## Phase 3: Execute One Operation at a Time

### Entry Criteria
- Mechanisms chosen.

### Actions
1. Config-driven: write the `removed` block, run `terraform plan`. Expected text: `# aws_instance.legacy will no longer be managed by Terraform` and summary with `0 to destroy`. Then `terraform apply`.
2. CLI: always dry-run first, e.g. `terraform state rm -dry-run 'aws_instance.legacy'` prints `Would remove aws_instance.legacy`. Then run without `-dry-run`.
3. For `move-across`, after removing from the source, add the import block in the destination and follow `tf-import-existing` Phase 3.
4. After each operation, run `terraform plan -detailed-exitcode` in every touched root. Exit code 0 is the target. A plan in the source root that wants to destroy the forgotten resource means the resource block is still in code.
5. Never use `terraform state push` to "fix" something unless restoring a backup; it can overwrite newer state. If you must restore: `terraform state push <backup>`; Terraform refuses if the serial or lineage does not fit, and `-force` overrides that check, which is only acceptable when you have confirmed the backup is the correct version.

### Output
`state_change_log`.

### Quality Gate
- Every operation in the log has its dry-run output or the plan text of its `removed` block.
- Every touched root's final `plan -detailed-exitcode` exits 0.

---

## Worked Example

Illustrative. Move `aws_db_instance.main` from `live/prod/app` to new root `live/prod/data`. Terraform 1.9.

- Phase 1: backups for both roots; `serial` 412 for app.
- Phase 2: `move-across` = `removed` in app + `import` in data.
- Phase 3: app plan prints `# aws_db_instance.main will no longer be managed by Terraform` and `Plan: 0 to add, 0 to change, 0 to destroy.`; applied. Data root gets the resource block and `import { to = aws_db_instance.main  id = "acme-prod-db" }`; plan `1 to import, 0 to add, 0 to change, 0 to destroy`; applied. Both roots re-plan with exit code 0.

---

## Exit Criteria

DONE when every operation is applied, every touched root plans clean, and backups are recorded outside the repo.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot pull state (lock held) | **Stop**: find the lock holder; do not force-unlock a live run. |
| Phase 3 | Source plan shows destroy of the moved resource | **Stop**: do not apply; the `removed` block is missing `destroy = false` or the resource block remains. |
| Phase 3 | Address not found in state | **Adjust**: copy the exact address from `terraform state list`. |
| Phase 3 | State corrupted after a CLI edit | **Return**: restore with `terraform state push <backup>` after confirming lineage matches; re-plan. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
