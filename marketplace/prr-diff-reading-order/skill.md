# PR Diff Reading Order

**One-line description:** Orders the files of each review unit so contracts are read before implementations and implementations before callers and tests, using stack-specific path patterns, so the reviewer builds the mental model once instead of reading files alphabetically as the forge shows them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `changed_files` (object[], required): Rename-aware file list (status, old path, new path).
- `review_units` (object[], required): Ordered units from `prr-large-pr-split`.
- `stack` (string, required): `python`, `typescript`, `javascript`, `go`, or `java`. Selects the path patterns below.

---

## Outputs

- `reading_plan` (object[]): One entry per unit: `{ "unit": N, "files": [ { "path": "...", "tier": 1-8, "how": "full|skim|verify-regenerated|skip-rename" } ] }`.

---

## Phase 1: Assign a Tier to Every File

### Entry Criteria
- `changed_files` and `review_units` are present; `stack` is one of the listed values.

### Actions
1. Assign each file a tier with this table. First matching row wins.

| Tier | What | Path patterns (common to all stacks) |
|---|---|---|
| 1 | Contracts and schemas | `*.proto`, `openapi*.y*ml`, `openapi*.json`, `*.graphql`, `*.avsc`, `*.sql` under `migrations/`, `alembic/versions/`, `db/migrate/` |
| 2 | Public types and interfaces | see stack table |
| 3 | Core logic | remaining source files not in tiers 2, 4, 5 |
| 4 | Wiring and entry points | see stack table |
| 5 | Tests | see stack table |
| 6 | Config, CI and infra | `.github/workflows/*`, `.gitlab-ci.yml`, `Dockerfile*`, `*.tf`, `*.yaml` under `k8s/` or `deploy/`, `.env.example` |
| 7 | Docs | `*.md`, `docs/**`, `*.rst` |
| 8 | Generated and lockfiles | lockfiles, `*.pb.go`, `*_pb2.py`, `*.generated.*`, `__snapshots__/` |

2. Stack-specific patterns for tiers 2, 4 and 5:

| `stack` | Tier 2 (types and interfaces) | Tier 4 (wiring) | Tier 5 (tests) |
|---|---|---|---|
| python | `**/types.py`, `**/models.py`, `**/schemas.py`, `*.pyi`, `**/protocols.py` | `**/urls.py`, `**/routes.py`, `**/__main__.py`, `**/cli.py`, `settings*.py` | `test_*.py`, `*_test.py`, `tests/**`, `conftest.py` |
| typescript, javascript | `*.d.ts`, `**/types.ts`, `**/types/**`, `**/interfaces/**` | `**/routes/**`, `**/index.ts`, `**/main.ts`, `**/app.ts`, `**/server.ts` | `*.test.ts`, `*.spec.ts`, `*.test.js`, `*.spec.js`, `__tests__/**`, `e2e/**` |
| go | files that declare only `type ... interface` or exported structs (check with `rg -n '^type .* (interface|struct)' <file>`) | `cmd/**/main.go`, `**/router.go`, `**/wire.go` | `*_test.go`, `testdata/**` |
| java | `**/api/**`, `**/dto/**`, `**/model/**`, files with `public interface` | `**/*Application.java`, `**/config/**`, `**/*Controller.java` | `src/test/**` |

3. Set `how` per file:

| Condition | `how` |
|---|---|
| Status `R100` | skip-rename (contents unchanged) |
| Tier 8 | verify-regenerated |
| Tier 7 or 6 with only version bumps | skim |
| Everything else | full |

### Output
Tier and `how` for every file.

### Quality Gate
- Every path in `changed_files` has one tier and one `how` value.
- No file in tier 8 has `how` = full.

---

## Phase 2: Build the Plan per Unit

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. For each unit in `review_units` order, list its files sorted by tier ascending, then by path.
2. Exception: if the PR description states no acceptance criteria (the intent flow recorded a `question` finding for missing intent), move tier 5 directly after tier 2 in every unit. Tests then serve as the executable specification of what the change is meant to do.
3. For every tier 8 file add the command that proves it was regenerated and not hand-edited, for example: Python lock `uv lock --check` or `poetry check --lock`; npm `npm install --package-lock-only` then `git diff --exit-code package-lock.json`; Go `go mod tidy` then `git diff --exit-code go.mod go.sum`; protobuf `buf generate` then `git diff --exit-code`. Check each tool's `--help` for the exact flag on the installed version.
4. For R100 renames, add the command `git diff -M --name-status` row as evidence and skip the body.

### Output
`reading_plan`.

### Quality Gate
- `reading_plan` lists every unit and every file exactly once.
- Every tier 8 entry has a verify command.

---

## Worked Example

Illustrative. `stack=python`, one unit, files:
```
M  api/routes.py
M  api/orders/service.py
A  api/orders/schemas.py
A  migrations/0042_order_status.sql
M  tests/orders/test_service.py
M  poetry.lock
R100 api/util.py api/common/util.py
```
- Phase 1: `migrations/0042_order_status.sql` tier 1; `schemas.py` tier 2; `service.py` tier 3; `routes.py` tier 4; `test_service.py` tier 5; `poetry.lock` tier 8 verify-regenerated; `api/common/util.py` skip-rename.
- Phase 2: plan order: migration, schemas, service, routes, tests, lockfile (verify with `poetry check --lock`), rename (skip).

---

## Exit Criteria

DONE when each review unit has an ordered file list with a tier and reading mode per file, and every generated file has a regeneration check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` not in the table | **Adjust**: use only the common tiers 1, 3, 6, 7, 8 and mark every other file tier 3. |
| Phase 1 | A file matches no pattern | **Adjust**: tier 3 (core logic); read it in full. |
| Phase 2 | Regeneration tool not installed | **Adjust**: mark the file `full` and read it, noting the tool was unavailable. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
