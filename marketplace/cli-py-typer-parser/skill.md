# Python Typer Parser

**One-line description:** Implements the spec's commands and flags with Typer using `typing.Annotated` parameters, fixes the single-command collapse and the boolean `--x/--no-x` default, turns off local-variable dumps in tracebacks, and tests it with `typer.testing.CliRunner`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Interface contract from `cli-spec-commands-flags-exits`.
- `exit_code_table` (object[], required): Exit codes from the same flow.
- `project_dir` (string, required): Root of the Python project.

---

## Outputs

- `parser_module` (string): Path of the module that defines the `typer.Typer` app.
- `parser_check_log` (string): Captured pytest output and manual checks.

---

## Phase 1: App and Commands

### Entry Criteria
- `cli_spec.parser_library` == `typer`.
- `python -c "import typer; print(typer.__version__)"` prints a version. Typer is built on click; also record `click.__version__`.

### Actions
1. Create `src/<pkg>/cli.py` only:
```python
from pathlib import Path
from typing import Annotated, Optional
import typer

app = typer.Typer(
    no_args_is_help=True,
    pretty_exceptions_show_locals=False,
    context_settings={"help_option_names": ["-h", "--help"]},
)

@app.callback()
def root(
    verbose: Annotated[int, typer.Option("--verbose", "-v", count=True)] = 0,
    color: Annotated[str, typer.Option("--color", envvar="LOGTRIM_COLOR")] = "auto",
) -> None:
    """Trim old log lines and report counts."""

@app.command()
def trim(
    older_than: Annotated[str, typer.Option("--older-than", metavar="DURATION", envvar="LOGTRIM_OLDER_THAN")],
    in_place: Annotated[bool, typer.Option("--in-place", "-i")] = False,
    files: Annotated[Optional[list[Path]], typer.Argument(metavar="FILE")] = None,
) -> None:
    """Drop lines older than DURATION."""
```
2. Always define `@app.callback()` when the spec has subcommands. Without a callback, a Typer app with exactly one command runs that command directly and the subcommand name becomes an unexpected extra argument.
3. Name every option explicitly (`typer.Option("--in-place", "-i")`). A bare `bool` parameter becomes `--in-place/--no-in-place`; passing an explicit single name gives only `--in-place`. Keep the `--no-` form only when `cli_spec` asks for it.
4. A parameter without a default value is required. Do not give a required option a default of `...` in new code; use `Annotated` with no default.
5. Use `enum.Enum` subclasses (with `str` mixin) for enum values when you need choices validated, for example `class Color(str, Enum): auto = "auto"; always = "always"; never = "never"`.
6. Set `pretty_exceptions_show_locals=False` (as above). The Rich traceback otherwise prints local variables, which can include tokens or file contents.

### Output
`cli.py` with the app, callback and commands.

### Quality Gate
- `python -m logtrim --help` exits 0 and lists every command in `cli_spec`.
- `python -m logtrim trim --help` shows `--in-place` and no `--no-in-place` unless the spec asks for it.

---

## Phase 2: Exit Codes and Entry Point

### Entry Criteria
- App defined.

### Actions
1. End a command with a specific code using `raise typer.Exit(code=N)`, with N from `exit_code_table`.
2. Report a usage problem with `raise typer.BadParameter("message")` inside a parameter callback, which exits 2.
3. Print diagnostics to stderr with `typer.echo(msg, err=True)`.
4. Typer inherits click's Ctrl-C handling (prints `Aborted!`, exits 1). If `exit_code_table` requires 130, wrap `app` in a `main()` that runs `typer.main.get_command(app).main(standalone_mode=False)` and maps `click.exceptions.Abort` caused by `KeyboardInterrupt` to 130, following the same wrapper shown in `cli-py-click-parser` Phase 2.
5. Set the console script: `[project.scripts] logtrim = "logtrim.cli:app"` (or `:main` when you added the wrapper). Add `src/<pkg>/__main__.py` that calls the same target.
6. Decide shell completion options now: `typer.Typer(add_completion=True)` (the default) adds `--install-completion` and `--show-completion` to the root help. If `cli_spec` does not want those flags visible, pass `add_completion=False` and let `cli-completion-generate` produce scripts instead.

### Output
Exit codes and entry point wired.

### Quality Gate
- `python -m logtrim trim; echo $?` reports the missing `--older-than` option on stderr and prints `2`.
- `logtrim --help` (after `pip install -e .`) shows exactly the root options in `cli_spec`, plus completion flags only if Phase 2 step 6 chose them.

---

## Phase 3: Tests

### Entry Criteria
- Entry point wired.

### Actions
1. Create `tests/test_cli_parser.py`:
```python
from typer.testing import CliRunner
from logtrim.cli import app

runner = CliRunner()

def test_trim_requires_older_than():
    r = runner.invoke(app, ["trim"])
    assert r.exit_code == 2

def test_env_supplies_older_than(tmp_path):
    f = tmp_path / "a.log"; f.write_text("")
    r = runner.invoke(app, ["trim", str(f)], env={"LOGTRIM_OLDER_THAN": "1d"})
    assert r.exit_code == 0, r.output
```
2. Typer's `CliRunner` subclasses click's; the stderr capture rules depend on the click version recorded in Phase 1 (click 8.2+: `r.stderr` always available).
3. Run `python -m pytest tests/test_cli_parser.py -q`; save as `parser_check_log`.

### Output
`parser_module`, `parser_check_log`.

### Quality Gate
- Pytest summary shows 0 failed.
- One test covers the env var path and one covers a usage error with code 2.

---

## Do Not

- Do not mix `typer.Option(default, ...)` old-style defaults with `Annotated` in the same parameter; Typer raises an error for a default given in both places.
- Do not invent `typer.Option` keyword arguments. Check `python -c "import typer, inspect; print(inspect.signature(typer.Option))"`.
- Do not remove a failing test. Fix the command.

---

## Worked Example

Illustrative. Before adding the callback, with only `trim` defined:
```
$ python -m logtrim trim --older-than 1d a.log
Usage: logtrim [OPTIONS] [FILE]...
Error: Got unexpected extra argument (a.log)
```
After adding `@app.callback()`:
```
$ python -m logtrim trim --older-than 1d a.log; echo $?
0
$ python -m pytest tests/test_cli_parser.py -q
...                                                       [100%]
3 passed in 0.21s
```

---

## Exit Criteria

DONE when every command and option in `cli_spec` exists with the exact flag spellings, usage errors exit 2, local variables are hidden in tracebacks, and the tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Single command app treats subcommand name as an argument | **Adjust**: add `@app.callback()`. |
| Phase 1 | `TypeError` about a default set twice | **Adjust**: move the default to the parameter `= value` and remove it from `typer.Option`. |
| Phase 2 | Spec forbids `--install-completion` in help | **Adjust**: `add_completion=False`. |
| Phase 3 | Test fails | **Retry**: fix the app and rerun; do not weaken the assertion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
