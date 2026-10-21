# Linux Service Watchdog in Python with systemd Notify

**One-line description:** Adds a systemd service watchdog to a Python control process using `WatchdogSec=` and the `systemd.daemon.notify` call from the python-systemd bindings (or a raw `NOTIFY_SOCKET` datagram), ties each keep-alive to a completed control cycle timed with `time.monotonic()`, and handles the Python-specific traps: keep-alive threads that outlive a stuck main loop, garbage collection pauses and blocking I/O.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`; supplies the detection budget.
- `service_name` (string, required): systemd unit name of the Python process.
- `repo_dir` (string, required): Path to the Python source.

---

## Outputs

- `watchdog_config` (object): `stack` (`linux-python`), `unit_settings`, `notify_method` (python-systemd or socket), `notify_location` (file:line), `cycle_timing_stats`, `test_results`.

---

## Phase 1: Unit File and Notify Method

### Entry Criteria
- `systemctl --version` prints a version.
- The process runs under a known interpreter: `systemctl show -p ExecStart <service_name>` shows the Python path.

### Actions
1. Set in the unit (`sudo systemctl edit --full <service_name>`):
   ```ini
   Type=notify
   NotifyAccess=main
   WatchdogSec=<value from TSR budget>
   Restart=on-failure
   ```
   If the process is started through a wrapper shell script, the main PID is the shell, not Python; either `exec python3 ...` in the script or use `NotifyAccess=all` and record why.
2. Choose the notify method:

   | Situation | Method |
   |---|---|
   | Distribution package `python3-systemd` installable | `from systemd import daemon` then `daemon.notify("WATCHDOG=1")` |
   | Cannot add the binding | send a datagram to the path in env `NOTIFY_SOCKET` with `socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM)`; a leading `@` means an abstract socket, replace it with `\0` |

3. Confirm the binding imports in the service's interpreter: `<python path> -c "from systemd import daemon; print(daemon.notify)"`.
4. `sudo systemctl daemon-reload`.

### Output
Unit settings and notify method.

### Quality Gate
- `systemctl show -p WatchdogUSec <service_name>` prints a non-zero value.
- The import command in action 3 exits 0, or the socket method is recorded.

---

## Phase 2: Keep-Alive Tied to the Cycle

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Read the interval at startup: `usec = int(os.environ.get("WATCHDOG_USEC", "0"))`. If 0, log and keep actuators disabled.
2. After initialization, send `READY=1` once.
3. In the main control loop, send `WATCHDOG=1` only after a cycle that read inputs newer than the previous cycle, computed outputs and wrote them. Time everything with `time.monotonic()`; never `time.time()`, which jumps when NTP adjusts the clock.
4. Do not send keep-alives from a `threading.Thread` or an `asyncio` task that runs independently of the control step: a daemon thread keeps notifying while the main loop is stuck on a blocking read. If the code uses asyncio, notify at the end of the control coroutine's iteration, not from a separate periodic task.
5. Measure cycle time distribution for at least the longest operating mode: record `time.monotonic()` deltas into a list and write percentiles at shutdown. Garbage collection pauses show up as outliers; if the maximum approaches `usec / 2`, investigate with `gc.callbacks` timing before changing anything.
6. Every blocking call in the loop (serial read, socket recv) gets an explicit timeout so a dead peer ends the cycle with an error instead of blocking the keep-alive silently forever (a silent block is still detected, but the cause is lost).

### Output
Source with one notify call in the loop and timing instrumentation.

### Quality Gate
- `rg -n "WATCHDOG=1" <repo_dir>` shows exactly one hit, inside the control loop.
- `rg -n "time\.time\(\)" <repo_dir>` shows no hit in loop timing code.
- `rg -n "Thread\(|create_task\(" <repo_dir>` hits are reviewed and none of them sends `WATCHDOG=1`.

---

## Phase 3: Verify

### Entry Criteria
- Phase 2 gate passed.
- Bench only, actuator power behind the independent hardware emergency stop, wheels off the ground.

### Actions
1. Start: `sudo systemctl restart <service_name>`.
2. Simulate a stuck loop without killing threads: `sudo systemctl kill --signal=SIGSTOP <service_name>`. Expected `Watchdog timeout` in `journalctl -u <service_name>`.
3. Simulate a blocked main loop with a live helper thread: use a test-only flag that makes the loop `time.sleep()` beyond the interval while other threads run. Expected: watchdog timeout still fires. If it does not, a thread is notifying; return to Phase 2.
4. Confirm the software stop request relay drops within the budget (logic analyzer on its coil drive) and that restart does not resume motion.

### Output
`watchdog_config` with test results.

### Quality Gate
- Both tests produce a `Watchdog timeout` line: `journalctl -u <service_name> --since "-10 min" | grep -c "Watchdog timeout"` prints at least 2.
- The capture shows the relay drop time within the budget.

---

## Worked Example

Illustrative only. Python 3.11 control loop at 50 Hz, budget 500 ms, `WatchdogSec=400ms`.

```
$ python3 -c "from systemd import daemon; print(daemon.notify)"
<built-in function notify>
$ sudo systemctl kill --signal=SIGSTOP planner.service
$ journalctl -u planner.service -n 2
planner.service: Watchdog timeout (limit 400ms)!
planner.service: Killing process 3011 (python3) with signal SIGABRT.
```
Test 3 first failed: a `threading.Thread` named `heartbeat` was calling `daemon.notify("WATCHDOG=1")` every 100 ms. After moving the call into the loop, the blocked-loop test produced a timeout.

---

## Exit Criteria

DONE when the Python service is `Type=notify` with an interval from the budget, the only keep-alive is in the control loop, both stuck-process and blocked-loop tests trigger the watchdog, and the stop request relay drops in time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ImportError: No module named systemd` | **Adjust**: install the distribution package or switch to the socket method. |
| Phase 1 | Notifications rejected (journal says reference to a PID not the main PID) | **Adjust**: `exec` Python from the wrapper script. |
| Phase 3 | Blocked-loop test does not time out | **Stop**: find the other notifier with `rg -n "notify" <repo_dir>` and remove it. |
| Phase 3 | Spurious timeouts in normal running | **Adjust**: read the cycle timing percentiles; fix the slow path; do not raise `WatchdogSec` without a budget change. |

**Do not:** put the keep-alive in a background thread, use `time.time()` for cycle timing, or treat the systemd restart as the safety reaction.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
