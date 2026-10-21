# Linux and ROS 2 Fault Injection with Signals, netem and stress-ng

**One-line description:** Executes the Linux-side rows of a fault injection plan on a bench computer (process hang with SIGSTOP, crash with SIGKILL, network delay and loss with `tc netem`, CPU starvation with `stress-ng`, bench CAN loss with `ip link set down`), measures detection and reaction against each row's pass rule, and always removes the injected fault afterward.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fault_injection_plan` (object[], required): Output of `fusa-fault-injection-campaign-plan`; this flow runs rows with `stack` in `linux-c`, `linux-python`, `ros2`, `can`.
- `service_name` (string, required): systemd unit or executable name of the process under test.
- `bench_interfaces` (string, optional): Names of bench Ethernet and CAN interfaces that may be disturbed, for example `eth1,can1`. Without it, network and CAN rows are skipped.

---

## Outputs

- `fault_injection_results` (object[]): `fi_id`, `host`, `kernel` (`uname -r`), `injection_command`, `cleanup_command`, `detected`, `reaction_time_ms`, `pass`, `capture_file`, `notes`.

---

## Phase 1: Prepare and Baseline

### Entry Criteria
- Bench only: wheels off the ground or actuators uncoupled; actuator power behind the independent hardware emergency stop; stop chain verified today.
- `stress-ng --version`, `tc -V` and (for CAN rows) `ip -V` run.

### Actions
1. Record `uname -r`, `hostname` and the build hash of the software under test.
2. Find the process: `systemctl show -p MainPID <service_name>` or `pgrep -f <service_name>`. For ROS 2 nodes, `ros2 node list` then `pgrep -f <executable>`.
3. Baseline: run the system in normal mode for one minute with the logic analyzer recording the stop request output; confirm zero stop events. A system that stops without injection invalidates every later result.
4. Write the cleanup command for each row before injecting; never inject a fault whose cleanup you have not written down.

### Output
Baseline capture and per-row cleanup commands.

### Quality Gate
- Baseline capture shows no stop event for the full minute.
- Every row to run has a `cleanup_command`.

---

## Phase 2: Inject per Row

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Use the command that matches the row's fault model. Run one row at a time and run its cleanup before the next row.

   | Fault model | Injection | Cleanup |
   |---|---|---|
   | Hang | `sudo kill -STOP <pid>` | `sudo kill -CONT <pid>` |
   | Crash | `sudo kill -9 <pid>` | `sudo systemctl restart <service_name>` |
   | Network delay | `sudo tc qdisc add dev <eth_if> root netem delay <ms>ms` | `sudo tc qdisc del dev <eth_if> root` |
   | Network loss | `sudo tc qdisc add dev <eth_if> root netem loss <pct>%` | `sudo tc qdisc del dev <eth_if> root` |
   | CPU starvation | `stress-ng --cpu 0 --timeout <s>s` (0 means one worker per CPU) | ends at timeout; check with `pgrep stress-ng` |
   | Bench CAN loss | `sudo ip link set <can_if> down` | `sudo ip link set <can_if> up` |

   The delay, loss and duration values come from the plan row; do not choose them here.
2. `netem` applies to egress of the named interface only. Apply it on the sender side of the link the row names, or on both ends if the row says so.
3. Only disturb interfaces listed in `bench_interfaces`. Never apply `netem` or `ip link set down` to the interface you are logged in through.
4. Mark the injection time: log `date +%s.%N` and toggle a marker GPIO if available.
5. Read detection evidence: logic analyzer capture of the stop request output, `journalctl -u <service_name> --since "-2 min"`, and for ROS 2 the monitor node log.

### Output
Raw observations and captures per row.

### Quality Gate
- After each row, `tc qdisc show dev <eth_if>` shows no `netem` and `ip link show <can_if>` shows `UP` (for rows that touched them).
- Every row has a capture file and an injection timestamp.

---

## Phase 3: Judge and Record

### Entry Criteria
- Phase 2 complete and all cleanups verified.

### Actions
1. Compute `reaction_time_ms` from the injection marker to the stop request edge in the capture.
2. Apply the row's `pass_rule` exactly. A reaction after `time_budget` is a fail.
3. For CPU starvation rows, also check that no process missed its watchdog only because of priority: `chrt -p <pid>` shows the scheduling policy; record it.
4. Emit `fault_injection_results` as JSON.

### Output
`fault_injection_results`.

### Quality Gate
- Result count equals the count of plan rows in the four stacks (minus rows skipped for missing `bench_interfaces`, each with a note).
- `jq '[.[]|select(.pass==null)]|length' fault_injection_results.json` prints 0.

---

## Worked Example

Illustrative only. Row `FI-007` (hang, planner, budget 0.6 s) and `FI-015` (bench Ethernet loss 30 % from the plan).

```
$ systemctl show -p MainPID planner.service
MainPID=2214
$ date +%s.%N; sudo kill -STOP 2214
1760001234.508812
$ sudo kill -CONT 2214
$ sudo tc qdisc add dev eth1 root netem loss 30%
$ sudo tc qdisc del dev eth1 root
$ tc qdisc show dev eth1
qdisc mq 0: root
```
FI-007: stop request edge 0.21 s after the marker, pass. FI-015: no stop and no detection while trajectory messages arrived late; recorded as not detected, returned to the owner with the capture.

---

## Exit Criteria

DONE when each Linux, ROS 2 and bench CAN row has been injected one at a time, cleaned up, measured against its pass rule and recorded with captures.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Stop events during baseline | **Stop**: fix the baseline before injecting. |
| Phase 2 | Lost SSH after a network injection | **Adjust**: use the console to run the cleanup; add the interface to the do-not-touch list. |
| Phase 2 | `tc` reports `RTNETLINK answers: File exists` | **Adjust**: a qdisc is already there; inspect with `tc qdisc show` and delete it first. |
| Phase 3 | Fail result | **Return**: send to the owner; do not rerun until it passes by luck. |

**Do not:** inject on a vehicle on the ground, run several faults at once unless the plan row says so, or leave any `netem` qdisc in place after the test.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
