# ETL Cron Runner with flock, timeout and Retries

**One-line description:** Runs the batch pipeline from cron safely with a bash wrapper: `set -Eeuo pipefail`, a non-blocking `flock` lock so runs never overlap, `timeout` per attempt, a bounded retry loop, an explicit date argument for reruns and backfills, a dead-man's-switch ping, and a crontab line tested under cron's minimal environment with `env -i`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_contract` (object, required): Output of `etl-target-schema-contract` (pipeline name, alert destination).
- `late_data_policy` (object, required): Output of `etl-late-arriving-data-policy` (how many past days each run reprocesses).
- `project_dir` (string, required): Repository root; the wrapper goes in `<project_dir>/bin/`.

---

## Outputs

- `cron_wrapper` (string): Path to `bin/run_<pipeline>.sh`, passing `bash -n` and `shellcheck`.
- `crontab_entry` (string): The exact crontab line(s) installed, and the output of a test run under `env -i`.

---

## Phase 1: Write the Wrapper

### Entry Criteria
- Linux host with GNU coreutils (`timeout --version` and `date --version` print GNU) and util-linux `flock` (`flock --version`). On macOS/BSD these differ; stop and use the orchestrator flows instead.

### Actions
1. Edit ONE file, `bin/run_orders.sh`:
   ```bash
   #!/usr/bin/env bash
   set -Eeuo pipefail
   export PATH=/usr/local/bin:/usr/bin:/bin
   export TZ=UTC
   cd "$(dirname "$0")/.."

   RUN_DATE="${1:-$(date -u -d 'yesterday' +%F)}"     # explicit date allows reruns
   ATTEMPTS="${ETL_ATTEMPTS:?set ETL_ATTEMPTS}"        # user value
   ATTEMPT_TIMEOUT="${ETL_ATTEMPT_TIMEOUT:?set ETL_ATTEMPT_TIMEOUT}"   # e.g. 3600s, user value
   SLEEP_BASE="${ETL_SLEEP_BASE:?set ETL_SLEEP_BASE}"  # seconds, user value
   LOCK=/var/lock/etl_orders.lock

   exec 9>"$LOCK"
   if ! flock -n 9; then
     echo "$(date -u +%FT%TZ) skip: previous run still holds $LOCK"
     exit 0
   fi

   ping_hc() { [ -n "${HEARTBEAT_URL:-}" ] && curl -fsS -m 10 --retry 3 "$HEARTBEAT_URL$1" >/dev/null || true; }
   ping_hc /start

   attempt=1
   until timeout --kill-after=60s "$ATTEMPT_TIMEOUT" \
         .venv/bin/python -m pipelines.run_orders --date "$RUN_DATE"; do
     rc=$?
     echo "$(date -u +%FT%TZ) attempt $attempt failed rc=$rc"
     if [ "$attempt" -ge "$ATTEMPTS" ]; then ping_hc "/$rc"; exit "$rc"; fi
     sleep $(( SLEEP_BASE * 2 ** (attempt - 1) ))
     attempt=$(( attempt + 1 ))
   done
   ping_hc /0
   echo "$(date -u +%FT%TZ) ok date=$RUN_DATE attempts=$attempt"
   ```
2. Notes a weak model must not change:
   - `flock -n` on fd 9 holds the lock for the life of the script, including retries; the lock is released when the process exits, even on kill.
   - `timeout` exits 124 when the time limit is hit; `--kill-after` sends SIGKILL if the process ignores SIGTERM.
   - Exit code 0 on a skipped overlapping run is deliberate: the freshness check, not cron, detects a stuck run.
   - The `/start`, `/0`, `/<rc>` suffixes match healthchecks.io ping URLs; for another monitor, use its documented URLs.
   - `RUN_DATE` defaults to yesterday in UTC; the Python entry point reprocesses `[RUN_DATE - lookback, RUN_DATE]` from `late_data_policy`.
3. `chmod +x bin/run_orders.sh`.

### Output
`cron_wrapper`.

### Quality Gate
- `bash -n bin/run_orders.sh` exits 0.
- `shellcheck bin/run_orders.sh` prints no errors (warnings must be read and either fixed or justified in a comment).

---

## Phase 2: Test Like Cron

### Entry Criteria
- Wrapper passes lint.

### Actions
1. Cron runs with a minimal environment (no login profile, short PATH, `SHELL=/bin/sh`). Reproduce it:
   ```bash
   env -i HOME="$HOME" ETL_ATTEMPTS=3 ETL_ATTEMPT_TIMEOUT=3600s ETL_SLEEP_BASE=30 \
     /bin/sh -c '/opt/etl/bin/run_orders.sh 2026-10-19' ; echo "rc=$?"
   ```
   (The numbers are the user's values for this test.)
2. Overlap test: start the wrapper in one terminal, then start it again in a second; the second must print `skip: previous run still holds` and exit 0 immediately.
3. Failure test on dev: set `SOURCE_DSN` to an unreachable host; confirm the log shows N attempts with growing sleeps and the final exit code is non-zero.

### Output
Test logs.

### Quality Gate
- The `env -i` run prints `ok date=2026-10-19` and `rc=0`; the overlap test prints the skip line; the failure test prints `attempt N failed` lines equal to `ETL_ATTEMPTS`.

---

## Phase 3: Install the Crontab Entry

### Entry Criteria
- All three tests pass.

### Actions
1. Install for the service user with `crontab -e -u etl` (or a file in `/etc/cron.d/` with a user column). Entry:
   ```cron
   MAILTO=""
   ETL_ATTEMPTS=3
   ETL_ATTEMPT_TIMEOUT=3600s
   ETL_SLEEP_BASE=30
   HEARTBEAT_URL=https://hc-ping.com/<uuid>
   15 3 * * * /opt/etl/bin/run_orders.sh >> /var/log/etl/orders.log 2>&1
   ```
   Values are the user's. A `%` in a crontab command line is a newline unless escaped as `\%`; that is why the date logic lives in the script.
2. Cron's time zone is the system zone. `CRON_TZ` is supported by some cron implementations (cronie) and not others; check `man 5 crontab` on the host before relying on it.
3. Add log rotation: `/etc/logrotate.d/etl-orders` with the `daily`, `rotate <n>`, `compress`, `missingok` directives.
4. Confirm installation: `crontab -l -u etl`.

### Output
`crontab_entry`.

### Quality Gate
- `crontab -l -u etl` shows the line, and after the first scheduled time `tail -n 5 /var/log/etl/orders.log` shows an `ok` or `attempt` line with that date.

---

## Worked Example

Illustrative.
```
$ shellcheck bin/run_orders.sh && echo clean
clean
$ env -i HOME=/home/etl ETL_ATTEMPTS=3 ETL_ATTEMPT_TIMEOUT=3600s ETL_SLEEP_BASE=30 /bin/sh -c '/opt/etl/bin/run_orders.sh 2026-10-19'; echo rc=$?
2026-10-20T09:12:44Z ok date=2026-10-19 attempts=1
rc=0
(second terminal during the run)
2026-10-20T09:12:51Z skip: previous run still holds /var/lock/etl_orders.lock
```

---

## Exit Criteria

DONE when the wrapper is lint-clean, cannot overlap, retries with bounded attempts and timeouts, accepts an explicit date, pings a heartbeat, and its crontab line is installed and tested under `env -i`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flock` or GNU `date -d` missing | **Stop**: install util-linux/coreutils or use an orchestrator flow. |
| Phase 2 | Works in a shell, fails under `env -i` | **Adjust**: a needed variable or PATH entry comes from your profile; set it in the script or crontab. |
| Phase 2 | `/var/lock` not writable | **Adjust**: use a lock path the service user owns, such as `/run/user/<uid>/` or the project's `var/`. |
| Phase 3 | Job never runs | **Return**: check the cron daemon log (`journalctl -u cron` or `-u crond`) for the user's entries. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
