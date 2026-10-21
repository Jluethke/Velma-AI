# Exit Status Contract

**One-line description:** Defines and enforces a documented exit code table for a shell script (0, 1, usage error, `sysexits.h` codes where they fit, 128+N for signals), replaces bare `exit` and `return` with named codes, and verifies each code is reachable with `echo $?` checks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script to fix.
- `cli_interface` (object, required): From `shs-getopts-arg-parsing`; carries the chosen usage-error code.

---

## Outputs

- `exit_code_table` (object[]): Each code, its constant name in the script, meaning, and the command that reproduces it.

---

## Phase 1: Define the Table

### Entry Criteria
- `cli_interface.usage_exit_code` is set.

### Actions
1. Start from these fixed meanings; never reuse one for something else:

| Code | Meaning | Source |
|---|---|---|
| 0 | Success | POSIX |
| 1 | General failure | Convention |
| 2 or 64 | Usage error (from `cli_interface`) | bash builtin convention / `EX_USAGE` |
| 65 | Input data malformed (`EX_DATAERR`) | `sysexits.h` |
| 66 | Input file missing or unreadable (`EX_NOINPUT`) | `sysexits.h` |
| 69 | Required service unavailable (`EX_UNAVAILABLE`) | `sysexits.h` |
| 73 | Cannot create output file (`EX_CANTCREAT`) | `sysexits.h` |
| 75 | Temporary failure, retry later (`EX_TEMPFAIL`) | `sysexits.h` |
| 77 | Permission denied (`EX_NOPERM`) | `sysexits.h` |
| 78 | Configuration error (`EX_CONFIG`) | `sysexits.h` |
| 126 | Command found but not executable | shell, reserved |
| 127 | Command not found | shell, reserved |
| 128+N | Killed by signal N (130 = SIGINT, 143 = SIGTERM) | shell, reserved |

2. Keep only the rows the script actually needs, based on `script_requirements` failure modes. Do NOT invent extra codes above 78 and below 126 without documenting them; codes above 255 wrap modulo 256.

### Output
Draft table.

### Quality Gate
- Every kept code has a meaning and a source column.
- No code in 126 to 255 is used for an application meaning.

---

## Phase 2: Enforce It in the Script

### Entry Criteria
- Draft table exists.

### Actions
1. Add readonly constants near the top: `readonly EX_OK=0 EX_USAGE=2 EX_NOINPUT=66 EX_TEMPFAIL=75` (use only the kept rows).
2. Replace every `exit 1` and bare `exit` with the right constant. Find them with `grep -nE '\bexit\b' "$script_path"`.
3. Make `die` take a code: `die() { local code=$1; shift; printf '%s: %s\n' "$SCRIPT_NAME" "$*" >&2; exit "$code"; }` (POSIX: drop `local`, name the variable `die_code`).
4. Add an "EXIT STATUS" block to `usage` listing the table.
5. When the script runs another program and should pass its status through, use `exec prog "$@"` as the last line, or `prog "$@" || exit $?`. Do not write `prog; exit 0`.

### Output
Edited script.

### Quality Gate
- `grep -nE '\bexit [0-9]' "$script_path"` returns only the usage path or nothing; all others use constants.
- `"$script_path" -h` shows the EXIT STATUS block.

---

## Phase 3: Reproduce Every Code

### Entry Criteria
- Edits complete.

### Actions
1. For each row, craft the triggering command and run it, then `echo "rc=$?"`:
   - Usage: `"$script_path" -z`.
   - No input: `"$script_path" /nonexistent`.
   - Signal: `"$script_path" long-input & pid=$!; sleep 1; kill -TERM "$pid"; wait "$pid"; echo "rc=$?"` (expect 143 unless a trap re-exits with another code).
2. Record each command and result in `exit_code_table`.

### Output
`exit_code_table`.

### Quality Gate
- Every kept code has a reproducing command whose printed `rc=` matches.

---

## Worked Example

Illustrative only.

Table kept: 0, 1, 2, 66, 75. Constants: `readonly EX_OK=0 EX_FAIL=1 EX_USAGE=2 EX_NOINPUT=66 EX_TEMPFAIL=75`.

```
$ bin/sync-backup -z; echo "rc=$?"
sync-backup: unknown option -z
rc=2
$ bin/sync-backup /missing.conf; echo "rc=$?"
sync-backup: cannot read /missing.conf
rc=66
$ bin/sync-backup --lock-held-test; echo "rc=$?"
sync-backup: another run holds the lock
rc=75
```

---

## Exit Criteria

DONE when every exit path uses a documented constant and each code is reproduced by a recorded command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Caller (CI, systemd, monitoring) already expects specific codes | **Adjust**: keep the caller's codes and document them; do not renumber. |
| Phase 3 | A code cannot be triggered | **Adjust**: either the path is dead code (remove the code from the table) or the test input is wrong; record which. |
| Phase 3 | Signal run returns 0 | **Stop**: a trap swallows the signal; fix in `shs-mktemp-trap-cleanup` before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
