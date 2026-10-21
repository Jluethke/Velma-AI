# Prove Each Command-Line Flag Exists in the Installed Tool

**One-line description:** Checks every command and flag the plan will run that is not already proven on the verify card against the installed tool's own `--help`, `help <subcommand>` or man page output, so no invented flag, renamed option or newer-version flag is ever executed or reported as a check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_plan` (object[], required): From `stp-edit-plan-write`.
- `verify_card` (object, required): From `stp-baseline-capture`.

---

## Outputs

- `flag_evidence` (object[]): `[{ "tool": str, "subcommand": str, "flag": str, "status": "FOUND"|"NOT_FOUND"|"NEEDS_VALUE_FORMAT", "tool_version": str, "help_line": str, "command": str }]`.

---

## Phase 1: List the Flags to Check

### Entry Criteria
- `edit_plan` exists.

### Actions
1. Collect every entry of `cli_flags` across `edit_plan`, plus every flag in `verify` lists that is not literally on `verify_card` (a `verify_card` command already ran at baseline, so its flags are proven).
2. Split each into `tool`, `subcommand` (if any) and `flag`. Examples: `pytest -k` gives tool `pytest`, flag `-k`; `git restore --staged` gives tool `git`, subcommand `restore`, flag `--staged`; `cargo test -- --exact` gives tool `cargo test` harness, flag `--exact` (flags after `--` belong to the test binary, not cargo).
3. Record each tool's version: `<tool> --version` (Go: `go version`; Java: `java -version`; npm runners: `npx <tool> --version`).

### Output
List of `(tool, subcommand, flag, version)`.

### Quality Gate
- Every flag from `cli_flags` is in the list.

---

## Phase 2: Find the Flag in the Tool's Own Help

### Entry Criteria
- List exists.

### Actions
1. Get the help text with the form for the tool:

| Tool | Help command |
|---|---|
| git | `git <sub> -h` (short usage) or `git help <sub>` (full manual) |
| pytest | `pytest --help` (plugins add flags; run it with the same prefix as the card) |
| npm / pnpm / yarn | `npm help <sub>`, `pnpm <sub> --help`, `yarn <sub> --help` |
| jest / vitest | `npx jest --help`, `npx vitest --help` (vitest subcommands: `npx vitest run --help`) |
| go | `go help <sub>`; test flags: `go help testflag`; build flags: `go help build` |
| cargo | `cargo <sub> --help`; test binary flags: `cargo test -- --help` |
| mvn | `./mvnw --help` for Maven options; plugin goals: `./mvnw help:describe -Dplugin=<prefix> -Ddetail` (for example `-Dplugin=surefire`) |
| gradle | `./gradlew help --task <task>` lists that task's options |
| rg | `rg --help` |
| GNU tools (sed, grep, timeout) | `<tool> --help`; on macOS the BSD versions differ, use `man <tool>` |

2. Search the help for the flag. The flag starts with `-`, so tell the search tool it is a pattern, not an option: `<help command> 2>&1 | rg -n -F -e "--exact"` (PowerShell: `<help command> 2>&1 | Select-String -SimpleMatch -- "--exact"`).
3. Read the matching line and the line after it. Record the line in `help_line`. If the flag takes a value, record its format (`-k EXPRESSION`, `--tests=TEST_FILTER`, `-run regexp`). If your planned value does not fit the format, status `NEEDS_VALUE_FORMAT`.
4. Not in help: status `NOT_FOUND`. Do not run the command "to see if it works"; some tools ignore unknown flags silently or treat them as positional arguments (for example a path or a test filter), which produces a misleading pass.
5. Short versus long forms: if you planned a short form (`-q`) and help lists only `-q, --quiet`, it is FOUND. If help lists `--quiet` only, the short form is NOT_FOUND.

### Output
Status and help line per flag.

### Quality Gate
- Each `FOUND` row has a `help_line` copied from the help output of the installed version.

---

## Phase 3: Report

### Entry Criteria
- All flags checked.

### Actions
1. Emit `flag_evidence`.
2. For each `NOT_FOUND`, note the documented alternative only if it is in the same help output (for example old `git checkout -- <file>` when `git restore` is missing on Git older than 2.23).

### Output
`flag_evidence`.

### Quality Gate
- Row count equals the list length from Phase 1.

---

## Worked Example

Illustrative only.

Plan uses `pytest --lf` and `git restore --staged`.

```
$ uv run pytest --help 2>&1 | rg -n -F -e "--lf"
52:  --lf, --last-failed   Rerun only the tests that failed at the last run (or
$ git restore -h 2>&1 | rg -n -F -e "--staged"
9:    -S, --staged          restore the index
$ git --version
git version 2.45.1
```

Both FOUND with help lines recorded. A planned `pytest --only-failed` would return no match and be `NOT_FOUND`.

---

## Exit Criteria

DONE when every planned flag not already on the verify card has a status backed by a line from the installed tool's help output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No flags to check | **Return**: empty `flag_evidence`. |
| Phase 2 | Help output is paged and waits for input | **Retry**: set `PAGER=cat` / `GIT_PAGER=cat`, or pipe to `rg`. |
| Phase 2 | Tool has no help flag | **Adjust**: use `man <tool>` or the official docs page for the installed version, quoted. |
| Phase 2 | Flag found but its value format differs | **Return**: `NEEDS_VALUE_FORMAT` with the documented format. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
