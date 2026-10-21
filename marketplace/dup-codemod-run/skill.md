# Run A Framework-Provided Codemod

**One-line description:** Applies a documented codemod (OpenRewrite, jscodeshift-based framework codemods, django-upgrade, pyupgrade, bump-pydantic, `go fix`, `cargo fix`) for one plan item with `method == "codemod"`: dry run first, apply on a clean tree, commit the mechanical change separately from manual fixes, then find what the codemod could not do.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `stack`, `install_command`, `build_command`, `test_command`, `work_dir`.
- `upgrade_plan` (object[], required): From `dup-upgrade-order-plan`. Items with `method == "codemod"`.
- `breaking_changes` (object[], required): From `dup-changelog-triage`. Supplies the documented `codemod` command per change.
- `applied_bumps` (object[], required): From `dup-apply-one-bump`. Confirms every `blocked_by` item has landed.

---

## Outputs

- `codemod_log` (object[]): Per item: `order`, `tool`, `command`, `dry_run_files`, `version_commit`, `codemod_commit`, `manual_commit`, `leftovers` (grep hits the codemod did not convert), `test_result`. Also written to `<work_dir>/codemods.json`.

---

## Phase 1: Pick The Exact Codemod And Dry-Run It

### Entry Criteria
- Item has `method == "codemod"`; its `blocked_by` items are in `applied_bumps`; tree clean.

### Actions
1. Take the command from the item's `breaking_changes[].codemod`. Use only commands from this list or from the cited docs; check each with `--help` before running:

| Migration | Command | Dry-run form |
|---|---|---|
| Python syntax modernization | `pyupgrade --py310-plus $(git ls-files '*.py')` | run on a copy branch; pyupgrade rewrites in place and exits 1 when it changed files |
| Python, ruff | `ruff check --select UP --fix .` | `ruff check --select UP --diff .` |
| Django | `django-upgrade --target-version 5.2 $(git ls-files '*.py')` | branch copy; it rewrites in place |
| Pydantic v1 to v2 | `bump-pydantic <package_dir>` | `bump-pydantic --diff <package_dir>` |
| React 19 | `npx codemod@latest react/19/migration-recipe` | the tool shows a diff and asks before applying (check its `--help` for a dry-run flag) |
| React 19 types | `npx types-react-codemod@latest preset-19 ./src` | interactive prompts list transforms |
| Next.js | `npx @next/codemod@latest <transform> <path>` | `--dry --print` |
| Angular | `ng update @angular/core@<N> @angular/cli@<N>` (runs schematic migrations) | `ng update ... --dry-run` |
| Generic JS | `npx jscodeshift -t <transform> <paths>` | `--dry --print` |
| ESLint flat config | `npx @eslint/migrate-config .eslintrc.json` | writes a new `eslint.config.mjs`; review it |
| Spring Boot / Java | `./mvnw -U org.openrewrite.maven:rewrite-maven-plugin:run -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE -Drewrite.activeRecipes=<recipe>` | same with goal `dryRun`; patch in `target/rewrite/rewrite.patch` |
| Go | `go fix ./...` | `go fix -diff ./...` (check `go help fix` for your Go version) |
| Rust edition | `cargo fix --edition` then edit `edition` in `Cargo.toml` | `cargo fix --edition --allow-dirty` on a branch |

2. Install the target version of the package first, using the `dup-apply-one-bump` command table, and commit it even if the build is red: `git commit -am "deps: bump <name> <from> -> <to> (pre-codemod, build red)"` only if the user allows a red intermediate commit; otherwise leave the version change uncommitted so it lands in the Phase 2 commit.
3. Run the dry-run form. Save it to `<work_dir>/codemod-<order>.diff`. Record the list of files it would change as `dry_run_files`.

### Output
Dry-run diff and file list.

### Quality Gate
- The dry-run diff file exists and lists at least one file, or the item is recorded as "codemod found nothing" (then manual fixes only).

---

## Phase 2: Apply And Commit The Mechanical Change

### Entry Criteria
- Dry run reviewed; no file outside the repository's source tree is listed (no `node_modules`, `vendor`, generated code).

### Actions
1. Run the apply form of the same command, limited to the same paths as the dry run.
2. Run the project's formatter on the changed files only (`ruff format <files>`, `black <files>`, `npx prettier --write <files>`, `gofmt -w <files>`, `cargo fmt`, `./mvnw spotless:apply` if configured). Do not reformat unrelated files.
3. Commit: `git add -A && git commit -m "refactor: apply <tool> <recipe> for <name> <to> (automated)"`. This commit contains only codemod output plus formatting.
4. Compare `git diff HEAD~1 --name-only` with `dry_run_files`; any extra file must be explained or reverted.

### Output
`codemod_commit`.

### Quality Gate
- The commit's file list equals `dry_run_files` (plus the version change if staged together).

---

## Phase 3: Finish By Hand And Prove It

### Entry Criteria
- Codemod commit exists.

### Actions
1. Find leftovers: for each `breaking_changes` record of this item, rerun its grep from `evidence`. Remaining hits are `leftovers`. Also grep for markers some codemods leave (for example `TODO`, `FIXME` lines added in the codemod commit: `git show <codemod_commit> | grep -nE '^\+.*(TODO|FIXME)'`).
2. Fix leftovers by hand, only in files with hits, using the documented replacement. Commit separately: `git commit -am "fix: manual migration for <name> <to>"`.
3. Run `build_command` and the full `test_command`; compare to the baseline exactly as in `dup-apply-one-bump` Phase 3 (behavior-change failures block; never edit assertions).
4. Record `test_result` and write `<work_dir>/codemods.json`.

### Output
`codemod_log`.

### Quality Gate
- All `evidence` greps return zero hits, or each remaining hit is listed with a reason.
- Test failures equal the baseline.

---

## Worked Example

Illustrative only. Plan item 5: `pydantic 1.10.17 -> 2.9.2`, codemod `bump-pydantic` (named in the Pydantic migration guide).

- Phase 1: `uv add "pydantic>=2.9.2,<3"` staged. `bump-pydantic --diff app` prints changes in 14 files (`class Config:` to `model_config = ConfigDict(...)`, `@validator` to `@field_validator`).
- Phase 2: `bump-pydantic app`; `ruff format` on the 14 files; commit `7a3e9f0`; `git diff HEAD~1 --name-only` lists the 14 files plus `pyproject.toml`, `uv.lock`.
- Phase 3: grep `\.dict\(` still finds `app/api/orders.py:88` (the guide says `.model_dump()`); fixed by hand, commit `b9c1d02`. `uv run pytest -q`: same 2 pre-existing failures.

---

## Exit Criteria

DONE when every `codemod` item has a version commit, a separate automated commit, any manual-fix commit, no unexplained leftovers, and tests equal to the baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Codemod named in docs no longer exists or changed its CLI | **Adjust**: read the tool's README for the current command; record the change. Do not guess a recipe name. |
| Phase 2 | Codemod touches generated or vendored files | **Retry**: rerun limited to source paths; revert the generated files. |
| Phase 3 | Tests fail on behavior the codemod changed | **Return**: block the item with the failing assertions; do not edit tests. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
