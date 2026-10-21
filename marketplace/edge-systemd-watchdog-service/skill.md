# Edge systemd Watchdog Service

**One-line description:** Runs the inference application as a systemd service of `Type=notify` with `WatchdogSec`, sends `READY=1` and periodic `WATCHDOG=1` from the inference loop in Python or C++, limits restart storms, and proves the watchdog fires by freezing the process with SIGSTOP.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `app_command` (string, required): The start command produced by the runtime flow (`edge-py-trt-inference-runtime`, `edge-cpp-trt-inference-runtime` or `edge-deepstream-nvinfer-pipeline`).
- `deploy_record` (object, required): Output of `edge-ota-ab-swap-rollback`; the service reads the model from `/opt/edge-models/current`.
- `stack` (string, required): `python`, `cpp` or `deepstream`.

---

## Outputs

- `service_unit` (object): The unit file text and path, the watchdog interval and restart policy (user values), the notify code location in the app, `systemctl show` output for the watchdog and restart properties, and the journal lines from the SIGSTOP test.

---

## Phase 1: Add Notify Calls to the App

### Entry Criteria
- `app_command` runs the app to completion of at least one inference loop.

### Actions
1. Place calls by `stack`:

| `stack` | READY | Heartbeat |
|---|---|---|
| `python` | `from systemd import daemon; daemon.notify("READY=1")` after the engine loads (package `python3-systemd`) | `daemon.notify("WATCHDOG=1")` once per completed inference |
| `cpp` | `#include <systemd/sd-daemon.h>`, `sd_notify(0, "READY=1");` after the engine loads; link `-lsystemd` (package `libsystemd-dev`) | `sd_notify(0, "WATCHDOG=1");` once per completed inference |
| `deepstream` | In the app's bus or probe callback after the first buffer leaves nvinfer, call `sd_notify(0, "READY=1")` | From a pad probe on the nvinfer src pad, at most once per interval |

2. Send the heartbeat from the inference path itself, after outputs are produced. A heartbeat from a separate timer thread keeps reporting healthy while inference is stuck.
3. If the inference rate can be higher than needed, rate-limit the heartbeat to once per second; it must still be more frequent than half of `WatchdogSec` (systemd.service documentation recommends sending at half the interval or more often).

Do NOT: call `WATCHDOG=1` before the first inference completes.

### Output
App with notify calls.

### Quality Gate
- `grep -n "WATCHDOG=1"` finds the call inside the per-inference code path.
- `grep -n "READY=1"` finds the call after engine load.

---

## Phase 2: Write the Unit

### Entry Criteria
- Notify calls added.

### Actions
1. Create `/etc/systemd/system/edge-infer.service`:
   ```
   [Unit]
   Description=Edge inference service
   After=network-online.target
   StartLimitIntervalSec=<user value>
   StartLimitBurst=<user value>

   [Service]
   Type=notify
   NotifyAccess=main
   ExecStart=<app_command>
   WatchdogSec=<user value>
   TimeoutStartSec=<user value covering engine rebuild time>
   Restart=on-failure
   RestartSec=<user value>
   WorkingDirectory=/opt/edge-app

   [Install]
   WantedBy=multi-user.target
   ```
2. If `ExecStart` is a shell wrapper, use `exec` in the wrapper or set `NotifyAccess=all`; otherwise the notifying PID is not the main PID and messages are dropped.
3. Containerized app: `NOTIFY_SOCKET` must be bind-mounted into the container and the variable passed; follow the docker and systemd docs, or use `Type=simple` with a container health check instead and record that the systemd watchdog is not in use.
4. `sudo systemd-analyze verify /etc/systemd/system/edge-infer.service`, then `sudo systemctl daemon-reload && sudo systemctl enable --now edge-infer`.

### Output
Enabled unit.

### Quality Gate
- `systemd-analyze verify` prints no errors.
- `systemctl show edge-infer -p WatchdogUSec -p Type -p Restart` shows the configured values.

---

## Phase 3: Prove It Fires

### Entry Criteria
- Service active.

### Actions
1. Freeze the main process: `sudo kill -STOP $(systemctl show -p MainPID --value edge-infer)`.
2. Wait longer than `WatchdogSec`. Read `journalctl -u edge-infer --since "-5min"`. Expect a line that the watchdog timeout was reached, followed by the service being killed and restarted.
3. Confirm the service is active again with a new MainPID.
4. Hardware watchdog (optional, user decision): check `ls /dev/watchdog*` and `wdctl`. `RuntimeWatchdogSec=` in `/etc/systemd/system.conf` makes PID 1 pet the hardware watchdog; this reboots the device if systemd itself hangs. Record whether it is enabled; do not enable it without the user's approval.
5. Assemble `service_unit`.

### Output
`service_unit`.

### Quality Gate
- The journal shows a watchdog timeout and a restart after SIGSTOP.
- MainPID after the test differs from MainPID before.

---

## Worked Example

Illustrative only.

```
$ sudo kill -STOP 4182
$ journalctl -u edge-infer --since "-5min"
edge-infer.service: Watchdog timeout (limit 10s)!
edge-infer.service: Killing process 4182 (python) with signal SIGABRT.
edge-infer.service: Main process exited, code=dumped, status=6/ABRT
edge-infer.service: Scheduled restart job, restart counter is at 1.
Started edge-infer.service - Edge inference service.
```

---

## Exit Criteria

DONE when the service runs under `Type=notify` with a watchdog that has been shown to restart a frozen process.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ModuleNotFoundError: systemd` | **Adjust**: `sudo apt install python3-systemd` and use a venv with `--system-site-packages`. |
| Phase 2 | Service stuck in `activating` | **Adjust**: READY=1 is not reaching systemd; check `NotifyAccess` and the wrapper. |
| Phase 2 | Start times out during engine rebuild | **Adjust**: raise `TimeoutStartSec` per the user's measured rebuild time. |
| Phase 3 | No restart after SIGSTOP | **Stop**: the heartbeat comes from another thread or process; fix Phase 1. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
