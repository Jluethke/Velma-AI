# Apply One Dependency Bump Per Commit

**One-line description:** Executes the plan's `bump` items strictly one at a time: change one package (or one lockstep group) with the stack's exact command, reinstall from the lock, build, run the full test suite, compare to the baseline, and commit or revert, splitting any grouped item that fails.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `stack`, `package_manager`, `install_command`, `build_command`, `test_command`, `work_dir`.
- `upgrade_plan` (object[], required): From `dup-upgrade-order-plan`. Only items with `method == "bump"` are executed here.
- `rollback_plan` (object, required): From `dup-rollback-plan`. Items with an unmitigated one-way change are skipped.

---

## Outputs

- `applied_bumps` (object[]): Per landed item: `order`, `packages`, `from`, `to`, `commit`, `test_result` (passed, failed ids), `lock_diff_summary`. Also appended to `<work_dir>/applied.json` and the commit sha written into `<work_dir>/rollback.md`.
- `blocked_bumps` (object[]): Per item not landed: `order`, `packages`, `failure` (first error lines), `classification`, `next_step`. Also written to `<work_dir>/blocked.json`.

---

## Phase 1: Prepare The Item

### Entry Criteria
- `git status --porcelain` is empty.
- Every order in the item's `blocked_by` is in `applied_bumps` (or in a previous runtime/framework flow's commits).

### Actions
1. Pick the lowest `order` item with `method == "bump"` not yet applied or blocked.
2. Read its `breaking_refs`. If any referenced change has `affects_repo=true` and no codemod, list the files from its `evidence`; those are the ONLY files you may edit for this item.
3. Do not touch any other package, file or config in this item. One item, one commit.

### Output
The item and its allowed file list.

### Quality Gate
- The allowed file list is written to `<work_dir>/item-<order>.txt` before any change.

---

## Phase 2: Change The Version

### Entry Criteria
- Item prepared.

### Actions
1. Run exactly one command from this table for the item's packages and target version:

| package_manager | In-range bump | Out-of-range (major) bump |
|---|---|---|
| uv | `uv lock --upgrade-package <name>==<to>` (check `uv lock --help`; if the `==` form is rejected use `--upgrade-package <name>` and verify the locked version) | `uv add "<name>>=<to>,<<next major>"`, for example `uv add "django>=5.2,<6"`, matching the project's existing specifier style |
| poetry | `poetry update <name>` | `poetry add <name>@^<to>` |
| pip-tools | `pip-compile --upgrade-package <name>==<to> requirements.in` | edit the line in `requirements.in`, then `pip-compile requirements.in` |
| pip | edit the `==` line in `requirements.txt` | same |
| npm | `npm install <name>@<to>` | same; for a lockstep group list all names in one command |
| pnpm | `pnpm add <name>@<to>` | same |
| yarn berry / classic | `yarn up <name>@<to>` / `yarn upgrade <name>@<to>` | same |
| go | `go get <module>@<to>` then `go mod tidy` | new path: `go get <module>/vN@<to>`, update imports (`gofmt -w -r` cannot rename import paths; edit import lines in the allowed files), then `go mod tidy` |
| cargo | `cargo update -p <name> --precise <to>` | `cargo add <name>@<to>` in the member that declares it (or edit `[workspace.dependencies]`) |
| maven | edit the version or the `<properties>` entry in `pom.xml` | same |
| gradle | edit `gradle/libs.versions.toml` or the build file version | same |

2. Run the frozen install (`install_command`). Go: also `go mod vendor` if vendored.
3. Check the lock diff only moved what you intended: npm `git diff package-lock.json | grep -E '^[-+]\s+"version":' | wc -l`; uv/poetry `git diff <lock> | grep -E '^[-+]version ='`; cargo `git diff Cargo.lock | grep -E '^[-+]version ='`; go `git diff go.mod`. Transitive moves required by the new version are expected; unrelated top-level moves are not. Record the summary as `lock_diff_summary`.

### Output
Changed manifest and lockfile.

### Quality Gate
- `git diff --name-only` lists only the manifest, the lockfile, and files from the allowed list.
- The installed version equals `to`: `python -m pip show <name> | grep Version`, `npm ls <name> --depth=0`, `go list -m <module>`, `cargo tree -p <name> --depth 0 --locked`, or `./mvnw dependency:tree -Dincludes=<g>:<a>`.

---

## Phase 3: Prove It And Commit Or Revert

### Entry Criteria
- Version changed and installed.

### Actions
1. Run `build_command` then the full `test_command`. Never run a subset and never add `--skip`, `-k`, `.only`, `-run` filters to reach green.
2. Compare with the baseline:

| Result | Classification | Action |
|---|---|---|
| failures equal baseline pre-existing (plus known flaky) | pass | commit |
| new failure, error names an API listed in `breaking_changes` for this item | migration needed | edit only the allowed files to the documented replacement, rerun; if still failing after the documented change, revert and block |
| new failure in a test asserting old behavior that the changelog documents as changed | behavior change | **revert and block**; the user decides whether the new behavior is acceptable. Never edit the assertion yourself |
| new failure not explained by any changelog entry | unknown regression | revert and block; record the first 30 lines of the failure |
| install or resolution error (`ERESOLVE`, `ResolutionImpossible`, `version solving failed`, `failed to select a version`) | conflict | revert; record the conflicting requirement; it becomes a new graph edge for the plan |
| grouped item fails | group failure | revert; split the group in halves and retry each half as its own item |

3. Commit a passing item with the plan's message: `git add -A && git commit -m "<commit_message>"`. Record the sha in `applied_bumps` and in `<work_dir>/rollback.md`.
4. Revert a failing item: `git checkout -- . && git clean -fd -- <paths changed in this item>` (only paths in the allowed list and lockfile), then confirm `git status --porcelain` is empty.
5. Return to Phase 1 for the next item until no `bump` items remain.

### Output
`applied_bumps`, `blocked_bumps`.

### Quality Gate
- `git log --oneline <baseline_sha>..HEAD` shows exactly one commit per entry in `applied_bumps`.
- No test file was deleted or had assertions removed: `git diff <baseline_sha>..HEAD --stat -- '*test*' '*spec*'` shows only files the user approved.

---

## Worked Example

Illustrative only. npm project, plan items 2 (`express 4.20.0 -> 4.21.1`, security) and 3 (`zod 3.23.8 -> 3.25.76`).

- Item 2, Phase 2: `npm install express@4.21.1`; `npm ci`; lock diff shows `express`, `cookie 0.6.0 -> 0.7.1`, `send`, `serve-static`. Phase 3: `npm run build && npm test`: 212 suites, same flaky test as baseline. Commit `d1e44a0 deps: bump express 4.20.0 -> 4.21.1 (security: GHSA-pxg6-pf52-xh8x)`.
- Item 3: `npm install zod@3.25.76`; tests show a new failure `schema.spec.ts: expected error message "Required"`; changelog lists no message change, so class "unknown regression". Reverted; `blocked_bumps` gets item 3 with the failure text.

---

## Exit Criteria

DONE when every `bump` item is either committed alone with tests matching the baseline, or reverted and recorded in `blocked_bumps` with a classification.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A `blocked_by` item is in `blocked_bumps` | **Return**: block this item too, with `next_step="waits on order N"`. |
| Phase 2 | Command not in the table for this tool | **Stop**: read `<tool> --help`; do not invent flags. |
| Phase 3 | Tempted to update snapshots (`jest -u`, `--snapshot-update`) to pass | **Stop**: snapshot changes are behavior changes; block the item and show the snapshot diff to the user. |
| Phase 3 | Revert leaves untracked files | **Adjust**: remove only paths created by this item; never `git clean -fdx` the repo. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
