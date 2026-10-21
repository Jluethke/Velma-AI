# TDD Test Naming Per Runner

**One-line description:** Gives every behavior row a test file path and test name that states the behavior, follows the runner's discovery rules exactly, and can be selected alone from the command line.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `behavior_list` (object[], required): Ordered rows from `tdd-behavior-list` (id, behavior, given, when, then).
- `test_runner` (string, required): One of `pytest`, `unittest`, `jest`, `vitest`, `go-test`, `cargo-test`, `junit5`.

---

## Outputs

- `test_names` (object[]): One row per behavior: `behavior_id`, `test_file`, `test_name` (exact identifier or string), `select_command` (command that runs only this test).

---

## Phase 1: Apply the Runner's Discovery Rules

### Entry Criteria
- `behavior_list` has at least one row.
- `test_runner` is one of the seven values above.

### Actions
1. Look up the discovery rules for `test_runner`. A test that breaks these rules is silently never run.

| test_runner | File must match (default) | Test must be |
|---|---|---|
| pytest | `test_*.py` or `*_test.py` (`python_files` default) | function named `test_*`, or method `test_*` in a class named `Test*` that has no `__init__` |
| unittest | `test*.py` (`discover -p` default) | method named `test*` in a subclass of `unittest.TestCase`; the folder needs `__init__.py` to be importable |
| jest | inside `__tests__/`, or `*.test.js`, `*.spec.ts` and similar (`testMatch` default) | `test("...")` or `it("...")`, grouped by `describe("...")` |
| vitest | `**/*.{test,spec}.?(c\|m)[jt]s?(x)` (`include` default) | `test`/`it` inside `describe`, imported from `vitest` unless `globals: true` |
| go-test | `*_test.go` in the same package directory | `func TestXxx(t *testing.T)` where Xxx does not start with a lowercase letter; cases as `t.Run("name", ...)` |
| cargo-test | unit tests in `#[cfg(test)] mod tests` in the source file; integration tests in `tests/*.rs` | `#[test] fn snake_case_name()` |
| junit5 | class name matching Surefire defaults `**/Test*.java`, `**/*Test.java`, `**/*Tests.java`, `**/*TestCase.java` | method annotated `@Test` (from `org.junit.jupiter.api`, NOT `org.junit.Test`) |

2. If the project already has tests, open two existing test files and copy their folder layout and naming. Existing convention wins over this table when it still matches the runner's discovery pattern.

### Output
Chosen file path pattern per unit under test.

### Quality Gate
- Every planned file path matches the discovery pattern in the table row for `test_runner`.
- For junit5, the planned import is `org.junit.jupiter.api.Test`.

---

## Phase 2: Write Behavior Names

### Entry Criteria
- File pattern chosen.

### Actions
1. Name each test with the pattern `<unit>_<condition>_<expected result>` (Roy Osherove's UnitOfWork_StateUnderTest_ExpectedBehavior), translated to the runner's style:

| test_runner | Shape | Example for B04 "rejects 21 characters" |
|---|---|---|
| pytest / unittest | snake_case function | `test_validate_username_with_21_chars_returns_too_long` |
| jest / vitest | `describe("<unit>")` + `it("<condition> -> <result>")` sentence | `describe("validateUsername")`, `it("returns too_long for 21 characters")` |
| go-test | `TestUnit_Condition` or one `TestUnit` with subtest names | `TestValidateUsername/21_chars_returns_too_long` |
| cargo-test | snake_case | `validate_username_with_21_chars_returns_too_long` |
| junit5 | camelCase method plus optional `@DisplayName` | `validateUsername_21Chars_returnsTooLong` |

2. Do NOT use names like `test1`, `testValidate`, `works`, `should_work`, or the name of the private helper being called. The name says the observable result.
3. Every name must be unique within its file. For Go, a space in a `t.Run` name becomes `_` when matching `-run`, so write subtest names with underscores to avoid confusion.

### Output
Draft `test_names` without commands.

### Quality Gate
- No two rows share the same `test_file` + `test_name`.
- Every name contains a word from the row's `then` field (for example "too_long").

---

## Phase 3: Attach Single-Test Commands

### Entry Criteria
- Draft names exist.

### Actions
1. Fill `select_command` from this table (paths and names are placeholders to substitute):

| test_runner | Run exactly one test |
|---|---|
| pytest | `python -m pytest tests/test_user.py::test_validate_username_with_21_chars_returns_too_long -q` |
| unittest | `python -m unittest tests.test_user.TestValidateUsername.test_validate_username_with_21_chars_returns_too_long -v` |
| jest | `npx jest src/user.test.ts -t "returns too_long for 21 characters"` |
| vitest | `npx vitest run src/user.test.ts -t "returns too_long for 21 characters"` |
| go-test | `go test ./user -run '^TestValidateUsername$/^21_chars_returns_too_long$' -v` |
| cargo-test | `cargo test validate_username_with_21_chars_returns_too_long -- --exact` (with `--exact` the full path such as `tests::validate_...` is needed for unit tests; without it the name is a substring filter) |
| junit5 (Maven) | `mvn -q test -Dtest=UsernameValidatorTest#validateUsername_21Chars_returnsTooLong` |
| junit5 (Gradle) | `./gradlew test --tests 'com.example.UsernameValidatorTest.validateUsername_21Chars_returnsTooLong'` |

2. Note that `-t` in Jest and Vitest is a regular expression against the full name (`describe` text + test text). Escape `(`, `)`, `.`, `+` and `?` if the name has them.

### Output
`test_names`.

### Quality Gate
- Every row has a `select_command` whose test identifier equals `test_name`.
- Row count of `test_names` equals row count of `behavior_list`.

---

## Worked Example

Illustrative only. `test_runner` = `pytest`, behavior B04 "rejects 21 characters".

Phase 1: file `tests/test_username.py` (matches `test_*.py`).
Phase 2: name `test_validate_username_with_21_chars_returns_too_long`.
Phase 3: `python -m pytest tests/test_username.py::test_validate_username_with_21_chars_returns_too_long -q`

Once the test exists, `python -m pytest --collect-only -q` prints:

```
tests/test_username.py::test_validate_username_with_21_chars_returns_too_long
1 test collected in 0.01s
```

---

## Exit Criteria

DONE when every behavior has one discoverable file path, one behavior-stating name, and one command that runs only that test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `test_runner` not in the supported list | **Stop**: ask for one of the seven values. |
| Phase 1 | Project config overrides discovery (`testpaths`, `testMatch`, `include`, Surefire `<includes>`) | **Adjust**: read the config file and use its patterns instead of the defaults. |
| Phase 2 | A behavior cannot be named without "and" | **Return**: send the row back to `tdd-behavior-list` to be split. |
| Phase 3 | Selector later matches zero tests | **Retry**: run the runner's list command (`pytest --collect-only -q`, `go test -list '.*' ./...`, `cargo test -- --list`) and copy the exact name. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
