# Argument Parsing With getopts

**One-line description:** Adds a `usage()` and `parse_args()` to a shell script using the `getopts` builtin with a leading `:` for silent error handling, `OPTIND` reset and `shift $((OPTIND - 1))`, plus a hand-written `while`/`case` loop when long options are required (because `getopts` has none and GNU `getopt` is missing on macOS), with every error path tested.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script to add parsing to.
- `script_requirements` (object, required): Its `inputs[]` lists the options and positional arguments.
- `shell_dialect` (string, required): `bash` or `posix`.

---

## Outputs

- `cli_interface` (object): Every option (short, long, takes value, default), positional arguments, the usage text, and the exit code for usage errors.

---

## Phase 1: Design the Interface

### Entry Criteria
- `script_requirements.inputs` lists the arguments.

### Actions
1. Write one table row per option: short letter, long name (if any), value or flag, default, environment fallback.
2. Always include `-h` (help, exit 0). Add `-v` (verbose) and `-n` (dry run) only if the requirements call for them.
3. Choose the parser with this rule:
   - Only short options needed: `getopts` (POSIX builtin, same in bash, dash, busybox).
   - Long options needed: manual `while [ $# -gt 0 ]; case "$1" in` loop. Do NOT use the external `getopt` program: the util-linux enhanced version (`getopt -T` exits 4) exists on Linux, but macOS ships a BSD `getopt` without long options or proper quoting.
4. Pick the usage-error exit code: `2` (the convention bash builtins use for misuse) or `64` (`EX_USAGE` from BSD `sysexits.h`). Record the choice in `cli_interface`; `shs-exit-status-contract` reuses it.

### Output
Option table and parser choice.

### Quality Gate
- Every entry in `script_requirements.inputs` maps to an option, a positional argument, or an environment variable in the table.
- The usage exit code is recorded.

---

## Phase 2: Implement the Parser

### Entry Criteria
- Option table complete.

### Actions
1. Short options only (works in bash and POSIX sh):

```sh
usage() {
  cat <<EOF
Usage: $SCRIPT_NAME [-h] [-n] [-o DIR] FILE...
  -h       show this help and exit
  -n       dry run: print actions, change nothing
  -o DIR   output directory (default: ./out)
EOF
}

parse_args() {
  dry_run=0 out_dir=./out
  OPTIND=1
  while getopts ':hno:' opt; do
    case $opt in
      h) usage; exit 0 ;;
      n) dry_run=1 ;;
      o) out_dir=$OPTARG ;;
      :) printf '%s: option -%s requires an argument\n' "$SCRIPT_NAME" "$OPTARG" >&2; usage >&2; exit 2 ;;
      \?) printf '%s: unknown option -%s\n' "$SCRIPT_NAME" "$OPTARG" >&2; usage >&2; exit 2 ;;
    esac
  done
  shift $((OPTIND - 1))
  [ $# -ge 1 ] || { printf '%s: missing FILE\n' "$SCRIPT_NAME" >&2; usage >&2; exit 2; }
  files_count=$#
}
```

   With the leading `:` in `':hno:'`, an unknown option sets `opt` to `?` and `OPTARG` to the letter; a missing value sets `opt` to `:`. `shift` inside a function does not change the caller's `$@`; in bash keep remaining operands in an array (`operands=("$@")`) or call `parse_args "$@"` and do the `shift` logic in `main`.
2. Long options (manual loop). Guard every `$2` read because `set -u` aborts on a missing value:

```sh
while [ $# -gt 0 ]; do
  case $1 in
    -h|--help) usage; exit 0 ;;
    -n|--dry-run) dry_run=1; shift ;;
    -o|--output)
      [ $# -ge 2 ] || { printf '%s: %s needs a value\n' "$SCRIPT_NAME" "$1" >&2; exit 2; }
      out_dir=$2; shift 2 ;;
    --output=*) out_dir=${1#*=}; shift ;;
    --) shift; break ;;
    -?*) printf '%s: unknown option %s\n' "$SCRIPT_NAME" "$1" >&2; usage >&2; exit 2 ;;
    *) break ;;
  esac
done
```

3. Usage text goes to stdout when `-h` asked for it (exit 0) and to stderr on an error (nonzero exit).
4. In bash, if `parse_args` is a function, declare `local OPTIND opt OPTARG` or reset `OPTIND=1`, otherwise a second call skips options.

### Output
Script with `usage` and `parse_args`.

### Quality Gate
- `bash -n` or `dash -n` passes.
- `"$script_path" -h; echo "rc=$?"` prints usage and `rc=0`.

---

## Phase 3: Exercise Every Error Path

### Entry Criteria
- Parser implemented.

### Actions
1. Run each case and record stdout, stderr and exit code:
   - `-h` gives usage on stdout, rc 0.
   - `-z` gives "unknown option" on stderr, rc 2 (or 64).
   - `-o` with no value gives "requires an argument", rc 2.
   - No operands gives "missing FILE", rc 2.
   - `-o "dir with space" "file name"` sets values exactly (print them in dry-run mode).
   - `-- -file-starting-with-dash` treats it as an operand.
2. Write the results into `cli_interface`; `shs-bats-cli-tests` turns them into tests.

### Output
`cli_interface`.

### Quality Gate
- Each of the six cases shows the expected exit code.
- Error messages go to stderr: `"$script_path" -z 2>/dev/null` prints nothing on stdout.

---

## Worked Example

Illustrative only.

```
$ bin/pack -h; echo "rc=$?"
Usage: pack [-h] [-n] [-o DIR] FILE...
...
rc=0
$ bin/pack -z a.txt; echo "rc=$?"
pack: unknown option -z
Usage: pack [-h] [-n] [-o DIR] FILE...
rc=2
$ bin/pack -o; echo "rc=$?"
pack: option -o requires an argument
rc=2
$ bin/pack -n -o "out dir" -- -weird.txt
would write out dir/-weird.txt.gz
```

---

## Exit Criteria

DONE when `cli_interface` documents every option and all six cases behave as recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requirements want subcommands (`tool add`, `tool rm`) | **Adjust**: dispatch on `$1` with `case` first, then run a `getopts` loop per subcommand. |
| Phase 2 | Options after operands are ignored (`file -n`) | **Adjust**: `getopts` stops at the first operand by design; document "options first" in usage or use the manual loop. |
| Phase 3 | `-o` with no value consumes the next option as its value | **Adjust**: expected `getopts` behavior; validate that `OPTARG` does not start with `-` if that matters. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
