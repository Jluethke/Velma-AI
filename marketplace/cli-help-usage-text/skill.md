# CLI Help and Usage Text

**One-line description:** Audits and fixes the tool's `--help`, short usage and error text against the GNU and POSIX conventions (help on stdout with exit 0, usage errors on stderr with a "try --help" hint, one example per command), then freezes every help screen as a snapshot file with a pinned terminal width.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Interface contract from `cli-spec-commands-flags-exits`.
- `project_dir` (string, required): Root of the project; the parser flow has already run.
- `tool_name` (string, required): Executable name.

---

## Outputs

- `help_text_snapshot` (string[]): Paths of the snapshot files, one per help screen, for example `tests/snapshots/help-trim.txt`.
- `usage_findings` (object[]): Every convention violation found, the command that shows it, and the fix applied. Empty when none.

---

## Phase 1: Capture Every Help Screen

### Entry Criteria
- The tool runs from `project_dir` with a known command line (`python -m pkg`, `node bin/tool.js`, `go run ./cmd/tool`, `cargo run -q --`). Call it `RUN` below.

### Actions
1. Pin the width so wrapping is identical between runs. Set `COLUMNS` to one fixed value for every capture (the number itself is arbitrary; it only has to stay the same). Library notes:

| Library | Width source |
|---|---|
| argparse | `shutil.get_terminal_size()`, which reads `COLUMNS` |
| click / typer | terminal size, `COLUMNS`; also `max_content_width` in context settings |
| commander | `process.stdout.columns`; override with `.configureOutput({ getOutHelpWidth: () => N })` |
| yargs | `.wrap(N)` or `.wrap(null)` for no wrapping |
| cobra | does not wrap flag usage by terminal width |
| clap | wraps only with the `wrap_help` feature; set `#[command(term_width = N)]` for a fixed width |

2. For the root and every command in `cli_spec`, run and save:
```
COLUMNS=100 RUN --help        > tests/snapshots/help-root.txt;  echo "exit=$?"
COLUMNS=100 RUN trim --help   > tests/snapshots/help-trim.txt;  echo "exit=$?"
```
3. Also capture the error path for one bad flag per command, with streams split:
```
RUN trim --bogus > out.txt 2> err.txt; echo "exit=$?"
```
4. Delete `out.txt` and `err.txt` after reading them; they are not snapshots.

### Output
One snapshot per help screen plus the error-path observations.

### Quality Gate
- Every `--help` capture printed `exit=0`.
- Every snapshot file is non-empty (`wc -c tests/snapshots/*.txt` shows no 0).

---

## Phase 2: Audit Against the Conventions

### Entry Criteria
- Snapshots exist.

### Actions
1. Check each rule below and record each failure in `usage_findings`:

| Rule | How to check |
|---|---|
| `--help` writes to stdout and exits 0 | `RUN --help 2>/dev/null | wc -l` is above 0 and exit is 0 |
| A usage error writes nothing to stdout | `out.txt` from Phase 1 is empty |
| A usage error names the bad token and exits with the spec usage code | `err.txt` contains `--bogus`; exit matches `exit_code_table` |
| A usage error ends with a hint to run `--help` | `err.txt` contains `--help` |
| A usage error does not dump the full help | `wc -l err.txt` is smaller than `wc -l help-trim.txt` |
| Synopsis uses `[ ]` for optional, `...` for repeatable, UPPERCASE or `<name>` placeholders | read the `Usage:` line |
| Every flag in `cli_spec` appears in help, and nothing extra | diff the flag list against the snapshot |
| Defaults and env vars are shown where the spec defines them | look for the default and env name per flag |
| Each command has at least one example | look for an `Examples:` block |
| `--version` prints one line with the tool name and version to stdout | `RUN --version` |
| Help never shows a secret value | grep the snapshot for any env value you set while capturing |

2. A secret check matters for clap: `#[arg(env = "TOKEN")]` shows the current value in help unless `hide_env_values = true` is set on that arg.

### Output
Draft `usage_findings`.

### Quality Gate
- Every rule in the table has a recorded pass or failure for every command.

---

## Phase 3: Fix and Freeze

### Entry Criteria
- `usage_findings` drafted.

### Actions
1. Fix one finding at a time in the parser module, then rerun only that command's capture. Do not batch edits across several files.
2. Add examples with the library's own mechanism:

| Library | Examples go in |
|---|---|
| argparse | `epilog=` with `formatter_class=argparse.RawDescriptionHelpFormatter` |
| click | the command docstring, with a `\b` line before the block to stop rewrapping |
| typer | `epilog=` on `@app.command()` |
| commander | `.addHelpText('after', '\nExamples:\n  $ logtrim trim --older-than 7d app.log')` |
| yargs | `.example('$0 trim --older-than 7d app.log', 'drop week-old lines')` |
| cobra | `Example:` field on `cobra.Command` |
| clap | `#[command(after_help = "Examples:\n  logtrim trim --older-than 7d app.log")]` |

3. Recapture every snapshot with the same `COLUMNS` value.
4. Add a test that regenerates each help screen and compares it byte for byte with the snapshot. Use the stack's tool: pytest comparing `subprocess.run(...).stdout` to the file, `node:test` with `assert.equal`, Go testscript `cmp stdout`, Rust `trycmd`. The e2e flow wires these in.

### Output
`help_text_snapshot`, `usage_findings` with fixes recorded.

### Quality Gate
- Rerunning every Phase 2 check shows no open finding.
- `git diff --stat tests/snapshots/` shows only the files you meant to change.

---

## Do Not

- Do not hand-edit a snapshot to make a test pass. Regenerate it from the tool.
- Do not capture snapshots without pinning width; they will fail on another terminal.
- Do not print help to stderr for `--help`. Only error paths use stderr.

---

## Worked Example

Illustrative. Go/cobra `logtrim` before fixes:
```
$ go run ./cmd/logtrim trim --bogus > out.txt 2> err.txt; echo "exit=$?"
exit=1
$ wc -l out.txt err.txt
 22 out.txt
  1 err.txt
```
Findings: usage block printed to stdout (`SilenceUsage` missing), exit 1 instead of 2, no examples. After the fixes from `cli-go-cobra-parser` and adding `Example:`:
```
$ go run ./cmd/logtrim trim --bogus > out.txt 2> err.txt; echo "exit=$?"
exit=2
$ cat err.txt
logtrim: unknown flag: --bogus
Run 'logtrim --help' for usage.
```

---

## Exit Criteria

DONE when every help screen follows the conventions table, every usage error is short and on stderr with the spec code, and each help screen has a snapshot generated at a pinned width.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Snapshot differs between two identical runs | **Adjust**: the width is not pinned for this library; use the setting from the Phase 1 table. |
| Phase 2 | Library cannot route `--help` to stdout | **Return**: report it as a library limitation in `usage_findings` with the library version. |
| Phase 3 | A fix changes another command's help | **Retry**: revert, make the change narrower, recapture. |
| Phase 3 | Env value appears in help | **Adjust**: hide env values (clap `hide_env_values`, click drop `show_envvar` on that option). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
