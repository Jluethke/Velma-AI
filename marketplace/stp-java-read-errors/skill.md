# Read javac, Surefire and Gradle Test Output Correctly

**One-line description:** Reads a failing Maven or Gradle run by its format (`[ERROR] /path/File.java:[line,col] message` with `symbol:`/`location:` lines, Surefire `Tests run/Failures/Errors` counts and report files, Gradle `Class > method() FAILED`, `Caused by:` chains), separates assertion failures from exceptions, maps the message to a cause class with a fixed table, and names the single next action.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `verify_result` (object, required): From `stp-run-verify-capture`, with `all_passed` false.
- `applied_edit` (object, required): From `stp-apply-one-edit`.

---

## Outputs

- `java_error_diagnosis` (object): `{ "kind": "compile"|"test_failure"|"test_error"|"static_check"|"build", "message": str, "location": "file:line", "in_edited_hunk": bool, "cause_class": "EDIT_TEXT_WRONG"|"API_WRONG"|"PLAN_WRONG"|"TEST_SELECTOR_WRONG"|"ENVIRONMENT"|"EXPECTED_INTERMEDIATE", "evidence_lines": [str], "next_action": str }`.

---

## Phase 1: Parse by Output Kind

### Entry Criteria
- At least one run in `verify_result.runs` has a non-zero exit code, or L1 printed `Tests run: 0` / `No tests found`.

### Actions
1. Open the log of the first failing run.
2. Identify the kind:

| Kind | What it looks like | Read |
|---|---|---|
| compile (Maven) | `[ERROR] /work/slugj/core/src/main/java/com/acme/Slug.java:[14,32] cannot find symbol` then `  symbol:   method stripAccents(java.lang.String)` and `  location: class com.acme.Slug` | file, `[line,col]`, message, symbol, location |
| compile (Gradle) | `/work/.../Slug.java:14: error: cannot find symbol` then the source line, a `^` caret, `symbol:` and `location:` | same |
| test failure | Surefire `[ERROR] Failures:` then `[ERROR]   SlugTest.stripsAccents:21 expected: <creme-brulee> but was: <crme-brle>`; Gradle `SlugTest > stripsAccents() FAILED` then `org.opentest4j.AssertionFailedError at SlugTest.java:21` | test, line, expected, actual |
| test error | Surefire `[ERROR] Errors:` then `SlugTest.stripsAccents:21 » NullPointer ...` | exception class and line |
| static check | Spotless `The following files had format violations`; Checkstyle `[WARN]/[ERROR] File.java:[12,5] (category) RuleName: message` | file, line, rule |
| build | `Could not resolve dependencies`, `Could not find artifact`, `401 Unauthorized`, `Unsupported class file major version` | the first such line |

3. Surefire's console output is abbreviated. For the full stack trace, read `<module>/target/surefire-reports/<fully.qualified.TestClass>.txt`. Gradle: `<module>/build/test-results/test/TEST-<fully.qualified.TestClass>.xml` (the `<failure>` element holds the trace).
4. Stack traces with `Caused by:` chains: the LAST `Caused by:` is the root cause. Within it, the first `at` line inside a `com.acme...` (repo) package is the location; skip `org.junit`, `java.base`, `jdk.internal`, `sun.reflect` frames.
5. Failure versus error: in JUnit counts, a "Failure" is an assertion that did not hold; an "Error" is an unexpected exception. They lead to different table rows.
6. Set `in_edited_hunk` (file is `applied_edit.file`, line inside the new-line range of the `@@` header).

### Output
`kind`, `message`, `location`, `in_edited_hunk`.

### Quality Gate
- `message` is a line found by `rg -n -F` in the run log or the named report file.
- `location` is a repo source file, not a JDK or JUnit class.

---

## Phase 2: Classify the Cause

### Entry Criteria
- Phase 1 done.

### Actions
1. Apply the first matching row:

| Signal | `cause_class` | `next_action` |
|---|---|---|
| `';' expected`, `illegal start of expression`, `class, interface, enum, or record expected` | EDIT_TEXT_WRONG | revert; fix syntax at the caret |
| `cannot find symbol` with `symbol: variable x` or `class X` that is repo-local or needs an import | EDIT_TEXT_WRONG | revert; add the import edit |
| `cannot find symbol` with `symbol: method m(...)` and `location:` a library class | API_WRONG | revert; send to `stp-java-api-exists-check` |
| `package x.y does not exist` | ENVIRONMENT if `x.y` is a library not on the classpath; EDIT_TEXT_WRONG if a typo | revert |
| `method m in class C cannot be applied to given types;` with `required:` and `found:` lines | API_WRONG | revert; use the `required:` list |
| `incompatible types: A cannot be converted to B` | API_WRONG if B is a library return type, else PLAN_WRONG | revert |
| `unreported exception X; must be caught or declared to be thrown` | PLAN_WRONG | revert; add handling for the checked exception the `javap` line declared |
| `non-static method m() cannot be referenced from a static context` | API_WRONG | revert; call it on an instance |
| test Failure matching `expected_signal` | EXPECTED_INTERMEDIATE | keep |
| test Failure not predicted, or test Error at a frame in the hunk | PLAN_WRONG | revert; re-read the code at `location` |
| `Tests run: 0`, `No tests matching pattern`, `No tests found for given includes` | TEST_SELECTOR_WRONG | fix `-Dtest=` / `--tests` on the card |
| Spotless or Checkstyle violation on a line you added | EDIT_TEXT_WRONG | revert; fix the reported rule on that line only |
| dependency resolution or `Unsupported class file major version` | ENVIRONMENT | revert; stop |

2. Copy two to five proving lines into `evidence_lines`.
3. Do not "fix" by adding `@Disabled`, `@SuppressWarnings`, `-DskipTests`, `-Dmaven.test.failure.ignore=true`, catching `Exception` and ignoring it, or changing the assertion's expected value.

### Output
`java_error_diagnosis`.

### Quality Gate
- `cause_class` is one table value and the row's signal text is in `evidence_lines`.
- `next_action` contains none of `@Disabled`, `@SuppressWarnings`, `skipTests`, `failure.ignore`.

---

## Worked Example

Illustrative only.

E3 on `core/src/main/java/com/acme/Slug.java` called `Normalizer.normalize(s, "NFKD")`. L0 log:

```
[ERROR] /work/slugj/core/src/main/java/com/acme/Slug.java:[15,26] incompatible types: java.lang.String cannot be converted to java.text.Normalizer.Form
[INFO] 1 error
exit=1
```

- Phase 1: `kind` compile, `location` `core/src/main/java/com/acme/Slug.java:15`, inside the hunk.
- Phase 2: API_WRONG (`Normalizer.normalize` takes `Normalizer.Form`, as the `javap` line showed); `next_action` "revert E3; re-apply the locked text that passes `Normalizer.Form.NFKD`".

---

## Exit Criteria

DONE when the diagnosis names the output kind, the first message, a repo location (from the log or report file), whether it is in the edited hunk, one table cause class with evidence, and one next action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Console shows only `There are test failures` | **Adjust**: read the Surefire `.txt` report or the Gradle XML result for the class. |
| Phase 1 | Gradle hides the trace | **Retry**: re-run L1 once with `--info` (or `--stacktrace` for build errors) and read again. |
| Phase 2 | No row matches | **Return**: `PLAN_WRONG` with the first message. |
| Phase 2 | Error in a file the edit did not touch | **Return**: `in_edited_hunk` false; baseline comparison happens next. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
