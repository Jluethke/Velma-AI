# Temp Files With mktemp and Trap Cleanup

**One-line description:** Creates every temporary file and directory with `mktemp` using a template that works on GNU, BSD and busybox, registers one `cleanup` function on `EXIT` plus `INT`/`TERM` handlers that preserve the exit status (128+N), adds a bash `ERR` trap with `set -E` for line-numbered failures, and proves cleanup runs on success, failure and Ctrl-C.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script to fix.
- `shell_dialect` (string, required): `bash` or `posix`.

---

## Outputs

- `cleanup_contract` (object): Temp paths created, trap lines installed, the exit codes observed in the three cleanup tests, and leftover-file check results.

---

## Phase 1: Replace Ad-Hoc Temp Paths

### Entry Criteria
- The script parses.

### Actions
1. Find hand-made temp names: `grep -nE '/tmp/|\$\$|\$RANDOM|tmp[_.-]?file' "$script_path"`. A fixed or PID-based name in `/tmp` is a race and a symlink attack risk.
2. Replace them with one temp directory per run, created once near the start of `main`:

```sh
tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/${SCRIPT_NAME}.XXXXXX")
```

   The explicit template with trailing `XXXXXX` works on GNU coreutils, macOS/BSD and busybox. Bare `mktemp -d` also works on current systems but older macOS required `-t`; the template form avoids the difference.
3. Put all scratch files inside it: `work_file=$tmp_dir/work.txt`. Do not call `mktemp` repeatedly in loops.
4. For atomic replacement of a final output, create the temp file in the destination's directory (`mktemp "$dest.XXXXXX"`) so `mv` stays on one filesystem; `shs-idempotent-operations` covers this.

### Output
Script using one `tmp_dir`.

### Quality Gate
- The step 1 search returns no hand-made temp names.
- `grep -c 'mktemp' "$script_path"` is at least 1.

---

## Phase 2: Install Traps

### Entry Criteria
- `tmp_dir` in use.

### Actions
1. Add, immediately before the `mktemp` call (so a signal between them cannot leak the directory):

```sh
tmp_dir=
cleanup() {
  rc=$?
  trap - EXIT
  if [ -n "$tmp_dir" ] && [ -d "$tmp_dir" ]; then rm -rf -- "$tmp_dir"; fi
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
```

2. Why each piece exists:
   - `rc=$?` must be the first line, before any command changes `$?`.
   - The `INT`/`TERM`/`HUP` traps call `exit`, which fires the `EXIT` trap. bash runs the `EXIT` trap on those signals anyway, but dash and busybox do not, so the explicit traps make it portable. 130, 143, 129 are 128 plus the signal numbers.
   - The `[ -n "$tmp_dir" ]` guard stops `rm -rf -- ""` or a wrong path if `mktemp` failed.
3. bash only: add a failure locator after the traps:

```bash
set -E   # ERR trap is inherited by functions, command substitutions and subshells
trap 'printf "%s: line %s: %s exited %s\n" "$SCRIPT_NAME" "$LINENO" "$BASH_COMMAND" "$?" >&2' ERR
```

4. Only one `trap ... EXIT` may exist; a second one replaces the first. Search `grep -n 'trap ' "$script_path"` and merge any others into `cleanup`.
5. If the script starts background jobs, kill them in `cleanup` before removing files: `jobs -p | xargs kill 2>/dev/null || true` in bash, or track PIDs in a variable for POSIX sh.

### Output
Script with traps.

### Quality Gate
- `grep -c 'trap cleanup EXIT' "$script_path"` prints `1`.
- No other `EXIT` trap exists.

---

## Phase 3: Prove Cleanup in Three Exits

### Entry Criteria
- Traps installed.

### Actions
1. Temporarily print the temp path at debug level (`debug "tmp_dir=$tmp_dir"`) and run with `LOG_LEVEL=debug`. Use a fresh `TMPDIR` so leftovers are easy to count: `export TMPDIR=$(mktemp -d)`.
2. Success: run normally; expect rc 0 and `ls -A "$TMPDIR"` empty.
3. Failure: force an error (pass a nonexistent input); expect the documented nonzero rc and `ls -A "$TMPDIR"` empty.
4. Interrupt: start it on a slow input in the background, `kill -INT` it, `wait`; expect rc 130 and `ls -A "$TMPDIR"` empty. Note: a background job in a non-interactive shell may ignore SIGINT; if rc is not 130, repeat with `kill -TERM` (expect 143) and record both.
5. If `shell_dialect` is posix, repeat step 4 with `dash "$script_path"`.

### Output
`cleanup_contract`.

### Quality Gate
- All three runs show the expected rc.
- `ls -A "$TMPDIR" | wc -l` prints `0` after each run.

---

## Worked Example

Illustrative only.

```
$ export TMPDIR=$(mktemp -d)
$ LOG_LEVEL=debug bin/build-bundle src/ out.tgz; echo "rc=$?"; ls -A "$TMPDIR" | wc -l
2026-10-20T15:00:01Z debug build-bundle[812]: tmp_dir=/tmp/tmp.k2/build-bundle.Q8rT1x
rc=0
0
$ bin/build-bundle missing/ out.tgz; echo "rc=$?"; ls -A "$TMPDIR" | wc -l
build-bundle: line 48: tar -C "$src" -cf "$tmp_dir/b.tar" . exited 2
rc=2
0
$ bin/build-bundle big/ out.tgz & p=$!; sleep 2; kill -TERM $p; wait $p; echo "rc=$?"; ls -A "$TMPDIR" | wc -l
rc=143
0
```

---

## Exit Criteria

DONE when all scratch paths come from one `mktemp -d`, one `EXIT` trap removes it, and cleanup is proven on success, failure and signal.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `TMPDIR` is on a `noexec` mount and the script executes a temp file | **Adjust**: run it with `sh "$file"` instead of executing it, or use a directory under `$HOME`. |
| Phase 2 | A library sourced by the script sets its own `EXIT` trap | **Adjust**: remove it there and call its cleanup from this `cleanup`. |
| Phase 3 | Leftover files after interrupt | **Retry**: check the trap was installed before `mktemp` ran and that no subshell created the directory. |
| Phase 3 | rc is 0 after a forced failure | **Stop**: `cleanup` is overwriting the status; confirm `rc=$?` is its first line. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
