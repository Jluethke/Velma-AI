# Restate the Goal as One Runnable Check

**One-line description:** Turns a free-text coding request into exactly one shell command plus the exact output that proves the goal is met, and writes down what is out of scope, so a small model always knows what "done" means before it touches a file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `task_request` (string, required): The request as the user wrote it, copied verbatim (bug report, feature ask, failing CI log, error message).
- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): One of `python`, `node`, `go`, `rust`, `java`. Selects the command form used in Phase 2.

---

## Outputs

- `goal_check` (object): `{ "goal_sentence": str, "task_type": str, "command": str, "cwd": str, "pass_signal": {"exit_code": 0, "must_contain": str}, "fail_signal_now": str, "check_exists": bool }`.
- `scope_limits` (object): `{ "in_scope": [str], "out_of_scope": [str], "stop_triggers": [str], "done_definition": str }`.

---

## Phase 1: Extract the Observable Behavior

### Entry Criteria
- `task_request` is non-empty.
- `repo_path` exists and contains a project manifest (`pyproject.toml`, `setup.py`, `package.json`, `go.mod`, `Cargo.toml`, `pom.xml` or `build.gradle(.kts)`).

### Actions
1. Copy `task_request` into your notes unchanged. Do not paraphrase it yet.
2. Write one sentence in this exact form: "When `<input or action>`, the program should `<observable result>`, but today it `<current result or 'does not exist'>`." Fill every slot from the request text. If a slot cannot be filled from the text, write `UNKNOWN` in it.
3. Classify the request with this table. Pick the first row that matches, top to bottom.

| If the request says... | `task_type` | The check is... |
|---|---|---|
| an error message, stack trace, wrong output, "returns X instead of Y" | `bug` | a test that reproduces the wrong behavior and fails today |
| "add", "support", "new function/endpoint/flag" | `feature` | a test that calls the new thing and fails today (missing name or wrong result) |
| "build fails", "does not compile", a compiler or type error | `build` | the build or typecheck command, which exits non-zero today |
| a linter or formatter complaint | `lint` | the exact lint command on the named file, non-zero today |
| "rename", "move", "clean up", "refactor" with no behavior change | `refactor` | the existing test command for the touched package, which passes today and must still pass with the same test count |
| none of the above | `unclear` | no check yet; go to Phase 3 and record a stop trigger |

4. If any slot in the sentence is `UNKNOWN` and `task_type` is `bug` or `feature`, search the request for a literal value (a string in quotes, a number, a file name). If there is none, set `task_type` to `unclear`.

### Output
`goal_sentence` and `task_type`.

### Quality Gate
- `goal_sentence` contains the words "When", "should" and "but today".
- `task_type` is one of `bug`, `feature`, `build`, `lint`, `refactor`, `unclear`.

---

## Phase 2: Write the One Check Command

### Entry Criteria
- `task_type` is not `unclear`.

### Actions
1. Look for an existing test that already covers the behavior: run `rg -n -i "<key word from goal_sentence>" <test dir>` (test dirs: `tests/` or `test/` for Python, `*.test.ts`/`*.spec.ts`/`__tests__/` for Node, `*_test.go` for Go, `tests/` or `#[cfg(test)]` blocks for Rust, `src/test/java/` for Java). Set `check_exists` to true only if a test asserts the exact expected value.
2. Build the command in the form for `stack`. Use the narrowest selector that names one test:

| `stack` | Single-test command form |
|---|---|
| `python` | `python -m pytest tests/test_slug.py::test_accents -q` |
| `node` (vitest) | `npx vitest run src/price.test.ts -t "formats zero"` |
| `node` (jest) | `npx jest src/price.test.ts -t "formats zero"` |
| `go` | `go test ./internal/slug -run '^TestAccents$' -count=1 -v` |
| `rust` | `cargo test -p slugkit accents -- --exact` (the filter is the full test path, for example `tests::accents`) |
| `java` (Maven) | `./mvnw -q test -Dtest=SlugTest#accents` |
| `java` (Gradle) | `./gradlew test --tests 'com.acme.SlugTest.accents'` |

3. For `build` and `lint`, the command is the build, typecheck or lint command that the request quotes, scoped to the named file or package.
4. If no test exists yet (`check_exists` false), the command names the test you will create (file path and test name), and `fail_signal_now` is the failure you expect before any code change: "test not found / collected 0" until the test is written, then an assertion failure.
5. Fill `pass_signal`: `exit_code` is 0 and `must_contain` is a literal string the tool prints on success for that one test (pytest `1 passed`, vitest/jest `1 passed`, go `--- PASS: TestAccents`, cargo `test result: ok. 1 passed`, Maven `Tests run: 1, Failures: 0, Errors: 0`, Gradle `BUILD SUCCESSFUL`).
6. Set `cwd` to `repo_path` unless the project manifest is in a subdirectory; then set it to that subdirectory.

### Output
Complete `goal_check`.

### Quality Gate
- `command` is a single line that starts with a real executable (`python`, `npx`, `go`, `cargo`, `./mvnw`, `mvn`, `./gradlew`, `gradle`, `npm`, `pnpm`, `yarn`).
- `command` selects one test or one file, not the whole suite (except `task_type` `refactor`).
- `pass_signal.must_contain` is a literal string, not a description.

---

## Phase 3: Write the Scope Limits and Stop Triggers

### Entry Criteria
- `goal_check` exists, or `task_type` is `unclear`.

### Actions
1. `in_scope`: list the file or directory names mentioned in `task_request`, plus the test file named in `goal_check.command`.
2. `out_of_scope`: always include these lines verbatim:
   - "Deleting, skipping or loosening any existing test."
   - "Adding or upgrading dependencies."
   - "Reformatting files that the goal does not require."
   - "Changing CI, lint or type-checker configuration."
3. `stop_triggers`: always include these lines verbatim, plus any that apply from the request:
   - "`task_type` is `unclear`."
   - "The fix needs credentials, network access, a database migration, or a new dependency."
   - "The same error text appears after two consecutive attempts on the same edit."
   - "The fix needs a file outside `in_scope` that is not a direct caller or callee of the target."
4. `done_definition`: write "`<command>` exits 0 and prints `<must_contain>`, and every command in the verify card that passed at baseline still passes."
5. If `task_type` is `unclear`, set `goal_check.command` to empty and return the sentence with its `UNKNOWN` slots as the question for the user.

### Output
`scope_limits`.

### Quality Gate
- `out_of_scope` contains the four fixed lines.
- `stop_triggers` contains the four fixed lines.
- `done_definition` contains the literal command string from `goal_check`.

---

## Worked Example

Illustrative only.

Input: `task_request` = "slugify('Crème Brûlée') returns 'crme-brle', it should be 'creme-brulee'", `stack` = `python`, `repo_path` = `/work/slugkit`.

- Phase 1: `goal_sentence` = "When slugify is called with 'Crème Brûlée', the program should return 'creme-brulee', but today it returns 'crme-brle'." `task_type` = `bug`.
- Phase 2: `rg -n -i "accent|brulee" tests/` prints nothing, so `check_exists` = false. `command` = `python -m pytest tests/test_slugify.py::test_strips_accents -q`. `fail_signal_now` = "ERROR: not found: .../test_slugify.py::test_strips_accents" until the test is written, then `AssertionError: assert 'crme-brle' == 'creme-brulee'`. `pass_signal` = exit 0, contains `1 passed`.
- Phase 3: `in_scope` = [`slugkit/core.py`, `tests/test_slugify.py`]. `done_definition` = "`python -m pytest tests/test_slugify.py::test_strips_accents -q` exits 0 and prints `1 passed`, and every command in the verify card that passed at baseline still passes."

---

## Exit Criteria

DONE when `goal_check.command` is one runnable line with a literal pass string, and `scope_limits` lists the fixed out-of-scope items and stop triggers; or when `task_type` is `unclear` and the open question is returned.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No project manifest under `repo_path` | **Stop**: report the path checked and ask for the correct root. |
| Phase 1 | Request names two unrelated goals | **Adjust**: keep the first goal; list the second in `out_of_scope` as a separate task. |
| Phase 2 | No test framework is configured | **Adjust**: use a one-line script check (`python -c "..."`, `node -e "..."`) whose output is compared to a literal string. |
| Phase 2 | The test selector syntax is uncertain | **Adjust**: run the runner's `--help` and copy the selector form it documents; never guess. |
| Phase 3 | `task_type` is `unclear` | **Return**: the sentence with `UNKNOWN` slots as the question to the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
