# Python click Parser

**One-line description:** Implements the spec's commands and flags with `click` decorators (groups, typed options, env var binding, `click.Path`, `click.Choice`), keeps click's exit code 2 for usage errors, controls its `Aborted!` behavior, and tests it with `click.testing.CliRunner`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Interface contract from `cli-spec-commands-flags-exits`.
- `exit_code_table` (object[], required): Exit codes from the same flow.
- `project_dir` (string, required): Root of the Python project.

---

## Outputs

- `parser_module` (string): Path of the module that defines the click group, for example `src/logtrim/cli.py`.
- `parser_check_log` (string): Captured pytest output and the manual checks.

---

## Phase 1: Declare Commands and Options

### Entry Criteria
- `cli_spec.parser_library` == `click`.
- `python -c "import click; print(click.__version__)"` prints a version. Record it; click 8.2 changed `CliRunner` (see Phase 3).

### Actions
1. Add `click` to `[project] dependencies` in `pyproject.toml` with a lower bound on the installed major version, for example `"click>=8.1"`.
2. Create `src/<pkg>/cli.py` only:
```python
import pathlib
import click

CONTEXT = {"help_option_names": ["-h", "--help"], "auto_envvar_prefix": "LOGTRIM"}

@click.group(context_settings=CONTEXT)
@click.version_option(package_name="logtrim")
@click.option("-v", "--verbose", count=True, help="Repeat for more detail on stderr.")
@click.option("--color", type=click.Choice(["auto", "always", "never"]), default="auto", show_default=True)
@click.pass_context
def cli(ctx: click.Context, verbose: int, color: str) -> None:
    """Trim old log lines and report counts."""
    ctx.obj = {"verbose": verbose, "color": color}

@cli.command()
@click.option("--older-than", required=True, metavar="DURATION")
@click.option("-i", "--in-place", is_flag=True)
@click.argument("files", nargs=-1, type=click.Path(dir_okay=False, allow_dash=True, path_type=pathlib.Path))
@click.pass_obj
def trim(obj: dict, older_than: str, in_place: bool, files: tuple[pathlib.Path, ...]) -> None:
    """Drop lines older than DURATION."""
```
3. Map spec types with this table only:

| Spec type | click |
|---|---|
| bool, default false | `is_flag=True` |
| bool with negation | `"--color/--no-color"` as the option name |
| count | `count=True` |
| repeatable | `multiple=True` (value is a tuple) |
| enum | `type=click.Choice([...])` |
| path that must exist | `type=click.Path(exists=True, path_type=pathlib.Path)` |
| path where `-` means stdin | `type=click.File("r")` or `click.Path(allow_dash=True)` |
| zero or more operands | `nargs=-1` (add `required=True` for one or more) |
| env var | `envvar="LOGTRIM_X"` or `auto_envvar_prefix` in context settings |

4. With `auto_envvar_prefix="LOGTRIM"`, subcommand options read `LOGTRIM_<COMMAND>_<OPTION>` (for example `LOGTRIM_TRIM_OLDER_THAN`). If `cli_spec` names a different variable, set `envvar=` explicitly on that option.
5. Add `show_envvar=True` to options whose env var users need to discover in help.

### Output
`cli.py` with the group and every command.

### Quality Gate
- `python -m logtrim --help` exits 0 and lists every command in `cli_spec`.
- `python -m logtrim trim --help` shows `--older-than DURATION` and `[required]`.

---

## Phase 2: Errors and Exit Codes

### Entry Criteria
- Commands declared.

### Actions
1. Raise `click.UsageError("message")` (exit 2) for usage problems and `click.ClickException("message")` (exit 1) for runtime failures. For other codes from `exit_code_table`, raise a subclass of `click.ClickException` with `exit_code = N`.
2. Write output with `click.echo(text)` for stdout and `click.echo(text, err=True)` for stderr.
3. Handle Ctrl-C. In default standalone mode, click converts `KeyboardInterrupt` to `click.Abort`, prints `Aborted!` to stderr and exits 1. If `exit_code_table` says 130, add a wrapper entry point:
```python
import sys
def main() -> int:
    try:
        cli.main(standalone_mode=False)
    except click.exceptions.Abort as e:
        if isinstance(e.__cause__, KeyboardInterrupt):
            return 130
        return 1
    except click.ClickException as e:
        e.show()
        return e.exit_code
    except click.exceptions.Exit as e:
        return e.exit_code
    return 0
```
   With `standalone_mode=False`, click no longer prints and exits for you, so the wrapper must call `e.show()`. Confirm this behavior for your installed version in the click docs page "Exception Handling and Exit Codes" before relying on it.
4. Point the console script at `main` (the wrapper) in `pyproject.toml`: `[project.scripts] logtrim = "logtrim.cli:main"`.

### Output
Error classes and the entry point wired.

### Quality Gate
- `python -m logtrim trim --older-than 1d --bogus; echo $?` prints `Error: No such option: --bogus` on stderr and `2`.
- `python -m logtrim trim; echo $?` prints `Missing option '--older-than'` and `2`.

---

## Phase 3: CliRunner Tests

### Entry Criteria
- Entry point wired.

### Actions
1. Create `tests/test_cli_parser.py`:
```python
from click.testing import CliRunner
from logtrim.cli import cli

def test_missing_required_option():
    r = CliRunner().invoke(cli, ["trim"])
    assert r.exit_code == 2
    assert "Missing option" in r.output

def test_env_var_binding():
    r = CliRunner().invoke(cli, ["trim", "--help"], env={"LOGTRIM_TRIM_OLDER_THAN": "2d"})
    assert r.exit_code == 0
```
2. Version note: in click 8.2 and later, `CliRunner` always captures stderr separately (`r.stderr`), `r.output` holds both streams interleaved, and the `mix_stderr` argument was removed. In click 8.1, pass `CliRunner(mix_stderr=False)` to read `r.stderr`. Use the form that matches the version recorded in Phase 1.
3. `CliRunner` runs in-process and catches exceptions: always assert `r.exit_code` and, on failure, print `r.exception` so a crash is not mistaken for a usage error.
4. Run `python -m pytest tests/test_cli_parser.py -q` and save the output as `parser_check_log`.

### Output
`parser_module`, `parser_check_log`.

### Quality Gate
- The pytest summary shows 0 failed.
- At least one test asserts `exit_code == 2` and one asserts an env var takes effect.

---

## Do Not

- Do not use `print()` in commands: use `click.echo`, which handles broken pipes and encoding on Windows consoles.
- Do not rename function parameters freely: click derives the parameter name from the longest option name with dashes turned into underscores (`--older-than` becomes `older_than`). A mismatch raises `TypeError: got an unexpected keyword argument`.
- Do not rely on `CliRunner` alone for signal or pipe behavior: it never spawns a process. The e2e flow covers that.

---

## Worked Example

Illustrative. `logtrim` spec with click 8.2.
```
$ python -m logtrim trim --older-than 1d --bogus
Usage: logtrim trim [OPTIONS] [FILES]...
Try 'logtrim trim -h' for help.

Error: No such option: --bogus
$ echo $?
2
$ python -m pytest tests/test_cli_parser.py -q
....                                                      [100%]
4 passed in 0.11s
```

---

## Exit Criteria

DONE when every command and option in `cli_spec` is declared, usage errors exit 2, Ctrl-C maps to the code in `exit_code_table`, and the CliRunner tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Env var name from `auto_envvar_prefix` differs from `cli_spec` | **Adjust**: set `envvar=` on the option explicitly. |
| Phase 2 | Wrapper swallows a traceback | **Adjust**: let non-click exceptions propagate in tests; only map click exceptions. |
| Phase 3 | `TypeError: ... mix_stderr` | **Adjust**: the installed click is 8.2 or later; remove the argument and read `r.stderr`. |
| Phase 3 | Test fails | **Retry**: fix the code and rerun; never weaken the assertion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
