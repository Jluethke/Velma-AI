# Change-Impact Listing and Edit Plan

**One-line description:** Turns the confirmed call graph into a written list of every file, public interface, test, schema, config and consumer the ticket will touch, rates each by a fixed risk table, and orders the work as a sequence of single-file edits small enough to verify one at a time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `confirmed_call_graph` (object, required): Output of `tkt-lsp-reference-trace`.
- `acceptance_criteria` (object[], required): Output of `tkt-acceptance-criteria-gwt`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.

---

## Outputs

- `impact_list` (object[]): One row per affected item: path, kind (code, test, schema/migration, config, docs, public API, generated), change type (add, modify, delete), risk class, reason with the graph edge or acceptance criterion id.
- `edit_plan` (object[]): Ordered steps; each step names one file, the intended change in one sentence, the acceptance criterion it serves, and the test command that verifies it.

---

## Phase 1: List Everything Touched

### Entry Criteria
- `confirmed_call_graph` exists.

### Actions
1. For each acceptance criterion, name the graph node(s) whose behavior must change. Those files are `modify` rows.
2. For each node you will change, add every caller from the graph as a row of kind code with change type `review` if its signature or return type changes, since callers must be checked.
3. Add rows for each of these that applies, found with the commands shown:
   - Tests referencing changed symbols: from `confirmed_call_graph` test list.
   - Database schema: `rg -n -l 'CREATE TABLE|ALTER TABLE|op.add_column|migrations\.' ` and the migrations folder (`alembic/versions`, `migrations/`, `db/migrate`, `prisma/migrations`, `ent/migrate`, `sqlx` `migrations/`).
   - Public API surface: OpenAPI/Swagger files (`openapi.yaml`, `swagger.json`), GraphQL schema (`*.graphql`), protobuf (`*.proto`), exported package symbols (Go capitalized names, Rust `pub` items in `lib.rs`, `exports` in `package.json`, `__all__` in Python).
   - Config and feature flags: env var names (`rg -n 'os.environ|os.getenv|process.env|os.Getenv|std::env::var'`), config files.
   - Docs and changelog: `CHANGELOG.md`, `docs/`.
   - Generated files: anything with a "DO NOT EDIT" or "generated" header (`rg -l 'Code generated .* DO NOT EDIT|@generated'`). Record the generator command instead of editing the output.
   - CODEOWNERS owners for each path: read `repo_profile.codeowners_path` and match the path patterns.

### Output
Draft `impact_list`.

### Quality Gate
- Every acceptance criterion id appears in at least one row's reason.
- Every caller of a changed signature appears as a row.

---

## Phase 2: Rate Risk

### Entry Criteria
- Draft `impact_list` exists.

### Actions
1. Assign each row exactly one risk class with this table (first matching row wins):

| Condition | Risk class | Required extra action |
|---|---|---|
| Schema migration, data backfill, or deletion of stored data | HIGH-DATA | Migration must be reversible or the PR must state why not; test on a copy of the schema. |
| Change to a public API, wire format, CLI flag, or exported symbol used outside this repo | HIGH-CONTRACT | Keep the old form working or record the breaking change for the commit footer `BREAKING CHANGE:`. |
| Auth, permissions, payment, or crypto code | HIGH-SECURITY | Request a reviewer from CODEOWNERS for that path. |
| Edge marked `rg-only` in the graph | MEDIUM-UNSEEN | Add a test that exercises the dynamic path. |
| Internal function with callers all in this repo | LOW | Normal tests. |
| Test, docs, changelog | LOW | none |

2. If any row is HIGH-DATA or HIGH-CONTRACT and the ticket did not mention it, post a question to the ticket owner before coding.

### Output
`impact_list` with risk classes.

### Quality Gate
- Every row has exactly one risk class from the table.
- Every HIGH row has its required extra action written down.

---

## Phase 3: Order the Edits

### Entry Criteria
- Rated `impact_list`.

### Actions
1. Build `edit_plan` with one file per step. Order: (1) tests that encode acceptance criteria (they fail first), (2) leaf code with no callers changed (data types, pure functions), (3) code that calls the leaves, (4) entry points and wiring (routes, CLI), (5) migrations and config, (6) docs and changelog.
2. Each step names the test command that verifies it, using `test_single` from the stack baseline report. For docs and changelog steps, the verifying command is `git diff --name-only`, which must print only that file. A code step with no verifying test gets a test step added before it.
3. If a step would change a signature used in many files, split it: step A adds the new form beside the old one, step B moves callers, step C removes the old form. Each step keeps the build green.
4. Count steps. Do not combine steps to make the plan look shorter; weak models fail most often by editing many files in one go and then not knowing which edit broke the build.

### Output
`impact_list`, `edit_plan`.

### Quality Gate
- Every `edit_plan` step names exactly one file and one verifying command.
- Every `modify` or `add` row in `impact_list` appears in some `edit_plan` step.

---

## Worked Example

Illustrative only. Ticket PAY-412 (CSV export with currency column).

`impact_list` (excerpt):
```
src/billing/services/invoice_service.py  code   modify  LOW            AC2 list_for_export must return currency
src/billing/api/responses.py             code   modify  MEDIUM-UNSEEN  csv_response also used by reports.py:67
src/billing/api/reports.py               code   review  LOW            caller of csv_response
src/billing/api/routes.py                code   modify  LOW            AC5 status filter param
openapi.yaml                             api    modify  HIGH-CONTRACT  new query param ?status
tests/api/test_export.py                 test   add     LOW            AC1-AC5
CHANGELOG.md                             docs   modify  LOW
```

`edit_plan`:
```
1 tests/api/test_export.py         add AC1-AC5 tests (expected to fail)   uv run pytest tests/api/test_export.py
2 src/billing/services/invoice_service.py  return currency field       uv run pytest tests/services/test_invoice_service.py
3 src/billing/api/responses.py     add optional columns argument, default unchanged   uv run pytest tests/api -k csv
4 src/billing/api/routes.py        pass status filter, columns         uv run pytest tests/api/test_export.py
5 openapi.yaml                     document ?status                    uv run pytest tests/test_openapi.py
6 CHANGELOG.md                     add Unreleased entry                git diff --name-only (prints only CHANGELOG.md)
```

---

## Exit Criteria

DONE when every affected path is in `impact_list` with a risk class, every HIGH row has its extra action recorded, and `edit_plan` is a sequence of single-file steps each with a verifying command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A needed file is generated | **Adjust**: list the generator input and command (for example `buf generate`, `go generate ./...`, `openapi-generator`), never hand-edit output. |
| Phase 2 | Unmentioned HIGH-DATA or HIGH-CONTRACT change | **Stop**: ask the ticket owner; scope may need a separate ticket. |
| Phase 3 | A step has no test to verify it | **Adjust**: add a test step before it, or merge it into the next verifiable step. |
| Phase 3 | Plan exceeds what one PR should hold by the repo's stated PR size guidance | **Return**: propose splitting the ticket; if the repo states no guidance, ask the owner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
