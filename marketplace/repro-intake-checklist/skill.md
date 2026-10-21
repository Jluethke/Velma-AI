# Bug Report Intake and Missing-Info Checklist

**One-line description:** Turns a raw bug report (issue text, chat message, crash dump, screenshot transcript) into a structured bug brief with expected versus actual behavior, exact trigger, and a named list of every fact still missing, so nobody starts debugging a bug that was never pinned down.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bug_report` (string, required): The report exactly as received: issue body, comments, attached logs, stack traces, and any reporter replies. Paste verbatim; do not paraphrase.
- `repo_path` (string, required): Absolute path to a local clone of the affected repository.

---

## Outputs

- `bug_brief` (object): Structured brief with fields `title`, `observed`, `expected`, `trigger_steps` (numbered list), `failing_input` (literal data, file path, or request), `error_signature` (exception type plus top in-project frame, or exit code, or wrong value), `reported_version`, `reported_environment`, `frequency` (as reported), `severity_class`, `is_regression_claim` (yes, no, unknown) and `source_quotes` (the report lines each field came from).
- `missing_info` (object[]): One row per missing fact: `field`, `why_needed`, `exact_question` to send the reporter, and `blocking` (true when reproduction cannot start without it).

---

## Phase 1: Extract Facts Verbatim

### Entry Criteria
- `bug_report` is non-empty.
- `repo_path` exists and contains a `.git` directory (`git -C <repo_path> rev-parse --is-inside-work-tree` prints `true`).

### Actions
1. Copy every stack trace, error message, log line, command line and version string from `bug_report` into `source_quotes` character for character. Keep line breaks.
2. Fill `observed` with what the reporter saw, quoting them. Fill `expected` with what they say should have happened. If the report gives no expected behavior, leave `expected` empty and add a `missing_info` row; do not guess it.
3. Fill `trigger_steps` as a numbered list of user actions or commands in order. One action per line.
4. Fill `error_signature` using this table:

| Report contains | `error_signature` value |
|---|---|
| Python traceback | Last line (exception type and message) plus the deepest frame whose file path is inside `repo_path` |
| Node.js / JavaScript stack | `Error` class and message plus the first `at` line that points into the repo (not `node_modules`, not `node:internal`) |
| Go panic | The `panic:` line plus the first `goroutine N [running]:` frame inside the module path from `go.mod` |
| Java / Kotlin exception | Exception class and message plus the first `at` frame in the project package, and every `Caused by:` line |
| Rust panic | The `thread '...' panicked at <file>:<line>:<col>` line and message |
| C / C++ crash | Signal name (SIGSEGV, SIGABRT, SIGFPE), and the first frame with a source file from a backtrace if attached |
| Wrong value, no crash | The literal wrong output and the literal expected output |
| Hang | The command that hangs and how long the reporter waited, as reported |

5. Record `reported_version` exactly as written (tag, commit SHA, package version, build number). Do not normalize it.

### Output
Draft `bug_brief` with quoted sources.

### Quality Gate
- Every non-empty field in `bug_brief` has at least one matching line in `source_quotes`.
- `error_signature` is copied text, not a summary (search `bug_report` for the string and find it).

---

## Phase 2: Locate in the Repository

### Entry Criteria
- Draft `bug_brief` exists.

### Actions
1. Check the reported version exists: `git -C <repo_path> tag --list "<reported_version>*"` or `git -C <repo_path> cat-file -t <sha>` (prints `commit` when the SHA exists).
2. For every file path and function name in `error_signature`, run `git -C <repo_path> grep -n "<function_or_symbol>"` and record the hits. If the symbol is not found at HEAD, run `git -C <repo_path> log -S "<symbol>" --oneline` to find when it was removed or renamed.
3. Search existing issues and tests for the error message: `git -C <repo_path> grep -n "<distinctive substring of the message>"`. Record whether a test already asserts this behavior.
4. Set `is_regression_claim`: yes only if the report states it worked in a named earlier version; unknown otherwise. Do not infer yes from "it used to work" without a version; add a `missing_info` row asking for the last known good version.

### Output
`bug_brief` annotated with code locations and regression claim.

### Quality Gate
- `reported_version` resolves (`git cat-file -t` prints `commit` or `tag`) or is listed in `missing_info` as blocking.
- Every symbol in `error_signature` has a `git grep` hit or a `git log -S` result recorded.

---

## Phase 3: Missing-Info Checklist

### Entry Criteria
- Annotated `bug_brief` exists.

### Actions
1. Walk this checklist. Each unanswered item becomes a `missing_info` row with an `exact_question`:

| Field | Blocking? | Exact question template |
|---|---|---|
| Exact version or commit | yes | "Which version are you running? Please paste the output of `<tool> --version` or the commit SHA." |
| Exact input that triggers it | yes | "Can you attach the exact file / request body / command line that triggers this?" |
| Expected behavior | yes | "What output did you expect instead?" |
| OS and architecture | no, unless crash is native | "Please paste the output of `uname -a` (Linux/macOS) or `systeminfo` (Windows)." |
| Runtime version | no, unless trace points into runtime | "Please paste `python --version` / `node --version` / `go version` / `java -version` / `rustc --version`." |
| Config and environment variables | no | "Which config file and which non-default settings are you using?" |
| Frequency | no | "Does it fail every time, or some of the time? Roughly how many tries out of how many?" |
| Last known good version | yes when `is_regression_claim` is yes | "Which was the last version where this worked?" |
| Full log or trace | yes when only a summary was given | "Please paste the full error output, not a screenshot." |

2. Classify `severity_class` from report facts only: `crash`, `data-loss`, `wrong-result`, `hang`, `performance`, `cosmetic`. If two apply, pick the first one in that order.
3. Write the final `bug_brief` and `missing_info`.

### Output
`bug_brief` and `missing_info`.

### Quality Gate
- Every checklist row is either answered in `bug_brief` or present in `missing_info`.
- If any `missing_info` row has `blocking: true`, the brief states "BLOCKED" at the top.

---

## Worked Example

Illustrative only.

Input `bug_report`: "Since 2.4 the CSV importer crashes on files with a BOM. Traceback ... `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff in position 0` ... File "src/importer/csv_reader.py", line 88, in read_rows."

- Phase 1: `error_signature` = "UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff in position 0 / src/importer/csv_reader.py:88 read_rows". `reported_version` = "2.4". `expected` empty.
- Phase 2: `git tag --list "2.4*"` prints `v2.4.0 v2.4.1`, ambiguous. `git grep -n "def read_rows"` hits `src/importer/csv_reader.py:71`. `is_regression_claim` = unknown: "since 2.4" names no good version.
- Phase 3: `missing_info` rows: exact version (blocking, v2.4.0 or v2.4.1), the triggering file (blocking), expected output (blocking), last known good version (blocking). Note: byte 0xff at position 0 points to a UTF-16 BOM, not a UTF-8 BOM, so the question asks for the file itself rather than accepting the reporter's "BOM" description. Brief marked BLOCKED.

---

## Exit Criteria

DONE when `bug_brief` has every field filled from quoted sources or listed in `missing_info`, and the BLOCKED marker is set when any blocking fact is absent.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Report is only a screenshot description with no text | **Return**: add a blocking `missing_info` row asking for the text output; do not transcribe guessed text. |
| Phase 1 | Report describes several distinct failures | **Adjust**: write one `bug_brief` per failure and process the first; list the others in `missing_info` as separate bugs. |
| Phase 2 | `repo_path` is not a git repository | **Stop**: ask for a clone; bisect and blame later need history. |
| Phase 2 | Reported version does not exist in tags or history | **Return**: blocking `missing_info` row; do not substitute the nearest tag. |
| Phase 3 | Weak model tempted to fill `expected` from its own opinion | **Stop**: leave it empty and ask; a guessed expectation produces a test that asserts the wrong thing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
