# CLI Spec: Commands, Flags and Exit Codes

**One-line description:** Writes the contract for a command-line tool before any code exists: every command, positional argument, flag, environment variable and exit code, following the POSIX Utility Syntax Guidelines and the GNU long-option conventions, so every later flow implements and tests against one table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tool_requirements` (string, required): Plain-language description of what the tool must do, who runs it (humans at a terminal, scripts, CI) and what it reads and writes.
- `tool_name` (string, required): The executable name users type, for example `logtrim`. Lowercase, no spaces.
- `stack` (string, required): One of `python`, `node`, `go`, `rust`. Selects the parser flow that runs next.
- `parser_library` (string, optional): For `python`: `argparse`, `click` or `typer`. For `node`: `commander` or `yargs`. Ignored for `go` (cobra) and `rust` (clap). Default when empty: `argparse` for python, `commander` for node.

---

## Outputs

- `cli_spec` (object): The full interface contract: synopsis lines, commands, positional arguments with arity, flags (short, long, value type, default, env var, repeatable, mutually exclusive group), stdin and stdout behavior, and the chosen `parser_library`.
- `exit_code_table` (object[]): Every exit code the tool can return, its meaning, the condition that triggers it, and which stream carries the message.

---

## Phase 1: Commands and Arguments

### Entry Criteria
- `tool_requirements` and `tool_name` are present.
- `stack` is one of `python`, `node`, `go`, `rust`. Any other value: stop and ask.

### Actions
1. List every distinct action the tool performs from `tool_requirements`. Write each as a verb: `trim`, `stats`, `validate`.
2. Apply this rule to decide the command shape:

| Distinct actions | Shape | Synopsis form |
|---|---|---|
| 1 | Single command, no subcommands | `tool [OPTIONS] FILE...` |
| 2 or more, sharing most flags | Subcommands with persistent (global) flags on the root | `tool [GLOBAL OPTIONS] COMMAND [OPTIONS] [ARGS]` |
| 2 or more, unrelated | Subcommands, each with its own flags | same as above |

3. For each command, list its positional arguments with arity: exactly one (`FILE`), optional (`[FILE]`), one or more (`FILE...`), zero or more (`[FILE...]`).
4. If a positional argument names an input file, state that the operand `-` means standard input (POSIX Utility Syntax Guideline 13), and that no operand reads stdin only when stdin is not a terminal.
5. Write one synopsis line per command using POSIX notation: square brackets for optional items, `...` for repetition, UPPERCASE for placeholders.
6. Record `parser_library`: apply the default from the Inputs section when empty, and reject a library that does not belong to `stack`.

### Output
Command list with synopsis lines and positional arity.

### Quality Gate
- Every action named in `tool_requirements` maps to exactly one command (count the actions, count the commands).
- Every synopsis line uses only `[ ]`, `...` and UPPERCASE placeholders, no invented notation.
- `parser_library` is a valid library for `stack` per the Inputs table.

---

## Phase 2: Flags

### Entry Criteria
- Command list exists.

### Actions
1. For each command, list every option the requirements need. Give each a long name (`--output`) in lowercase kebab case (GNU convention).
2. Give a short name (`-o`) only to options a human types often. Short names are one alphanumeric character (POSIX Guideline 3). Do not reuse a short letter for two meanings anywhere in the tool.
3. Reserve these names with these exact meanings, and never use them for anything else:

| Flag | Meaning | Source |
|---|---|---|
| `-h`, `--help` | Print help to stdout, exit 0 | GNU Coding Standards |
| `--version` | Print name and version to stdout, exit 0 | GNU Coding Standards |
| `-v`, `--verbose` | More diagnostics on stderr (repeatable if levels are needed) | common convention |
| `-q`, `--quiet` | Fewer diagnostics on stderr | common convention |
| `--color=WHEN` | `auto`, `always`, `never` | GNU `ls` |
| `--` | End of options; everything after is an operand | POSIX Guideline 10 |

4. For each flag record: value type (bool, int, string, path, enum with listed values), default, whether it repeats, and its environment variable `TOOLNAME_FLAG_NAME` (uppercase, dashes to underscores) if config-by-env is required.
5. Boolean flags take no value. If a boolean defaults to true, provide the negated form `--no-NAME`.
6. Record mutually exclusive groups (for example `--json` and `--format`) and required flags. Prefer a positional argument over a required flag when the value is the main object of the command.
7. Never accept a secret (token, password) as a flag value, because it lands in shell history and `ps` output. Accept it from an environment variable, a file path flag (`--token-file`), or stdin.

### Output
Flag table per command.

### Quality Gate
- No short letter appears twice with different meanings (sort the table by short name and read it).
- Every flag has a type and a default, or is marked required.
- No flag accepts a secret value directly.

---

## Phase 3: Exit Codes and Streams

### Entry Criteria
- Command and flag tables exist.

### Actions
1. Pick the exit code scheme with this table:

| Tool kind | Scheme |
|---|---|
| Answers a yes/no question (like `grep`, `diff`, `test`) | 0 = yes/match, 1 = no/no match, 2 = error |
| Everything else | 0 = success, 1 = runtime failure, 2 = usage error |
| Caller explicitly needs failure classes | Add codes from `sysexits.h`: 64 EX_USAGE, 65 EX_DATAERR, 66 EX_NOINPUT, 69 EX_UNAVAILABLE, 70 EX_SOFTWARE, 73 EX_CANTCREAT, 74 EX_IOERR, 75 EX_TEMPFAIL, 77 EX_NOPERM, 78 EX_CONFIG |

2. Always add these rows: 130 = interrupted by SIGINT (128 + 2, the shell convention), 143 = terminated by SIGTERM (128 + 15). Note that 126 and 127 are set by the shell (not executable, not found) and the tool must never return them itself.
3. Record the SIGPIPE decision as a row: exit quietly when the reader closes the pipe (for example `tool | head -1`). The status is either 141 (killed by SIGPIPE, as GNU tools do) or the stack's quiet-exit status; the `cli-stdio-stream-discipline` flow sets which.
4. Record the parser library's default for usage errors, because the next flow must force it to the scheme:

| Library | Default usage-error exit | Action needed for 2 |
|---|---|---|
| argparse | 2 | none |
| click / typer | 2 | none |
| commander | 1 | `exitOverride()` and map to 2 |
| yargs | 1 | `.fail()` handler and map to 2 |
| cobra | whatever `main` passes to `os.Exit` | wrap flag and arg errors, map to 2 |
| clap | 2 | none |

5. Write the stream contract line for every command: what goes to stdout (results only), what goes to stderr (errors, warnings, progress, prompts).
6. Assemble `cli_spec` and `exit_code_table`.

### Output
`cli_spec`, `exit_code_table`.

### Quality Gate
- `exit_code_table` contains 0, the usage-error code, 130 and 143, and no value above 255 or equal to 126 or 127.
- Every command has a stdout line and a stderr line in the stream contract.
- The usage-error row names the action from the table in step 4 for the chosen `parser_library`.

---

## Worked Example

Illustrative. Input: `tool_requirements` = "Trim old lines from log files by age, and print line counts per level. Used by cron jobs and humans." `tool_name` = `logtrim`, `stack` = `go`.

Phase 1 produces two commands, both reading files or stdin:
```
logtrim [GLOBAL OPTIONS] trim [--older-than DURATION] [--in-place] [FILE...]
logtrim [GLOBAL OPTIONS] stats [--json] [FILE...]
```
Phase 2 flag table (excerpt):

| Command | Long | Short | Type | Default | Env |
|---|---|---|---|---|---|
| global | `--color` | | enum auto/always/never | auto | `LOGTRIM_COLOR` |
| global | `--verbose` | `-v` | count | 0 | |
| trim | `--older-than` | | duration | required | `LOGTRIM_OLDER_THAN` |
| trim | `--in-place` | `-i` | bool | false | |
| stats | `--json` | | bool | false | |

Phase 3 `exit_code_table`: 0 success, 1 runtime failure (unreadable file), 2 usage error (cobra: wrap with `SetFlagErrorFunc`), 130 SIGINT, 143 SIGTERM, SIGPIPE row deferred to the stream flow.

---

## Exit Criteria

DONE when `cli_spec` names every command, argument, flag and stream rule, and `exit_code_table` lists every code with its trigger, so a parser flow can implement it without asking a question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` not in the four supported values | **Stop**: ask the user which stack; do not guess from file extensions alone. |
| Phase 1 | Requirements describe an interactive full-screen app | **Return**: report that a TUI is out of scope for this chain. |
| Phase 2 | Two flags want the same short letter | **Adjust**: keep the short letter for the more frequent flag; the other gets a long name only. |
| Phase 2 | Requirement asks for a secret as a flag value | **Adjust**: replace with an env var or `--NAME-file PATH` and note it in `cli_spec`. |
| Phase 3 | Caller demands a code that collides with 126, 127 or 128+N | **Adjust**: move it to an unused code below 126 and record why. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
