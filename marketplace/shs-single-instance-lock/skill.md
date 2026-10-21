# Single-Instance Lock

**One-line description:** Stops two copies of a script (overlapping cron runs, double-clicked deploys) from running at once, using `flock(1)` on a file descriptor where util-linux is present and an atomic `mkdir` lock with PID-based stale detection elsewhere (macOS, busybox without flock), and proves the second copy exits with `EX_TEMPFAIL` (75).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script to protect.
- `target_platforms` (string[], required): Decides whether `flock` is available.

---

## Outputs

- `lock_contract` (object): Lock method, lock path, behavior when busy (exit code or wait), stale-lock rule, and the two-copy test result.

---

## Phase 1: Choose the Lock Method

### Entry Criteria
- Platforms known.

### Actions
1. Probe each platform: `command -v flock`. util-linux provides it on most Linux distributions; busybox may include a `flock` applet depending on build; macOS does not ship it.
2. Decide:

| All platforms have `flock` | Method |
|---|---|
| yes | `flock` on file descriptor 9 |
| no | `mkdir` lock directory |

3. Choose the lock path: `/run/lock/$SCRIPT_NAME.lock` (or `/var/lock/`) when running as root on Linux; otherwise `${XDG_RUNTIME_DIR:-${TMPDIR:-/tmp}}/$SCRIPT_NAME.lock`. Use the same path for every run, never a `mktemp` name.
4. Choose busy behavior: exit immediately with 75 (`EX_TEMPFAIL`, cron will retry next time) or wait with a timeout given by the user. Do not invent a timeout value.

### Output
Method, path, busy behavior.

### Quality Gate
- The `command -v flock` result is recorded for each platform.
- The lock path is fixed, not random.

---

## Phase 2: Implement

### Entry Criteria
- Method chosen.

### Actions
1. flock method (bash or POSIX sh; place at the start of `main`):

```sh
lock_file=/run/lock/${SCRIPT_NAME}.lock
exec 9>"$lock_file" || die 73 "cannot open $lock_file"
if ! flock -n 9; then
  error "another instance is running (lock $lock_file)"
  exit 75
fi
# lock is released automatically when the process exits and fd 9 closes
```

   For waiting instead: `flock -w "$lock_wait_seconds" 9`. Do NOT delete the lock file at exit; deleting it lets a third process lock a new inode while the second still holds the old one.
2. mkdir method:

```sh
lock_dir=${TMPDIR:-/tmp}/${SCRIPT_NAME}.lock.d
if mkdir "$lock_dir" 2>/dev/null; then
  printf '%s\n' "$$" > "$lock_dir/pid"
  # add to cleanup(): rm -rf -- "$lock_dir"
else
  old_pid=$(cat "$lock_dir/pid" 2>/dev/null || true)
  if [ -n "$old_pid" ] && ! kill -0 "$old_pid" 2>/dev/null; then
    error "removing stale lock from dead pid $old_pid"
    rm -rf -- "$lock_dir"
    mkdir "$lock_dir" || exit 75
    printf '%s\n' "$$" > "$lock_dir/pid"
  else
    error "another instance is running (pid ${old_pid:-unknown})"
    exit 75
  fi
fi
```

   `mkdir` is atomic: exactly one process succeeds. Add the `rm -rf -- "$lock_dir"` line to the existing `cleanup` function from `shs-mktemp-trap-cleanup`; do not add a second `EXIT` trap. `kill -0` returns failure for a PID owned by another user too, so run all copies as the same user.
3. Document the lock in `usage` and add 75 to the exit code table.

### Output
Edited script.

### Quality Gate
- The script parses.
- Exactly one `trap ... EXIT` still exists (`grep -c 'trap .* EXIT' "$script_path"` prints `1`).

---

## Phase 3: Test Two Copies

### Entry Criteria
- Lock implemented.

### Actions
1. Start copy A on a slow path in the background: `"$script_path" <slow args> & a=$!`.
2. Wait until A holds the lock (poll the lock file or `pid` file in a short loop; do not rely on a fixed sleep).
3. Run copy B in the foreground: `"$script_path" <args>; echo "B rc=$?"`. Expect `B rc=75` and the "another instance" message.
4. `wait "$a"; echo "A rc=$?"`. Expect 0.
5. Run copy C after A finished; expect it to take the lock and exit 0.
6. mkdir method only: create a stale lock (`mkdir "$lock_dir"; echo 999999 > "$lock_dir/pid"`), run once, expect the stale message and exit 0.

### Output
`lock_contract`.

### Quality Gate
- B exits 75, A and C exit 0.
- Stale-lock run exits 0 (mkdir method).

---

## Worked Example

Illustrative only.

Platforms Ubuntu 22.04 and macOS 14: macOS lacks `flock`, so the mkdir method is used everywhere.

```
$ bin/sync --slow & a=$!
$ until [ -f "${TMPDIR:-/tmp}/sync.lock.d/pid" ]; do :; done
$ bin/sync; echo "B rc=$?"
2026-10-20T16:10:00Z error sync[9001]: another instance is running (pid 8990)
B rc=75
$ wait $a; echo "A rc=$?"
A rc=0
```

---

## Exit Criteria

DONE when concurrent copies are refused with 75, sequential copies run, and stale locks are recovered (mkdir method).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lock directory not writable by the running user | **Adjust**: use the per-user path under `XDG_RUNTIME_DIR` or `TMPDIR`. |
| Phase 2 | Lock file is on NFS | **Stop**: `flock` and `mkdir` semantics on network filesystems vary; place the lock on a local filesystem. |
| Phase 3 | B also runs | **Retry**: confirm A had acquired the lock before B started and that both use the same path. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
