# Linux systemd Isolation and Software Watchdog

**One-line description:** Runs the monitor as its own systemd service (`Type=notify`) with `WatchdogSec=`, `Restart=`, CPU affinity and sandboxing keys, sends `READY=1` and `WATCHDOG=1` through `sd_notify`, and proves the software watchdog fires by freezing the process with `SIGSTOP`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `independence_plan` (object, required): Output of `rmon-independence-analysis` (process-level separation and CPU assignment).
- `monitor_command` (string, required): Absolute path and arguments of the monitor executable or Python entry point.

---

## Outputs

- `systemd_unit` (object): Unit file path, its text, `systemd-analyze verify` result, and the journal lines that show a watchdog timeout and restart during the test.

---

## Phase 1: Add Watchdog Notifications to the Monitor

### Entry Criteria
- Target runs systemd: `systemctl --version` prints a version.
- The watchdog interval is a user input or derived from the FTTI budget in `fallback_strategy`; it is not chosen here.

### Actions
1. Read the interval systemd passes: environment variable `WATCHDOG_USEC`. Send `WATCHDOG=1` at less than half that interval, as recommended in `man sd_watchdog_enabled`.
2. C or C++: link `libsystemd` (`pkg-config --libs libsystemd`) and call `sd_notify(0, "READY=1")` after initialization and `sd_notify(0, "WATCHDOG=1")` from the main monitor loop. Python: `pip install sdnotify` and use `sdnotify.SystemdNotifier().notify("WATCHDOG=1")`, or the `systemd.daemon.notify` function from the `python-systemd` package.
3. Send `WATCHDOG=1` only after a full successful monitor cycle (inputs read, checks run, outputs written). Pinging from a separate thread that does no monitoring hides a hung monitor loop.

### Output
Monitor code that notifies systemd.

### Quality Gate
- `rg -n "WATCHDOG=1" <monitor_src>` returns exactly the main-loop call site.
- `rg -n "READY=1" <monitor_src>` returns one line after initialization.

---

## Phase 2: Write the Unit

### Entry Criteria
- Notifications in place.

### Actions
1. Create `/etc/systemd/system/runtime-monitor.service` (use your own name):
   ```ini
   [Unit]
   Description=Runtime safety monitor
   After=network-online.target

   [Service]
   Type=notify
   ExecStart=<monitor_command>
   WatchdogSec=<interval from input>
   Restart=on-failure
   RestartSec=<from requirements>
   User=monitor
   NoNewPrivileges=yes
   ProtectSystem=strict
   ProtectHome=yes
   PrivateTmp=yes
   ReadWritePaths=<log_dir>
   CPUAffinity=<cpus from independence_plan>
   MemoryMax=<from requirements>

   [Install]
   WantedBy=multi-user.target
   ```
2. Restart semantics: a restarted monitor starts in the state required by `rmon-simplex-switch-logic` (latched SAFETY or SAFE_STOPPED), never in ADVANCED. A restart must not silently re-enable the advanced controller.
3. If real-time scheduling is required, add `CPUSchedulingPolicy=fifo` and `CPUSchedulingPriority=<value from requirements>`; check `man systemd.exec` for the keys.
4. Verify: `sudo systemd-analyze verify /etc/systemd/system/runtime-monitor.service`.

### Output
Unit file.

### Quality Gate
- `systemd-analyze verify` prints no errors for the unit.
- `systemctl show runtime-monitor -p WatchdogUSec` prints a non-zero value after `sudo systemctl daemon-reload`.

---

## Phase 3: Prove the Watchdog Fires

### Entry Criteria
- Bench only; actuators disconnected or behind an independent hardware emergency stop.

### Actions
1. `sudo systemctl start runtime-monitor`; confirm `systemctl status runtime-monitor` shows `active (running)`.
2. Freeze the monitor: `sudo kill -STOP $(systemctl show -p MainPID --value runtime-monitor)`.
3. Wait longer than `WatchdogSec`, then read `journalctl -u runtime-monitor -n 20 --no-pager`. Expect a line containing `Watchdog timeout` followed by the service being killed and restarted.
4. Confirm the restarted monitor logged `startup` with switch state latched (not ADVANCED).
5. Confirm the actuator side reacted to the monitor's absence as specified in `fallback_strategy`; this depends on the hardware watchdog (`rmon-linux-hw-watchdog`), not on systemd.

### Output
`systemd_unit`.

### Quality Gate
- The journal output contains `Watchdog timeout`.
- The first event record after restart has `event: startup` and `switch_state` not equal to `ADVANCED`.

---

## Worked Example

Illustrative only.
```
$ systemctl show runtime-monitor -p WatchdogUSec
WatchdogUSec=200ms
$ sudo kill -STOP 4127
$ journalctl -u runtime-monitor -n 5 --no-pager
Mar 04 15:10:02 bench systemd[1]: runtime-monitor.service: Watchdog timeout (limit 200ms)!
Mar 04 15:10:02 bench systemd[1]: runtime-monitor.service: Killing process 4127 (speed_monitor) with signal SIGABRT.
Mar 04 15:10:03 bench systemd[1]: runtime-monitor.service: Scheduled restart job, restart counter is at 1.
```

---

## Exit Criteria

DONE when the monitor runs as its own notify-type service, pings the watchdog only after full cycles, the SIGSTOP test produces a watchdog timeout and restart, and the restart comes up latched.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `WATCHDOG_USEC` not set | **Adjust**: confirm `WatchdogSec=` is in the unit and the service was restarted after `daemon-reload`. |
| Phase 2 | `systemd-analyze verify` reports unknown key | **Retry**: check the key in `man systemd.exec` or `man systemd.service` for your systemd version. |
| Phase 3 | No timeout after SIGSTOP | **Stop**: watchdog pings come from another thread or process; fix Phase 1 before continuing. |
| Phase 3 | Restart comes up in ADVANCED | **Stop**: fix startup state; this is a safety defect. |

**Do not:** ping the watchdog from a helper thread, rely on systemd restart as the safety reaction, or restart into the advanced controller.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
