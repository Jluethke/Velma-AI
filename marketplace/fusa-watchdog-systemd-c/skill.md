# Linux Service Watchdog in C or C++ with systemd sd_notify

**One-line description:** Adds a systemd service watchdog to a C or C++ control process on Linux using `WatchdogSec=` and `sd_notify(0, "WATCHDOG=1")` from libsystemd, sends the keep-alive only after the control loop has completed a verified cycle, chains the machine-level hardware watchdog through `RuntimeWatchdogSec=`, and makes a missed keep-alive open the software stop request relay rather than relying on a restart.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`; supplies the detection budget for the process.
- `service_name` (string, required): systemd unit name of the control process, for example `control.service`.
- `repo_dir` (string, required): Path to the C or C++ source of the process.

---

## Outputs

- `watchdog_config` (object): `stack` (`linux-c`), `unit_settings` (WatchdogSec, Restart, NotifyAccess, Type), `runtime_watchdog`, `notify_location` (file:line), `stop_request_path`, `test_results`.

---

## Phase 1: Unit File and Hardware Watchdog

### Entry Criteria
- The target runs systemd: `systemctl --version` prints a version.
- `pkg-config --modversion libsystemd` prints a version (install the libsystemd development package otherwise).

### Actions
1. Edit the unit with `sudo systemctl edit --full <service_name>` and set in `[Service]`:
   ```ini
   Type=notify
   NotifyAccess=main
   WatchdogSec=<value from TSR budget>
   Restart=on-failure
   ```
   `Restart=on-failure` includes watchdog timeouts; the restart is for availability only, never the safety reaction.
2. Choose `WatchdogSec` from the TSR detection budget. If the budget is unknown, leave the open question and use no value; do not pick one.
3. Machine-level hardware watchdog: check that a device exists with `wdctl` (prints `/dev/watchdog0` identity and timeout). If present, set `RuntimeWatchdogSec=` in `/etc/systemd/system.conf` (or a drop-in under `/etc/systemd/system.conf.d/`) so PID 1 itself is supervised. Reboot or run `sudo systemctl daemon-reexec`, then confirm with `systemctl show -p RuntimeWatchdogUSec`.
4. Reload units: `sudo systemctl daemon-reload`.

### Output
Unit settings and runtime watchdog state.

### Quality Gate
- `systemctl show -p WatchdogUSec <service_name>` prints a non-zero value equal to the chosen `WatchdogSec`.
- `systemctl show -p Type <service_name>` prints `Type=notify`.

---

## Phase 2: Keep-Alive in the Control Loop

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Link libsystemd: CMake `find_package(PkgConfig REQUIRED)`, `pkg_check_modules(SYSTEMD REQUIRED libsystemd)`, `target_link_libraries(control PRIVATE ${SYSTEMD_LIBRARIES})`.
2. At startup, read the interval: `uint64_t usec = 0; int on = sd_watchdog_enabled(0, &usec);`. If `on <= 0`, log and refuse to enable actuators: the process is running without supervision.
3. After initialization succeeds, call `sd_notify(0, "READY=1");`.
4. In the control loop, call `sd_notify(0, "WATCHDOG=1");` only after the cycle has: read fresh inputs (timestamps newer than the last cycle), computed outputs, and written them. The `sd_watchdog_enabled` man page recommends notifying at half the interval or more often; compare the loop period with `usec / 2`.
5. Use `clock_gettime(CLOCK_MONOTONIC, ...)` for all cycle timing, never wall-clock time.
6. Never send `WATCHDOG=1` from a separate thread that does not depend on the control loop's progress.
7. Separately, the process drives the software stop request relay coil (`K_SW` from the stop chain design) through a GPIO only while healthy. Use the libgpiod tools to identify the line (`gpioinfo`). If the process hangs, the coil must drop without the process doing anything: drive the coil through a hardware retriggerable timer or external watchdog that needs continuous toggling, not a static level.

### Output
Source changes with one notify site.

### Quality Gate
- `rg -n "WATCHDOG=1" <repo_dir>` shows exactly one hit, inside the control loop function.
- `rg -n "CLOCK_REALTIME|gettimeofday|time\(NULL\)" <repo_dir>` shows no hit in the control loop timing code.
- The build exits 0.

---

## Phase 3: Verify

### Entry Criteria
- Phase 2 gate passed.
- Bench only, actuator power behind the independent hardware emergency stop, wheels off the ground.

### Actions
1. Start the service: `sudo systemctl restart <service_name>`; confirm `systemctl status <service_name>` shows `active (running)`.
2. Freeze the process: `sudo systemctl kill --signal=SIGSTOP <service_name>`. Watch `journalctl -u <service_name> -f`. Expected: a line containing `Watchdog timeout` after about `WatchdogSec`, then the configured watchdog signal and restart.
3. Measure with a logic analyzer on the `K_SW` coil drive: it must drop within the TSR budget after SIGSTOP, before and independently of the systemd restart.
4. After restart, confirm motion does not resume without the operator reset and a new command.

### Output
`watchdog_config` with test results.

### Quality Gate
- `journalctl -u <service_name> --since "-5 min" | grep -c "Watchdog timeout"` prints at least 1 after the SIGSTOP test.
- Logic analyzer capture shows `K_SW` drop time within the budget.

---

## Worked Example

Illustrative only. `control.service`, TSR budget 500 ms, loop period 20 ms.

```
$ systemctl show -p WatchdogUSec control.service
WatchdogUSec=400ms
$ sudo systemctl kill --signal=SIGSTOP control.service
$ journalctl -u control.service -n 3
control.service: Watchdog timeout (limit 400ms)!
control.service: Killing process 2214 (control) with signal SIGABRT.
control.service: Main process exited, code=dumped, status=6/ABRT
```
Logic analyzer: `K_SW` coil dropped 60 ms after SIGSTOP because the external retriggerable timer stopped being toggled; that is the safety reaction. The systemd restart at 400 ms is availability only.

---

## Exit Criteria

DONE when the unit is `Type=notify` with a watchdog interval from the budget, the single keep-alive depends on loop progress, a frozen process drops the stop request relay within the budget, and restarts do not resume motion.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `wdctl` finds no device | **Adjust**: record that no machine-level watchdog exists; rely on the external timer for `K_SW`. |
| Phase 2 | `sd_watchdog_enabled` returns 0 | **Adjust**: check `WatchdogSec` and that the main PID sends notifications (`NotifyAccess=main`). |
| Phase 3 | No timeout logged | **Stop**: the notify site is not in the loop or another thread notifies; fix and retest. |
| Phase 3 | `K_SW` stays energized while frozen | **Stop**: coil drive is a static level; redesign with a retriggerable timer. |

**Do not:** send keep-alives from a timer thread, use `Restart=` as the safety reaction, or raise `WatchdogSec` to hide slow cycles.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
