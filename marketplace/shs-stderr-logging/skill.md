# Logging to stderr

**One-line description:** Gives a shell script one set of logging functions that write timestamped, leveled messages to stderr only, keep stdout for data so pipes stay clean, honor `NO_COLOR` and `[ -t 2 ]` for color, optionally mirror to syslog with `logger -t`, and proves stdout carries only data.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script to fix.
- `shell_dialect` (string, required): `bash` or `posix`.

---

## Outputs

- `logging_contract` (object): The log function names, line format, level variable, where each stream goes, and the stdout-purity test result.

---

## Phase 1: Add the Logging Functions

### Entry Criteria
- The script parses.

### Actions
1. Insert after the strict-mode lines (POSIX-safe; works in bash too):

```sh
LOG_LEVEL=${LOG_LEVEL:-info}        # debug, info, warn, error
log_rank() { case $1 in debug) echo 0;; info) echo 1;; warn) echo 2;; error) echo 3;; *) echo 1;; esac; }
log() {
  lvl=$1; shift
  [ "$(log_rank "$lvl")" -ge "$(log_rank "$LOG_LEVEL")" ] || return 0
  printf '%s %s %s[%s]: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$lvl" "$SCRIPT_NAME" "$$" "$*" >&2
}
debug() { log debug "$@"; }
info()  { log info "$@"; }
warn()  { log warn "$@"; }
error() { log error "$@"; }
```

2. `date -u +%Y-%m-%dT%H:%M:%SZ` is portable across GNU, BSD and busybox; do NOT use `date -Iseconds` (GNU only) or `%N` (not in BSD date).
3. Color only when allowed: `if [ -t 2 ] && [ -z "${NO_COLOR:-}" ]; then` wrap the level word in ANSI codes. `NO_COLOR` is the convention at `no-color.org`.
4. If `script_requirements.invoker` is cron and messages must survive, also send warn and error to syslog: `logger -t "$SCRIPT_NAME" -p user.warning -- "$*"` (`logger` is in util-linux, BSD and busybox). Under systemd, stderr already goes to the journal; do not add `logger`.

### Output
Script with logging functions.

### Quality Gate
- `grep -c '>&2' "$script_path"` is at least 1 inside `log`.
- The script parses.

---

## Phase 2: Route Every Message

### Entry Criteria
- Logging functions present.

### Actions
1. List every `echo` and `printf`: `grep -nE '\b(echo|printf)\b' "$script_path"`.
2. Classify each with this rule:
   - Output a caller would pipe or capture (file lists, IDs, JSON, the result): stays on stdout as `printf '%s\n'`.
   - Progress, status, warnings, errors, prompts: replace with `info`, `warn`, `error`, or `debug`.
3. Replace `set -x` debugging left in the script with `debug` calls, or gate it: `[ "${TRACE:-0}" = 1 ] && set -x`. In bash, `export PS4='+ ${BASH_SOURCE##*/}:${LINENO}: '` makes the trace show file and line.
4. Do NOT log secrets: never pass tokens or passwords to `log`. Search `grep -niE 'token|password|secret|apikey' "$script_path"` and check each hit is not logged.

### Output
Edited script.

### Quality Gate
- Every `echo`/`printf` from step 1 is classified in `logging_contract` as data or log.
- The secret search shows no log call containing a secret variable.

---

## Phase 3: Prove stdout Purity

### Entry Criteria
- Routing done.

### Actions
1. Run `"$script_path" <normal args> 2>/dev/null > out.txt`; `out.txt` must contain only data.
2. Run `"$script_path" <normal args> 1>/dev/null 2> err.txt`; `err.txt` must contain only log lines matching the format: `grep -vcE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:]{8}Z (debug|info|warn|error) ' err.txt` prints `0`.
3. Run with `LOG_LEVEL=error` and check no info lines appear.

### Output
`logging_contract` with test results.

### Quality Gate
- `out.txt` has no log-format lines: `grep -cE ' (info|warn|error|debug) ' out.txt` prints `0`.
- `err.txt` non-format line count is `0`.

---

## Worked Example

Illustrative only.

```
$ bin/list-stale 2>/dev/null
/srv/a/old.tar
/srv/b/old2.tar
$ bin/list-stale >/dev/null
2026-10-20T14:03:11Z info list-stale[4120]: scanning /srv
2026-10-20T14:03:12Z warn list-stale[4120]: /srv/c unreadable, skipped
$ bin/list-stale 2>/dev/null | wc -l   # data pipe is clean
2
```

---

## Exit Criteria

DONE when all messages go through the leveled functions to stderr, stdout carries only data, and the purity tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `date` missing in a minimal container | **Adjust**: drop the timestamp field; keep level and name. |
| Phase 2 | Unsure whether a message is data | **Adjust**: if any documented caller parses it, it is data; otherwise it is a log. |
| Phase 3 | Log lines appear in `out.txt` | **Retry**: find the remaining `echo` with `grep -n echo` and route it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
