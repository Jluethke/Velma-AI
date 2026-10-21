# Extraction Candidate Brief

**One-line description:** Pins down exactly which module is being extracted from the monolith, why, which entry points and tables it touches at first glance, and records a green baseline commit with timed test and build commands so every later step can prove it changed nothing by accident.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the monolith's git working tree.
- `candidate_module` (string, required): The package, directory or namespace to extract, as a repo-relative path (for example `app/billing`, `src/billing`, `internal/billing`, `com.acme.billing`).
- `extraction_goal` (string, required): The concrete problem the extraction must solve, in the owner's words (for example "billing deploys are blocked by catalog release freezes").
- `stack` (string, required): One of `python`, `node`, `go`, `java`. Selects the stack-specific flows later in the chain.
- `database_engine` (string, required): One of `postgres`, `mysql`, `other`. Selects the data-split and change-data-capture flows.

---

## Outputs

- `extraction_brief` (object): `repo_path`, `candidate_module`, `stack`, `database_engine`, `extraction_goal`, `goal_test` (an observable condition that shows the goal is met), `baseline_sha`, `test_command`, `build_command`, `baseline_test_result`, `entry_points` (routes, CLI commands, consumers, scheduled jobs), `first_guess_tables`, `owners`, and `open_questions`.

---

## Phase 1: Confirm the Candidate Exists and Is Stable

### Entry Criteria
- `repo_path` is a git working tree (`git -C "$REPO" rev-parse --is-inside-work-tree` prints `true`).
- `candidate_module` and `stack` are set.

### Actions
1. Run `git -C "$REPO" status --porcelain`. If it prints anything, stop and ask the user to commit or stash. Do not run `git stash` or `git checkout -- .` yourself.
2. Record the baseline commit: `git -C "$REPO" rev-parse HEAD` into `baseline_sha`.
3. Confirm the candidate path exists: `git -C "$REPO" ls-files "$CANDIDATE" | head`. For Java, convert the package to a path first (`com.acme.billing` becomes `src/main/java/com/acme/billing`). If zero files are listed, return to the user with the top-level directory list (`git ls-files | cut -d/ -f1-2 | sort -u`) and ask which one they meant. Do not guess.
4. Count the candidate's size so later steps can be sanity-checked: `git -C "$REPO" ls-files "$CANDIDATE" | wc -l` and `git -C "$REPO" ls-files "$CANDIDATE" | xargs wc -l | tail -1`.
5. Find owners: read `CODEOWNERS`, `.github/CODEOWNERS` or `docs/CODEOWNERS` if present; otherwise run `git -C "$REPO" shortlog -sn --since="1 year ago" -- "$CANDIDATE" | head`.

### Output
Baseline SHA, confirmed candidate path, size and owners.

### Quality Gate
- `git status --porcelain` printed nothing.
- `baseline_sha` is a 40-character hex string.
- The candidate file count is greater than zero.

---

## Phase 2: Record the Green Baseline

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Find the project's own test and build commands. Read them from the repo, do not invent them. Look in this order and stop at the first hit:

   | Stack | Where to look | Typical command found there |
   |---|---|---|
   | python | `Makefile` test target, `tox.ini`, `noxfile.py`, `pyproject.toml` `[tool.pytest.ini_options]`, CI workflow | `pytest -q` |
   | node | `package.json` `scripts.test` and `scripts.build`, CI workflow | `npm test`, `npm run build` |
   | go | `Makefile`, CI workflow | `go build ./...`, `go test ./...` |
   | java | `pom.xml` or `build.gradle(.kts)`, CI workflow | `./mvnw -q verify` or `./gradlew build` |

2. Run the build command, then the test command, with timing: `time <build_command>` and `time <test_command>`. Save the last 50 lines of each output.
3. If tests fail at baseline, record each failing test name in `baseline_test_result.failing` and stop to ask the user whether these are known failures. Do not fix, skip or delete them. Every later step compares against this exact list.
4. Run only the candidate's own tests too, so later steps have a fast loop: python `pytest -q tests/billing`, node `npx jest src/billing` (or the runner in `package.json`), go `go test ./internal/billing/...`, java `./mvnw -q test -Dtest='com.acme.billing.**'` or `./gradlew test --tests 'com.acme.billing.*'`. Record the command that worked.

### Output
`test_command`, `build_command`, `baseline_test_result` with pass count, fail list and wall time.

### Quality Gate
- The build command exited 0.
- `baseline_test_result` contains the test runner's own summary line (for example `412 passed in 83.2s`, `ok  	example.com/app/internal/billing	0.41s`, `Tests run: 230, Failures: 0`).

---

## Phase 3: List Entry Points and First-Guess Tables

### Entry Criteria
- Baseline recorded.

### Actions
1. List how traffic reaches the candidate. Search only inside the candidate path first:

   | Stack | Search command |
   |---|---|
   | python (Django) | `rg -n "path\(|re_path\(" --glob "**/urls.py"` then keep routes whose view lives in the candidate |
   | python (Flask/FastAPI) | `rg -n "@(app|router|bp|blueprint)\.(get|post|put|patch|delete|route)" "$CANDIDATE"` |
   | node (Express/Fastify/Nest) | `rg -n "\.(get|post|put|patch|delete)\(['\"]/|@(Get|Post|Put|Patch|Delete)\(" "$CANDIDATE"` |
   | go | `rg -n "HandleFunc\(|Handle\(|\.(GET|POST|PUT|PATCH|DELETE)\(" "$CANDIDATE"` |
   | java (Spring) | `rg -n "@(Get|Post|Put|Patch|Delete|Request)Mapping" "$CANDIDATE"` |

2. Also list queue consumers, cron or scheduled jobs and CLI commands: `rg -n "@shared_task|@celery|@Scheduled|@KafkaListener|consumer|cron|cobra.Command|click.command" "$CANDIDATE"`.
3. First guess at tables: python `rg -n "__tablename__|db_table" "$CANDIDATE"`, node `rg -n "tableName|@Entity|knex\(['\"]" "$CANDIDATE"`, go `rg -n -i "from [a-z_]+|insert into [a-z_]+|update [a-z_]+" "$CANDIDATE"`, java `rg -n "@Table\(|@Entity" "$CANDIDATE"`. Mark the list as a first guess; `mex-table-ownership-map` produces the authoritative list.
4. Turn `extraction_goal` into `goal_test`: one sentence naming a measurable condition (for example "billing can be deployed while catalog is frozen" or "billing workers scale without scaling web"). If the goal cannot be made observable, record it in `open_questions` and ask the user.

### Output
`extraction_brief`.

### Quality Gate
- `entry_points` lists at least one route, consumer, job or command with file and line, or the brief states that none were found and why.
- `goal_test` is a condition someone can check, or it is listed in `open_questions`.

---

## Worked Example

Illustrative. Input: `repo_path=/srv/shop`, `candidate_module=app/billing`, `stack=python`, `database_engine=postgres`, `extraction_goal="billing changes wait two weeks for the catalog release train"`.

Phase 1:
```
$ git -C /srv/shop status --porcelain
$ git -C /srv/shop rev-parse HEAD
9f1c2e7a4b...
$ git -C /srv/shop ls-files app/billing | wc -l
63
```
Phase 2: `Makefile` has `test: pytest -q`. `time pytest -q` prints `1184 passed, 3 skipped in 141.07s`. Candidate-only loop: `pytest -q tests/billing` prints `212 passed in 9.88s`.

Phase 3: Flask routes found: `app/billing/views.py:14 @bp.post("/invoices")`, `:41 @bp.get("/invoices/<id>")`; Celery task `app/billing/tasks.py:8 @shared_task def send_dunning`. Tables: `invoices`, `invoice_lines`, `payments`. `goal_test`: "a billing-only change reaches production without a catalog release".

---

## Exit Criteria

DONE when `extraction_brief` has a clean `baseline_sha`, a build and test command that were actually run with their summary lines recorded, the entry point list, a first-guess table list and an observable `goal_test` or an open question for it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Working tree is dirty | **Stop**: ask the user to commit or stash; never discard changes. |
| Phase 1 | Candidate path matches no files | **Return**: show the top-level directory list and ask the user to name the path. |
| Phase 2 | No test command can be found in the repo | **Stop**: ask the user; do not invent a command or write a new test runner config. |
| Phase 2 | Baseline tests fail | **Stop**: record the failing names and get the user to confirm they are pre-existing before any extraction work. |
| Phase 3 | Entry point search finds nothing | **Adjust**: widen to the whole repo with the same pattern and filter by imports of the candidate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
