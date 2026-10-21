# Python argparse Parser

**One-line description:** Implements the spec's commands and flags with the standard-library `argparse` module, with subparsers, typed values, mutually exclusive groups and exit code 2 on usage errors, behind a `main(argv) -> int` entry point that tests can call directly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Interface contract from `cli-spec-commands-flags-exits`.
- `exit_code_table` (object[], required): Exit codes from the same flow.
- `project_dir` (string, required): Root of the Python project (contains or will contain `pyproject.toml`).

---

## Outputs

- `parser_module` (string): Path of the module holding `build_parser()` and `main()`, for example `src/logtrim/cli.py`.
- `parser_check_log` (string): Captured output of the pytest run and the manual `--help` / bad-flag checks.

---

## Phase 1: Build the Parser

### Entry Criteria
- `cli_spec.parser_library` == `argparse`.
- `python --version` prints 3.9 or newer (needed for `argparse.BooleanOptionalAction` and `exit_on_error`). If older, use only `store_true` / `store_false`.

### Actions
1. Create one file only: `src/<pkg>/cli.py`. Do not touch other modules in this phase.
2. Write a function `build_parser() -> argparse.ArgumentParser` so tests can build a fresh parser each time:
```python
import argparse, pathlib, sys
from importlib.metadata import version

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="logtrim",
        description="Trim old log lines and report counts.",
        allow_abbrev=False,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--version", action="version", version=f"%(prog)s {version('logtrim')}")
    p.add_argument("-v", "--verbose", action="count", default=0)
    p.add_argument("--color", choices=["auto", "always", "never"], default="auto")
    sub = p.add_subparsers(dest="command", required=True, metavar="COMMAND")
    t = sub.add_parser("trim", help="drop lines older than a duration")
    t.add_argument("--older-than", required=True, metavar="DURATION")
    t.add_argument("-i", "--in-place", action="store_true")
    t.add_argument("files", nargs="*", type=pathlib.Path, metavar="FILE")
    s = sub.add_parser("stats", help="count lines per level")
    g = s.add_mutually_exclusive_group()
    g.add_argument("--json", action="store_true")
    g.add_argument("--format", choices=["table", "csv"])
    s.add_argument("files", nargs="*", type=pathlib.Path, metavar="FILE")
    return p
```
3. Map each spec type to argparse with this table, and use nothing else:

| Spec type | argparse |
|---|---|
| bool, default false | `action="store_true"` |
| bool, default true | `action=argparse.BooleanOptionalAction, default=True` (gives `--x` and `--no-x`) |
| count | `action="count", default=0` |
| repeatable string | `action="append"` with `default=None`, then treat `None` as empty |
| enum | `choices=[...]` |
| int | `type=int` |
| path | `type=pathlib.Path` |
| one or more operands | `nargs="+"`; zero or more `nargs="*"`; optional `nargs="?"` |

4. Set `allow_abbrev=False` so `--old` is not silently accepted as `--older-than`.
5. Always pass `dest="command"` together with `required=True` to `add_subparsers`. Without `dest`, older Python versions raise a `TypeError` instead of a usage message when the command is missing.

### Output
`cli.py` with `build_parser()`.

### Quality Gate
- `python -c "from logtrim.cli import build_parser; build_parser().print_help()"` exits 0 and lists every command in `cli_spec`.
- `grep -n "type=bool" src/` returns nothing (see Do Not list).

---

## Phase 2: Entry Point and Exit Codes

### Entry Criteria
- `build_parser()` exists.

### Actions
1. Add `main`:
```python
def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.command == "trim":
            return run_trim(args)
        return run_stats(args)
    except OSError as e:
        print(f"logtrim: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
```
2. Add `src/<pkg>/__main__.py` containing `from .cli import main; raise SystemExit(main())` so `python -m <pkg>` works.
3. For a usage problem argparse cannot express (for example two flags valid only together), call `parser.error("message")`. It prints usage plus `prog: error: message` to stderr and exits 2.
4. Return codes from `exit_code_table` only. Do not call `sys.exit()` inside command functions; return an int to `main`.

### Output
`main()` returning exit codes from the table.

### Quality Gate
- `python -m logtrim --help; echo $?` prints help on stdout and `0`.
- `python -m logtrim trim --older-than 1d --bogus 2>&1 >/dev/null; echo $?` prints an `error: unrecognized arguments: --bogus` line and `2`. (Supply every required flag in this check: argparse reports missing required arguments before unrecognized ones.)

---

## Phase 3: Parser Tests

### Entry Criteria
- `main()` exists.

### Actions
1. Create `tests/test_cli_parser.py`:
```python
import pytest
from logtrim.cli import build_parser, main

def test_missing_command_is_usage_error(capsys):
    with pytest.raises(SystemExit) as e:
        main([])
    assert e.value.code == 2
    assert "required" in capsys.readouterr().err

def test_json_and_format_conflict(capsys):
    with pytest.raises(SystemExit) as e:
        main(["stats", "--json", "--format", "csv"])
    assert e.value.code == 2

def test_abbrev_disabled():
    with pytest.raises(SystemExit):
        build_parser().parse_args(["trim", "--older", "1d"])
```
2. Add one parse test per command that asserts each flag lands in the expected attribute (`args.older_than`, dashes become underscores).
3. Run `python -m pytest tests/test_cli_parser.py -q` and save the output as `parser_check_log`.

### Output
`parser_module`, `parser_check_log`.

### Quality Gate
- The pytest summary line shows 0 failed and 0 errors.
- Every command in `cli_spec` has at least one test (count test functions against commands).

---

## Do Not

- Do not use `type=bool`: `bool("False")` is `True`. Use the actions in the table.
- Do not use a mutable list as `default` with `action="append"`: argparse appends to the default list.
- Do not use `argparse.FileType`: it opens files at parse time and leaks handles on later errors. Use `pathlib.Path` and open later.
- Do not delete or loosen a failing test to get green. Fix the parser.
- Do not claim the gate passed without pasting the pytest summary line.

---

## Worked Example

Illustrative. `cli_spec` is the `logtrim` spec (commands `trim`, `stats`). Phase 1 writes `src/logtrim/cli.py`. Phase 2 manual checks:
```
$ python -m logtrim trim --bogus
usage: logtrim trim [-h] --older-than DURATION [-i] [FILE ...]
logtrim trim: error: the following arguments are required: --older-than
$ echo $?
2
```
Phase 3:
```
$ python -m pytest tests/test_cli_parser.py -q
.....                                                     [100%]
5 passed in 0.08s
```

---

## Exit Criteria

DONE when every command and flag in `cli_spec` parses through `build_parser()`, usage errors exit 2 on stderr, help exits 0 on stdout, and the parser tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Python older than 3.9 | **Adjust**: replace `BooleanOptionalAction` with paired `store_true`/`store_false` flags sharing a `dest`. |
| Phase 1 | Spec needs nested subcommands deeper than two levels | **Adjust**: call `add_subparsers` on the child parser; keep `dest` unique per level. |
| Phase 2 | `importlib.metadata.version` raises `PackageNotFoundError` | **Adjust**: install the project in editable mode (`pip install -e .`) before running; do not hardcode the version. |
| Phase 3 | A test fails | **Retry**: fix `cli.py`, rerun the full file; never edit the assertion to match wrong behavior. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
