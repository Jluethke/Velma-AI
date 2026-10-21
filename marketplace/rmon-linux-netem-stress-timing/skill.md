# Timing Faults with tc netem and stress-ng

**One-line description:** Injects the timing faults from the plan on a Linux test rig: network delay, jitter, loss and reordering with `tc qdisc ... netem`, CPU starvation with `stress-ng`, and process hangs with `kill -STOP`, then reads the monitor event log to record whether the staleness checks tripped and when, with every qdisc removed afterward.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fault_injection_plan` (object[], required): Output of `rmon-fault-injection-plan`; cases with `executor == "rmon-linux-netem-stress-timing"`.
- `test_interface` (string, required): Network interface on the test rig that carries the monitored traffic (for example `eth1` or `lo` for single-host tests). Never a production network.

---

## Outputs

- `timing_fault_results` (object[]): One row per case and repetition: `case_id`, `rep`, the exact injection command, `t_inject_ns`, `t_detect_ns` (from the monitor log, or null), `observed_verdict`, `outcome`.

---

## Phase 1: Prepare the Rig

### Entry Criteria
- Bench rig, not a deployed system. Actuators disconnected or behind an independent hardware emergency stop.
- Root or `CAP_NET_ADMIN` on the rig. `tc -V` and `stress-ng --version` print versions.

### Actions
1. Record the starting state: `tc qdisc show dev <test_interface>`. Save it; Phase 3 restores to exactly this.
2. Confirm the monitored traffic uses `<test_interface>`: `ip route get <peer_ip>` shows `dev <test_interface>`. For ROS 2 on one host, DDS may use shared memory and bypass `lo`; disable the shared-memory transport in the RMW configuration for this test or netem has no effect. Record which.
3. Synchronize the time base: injection and detection times are both read from the same host's `CLOCK_MONOTONIC` (the monitor's `t_mono_ns`). Log injection time from a helper that prints `python3 -c "import time; print(time.monotonic_ns())"` immediately before the command.

### Output
Rig baseline.

### Quality Gate
- Baseline `tc qdisc show` output is saved.
- The route check shows the expected interface.

---

## Phase 2: Inject

### Entry Criteria
- Baseline saved.

### Actions
1. Network cases (netem applies to egress on the interface where the qdisc is added; to delay traffic toward the monitor, add it on the sender's egress interface):
   ```
   sudo tc qdisc add dev <test_interface> root netem delay <D>ms <J>ms     # delay D with jitter J
   sudo tc qdisc change dev <test_interface> root netem loss <P>%           # loss
   sudo tc qdisc change dev <test_interface> root netem delay <D>ms reorder <R>% 50%
   ```
   D, J, P and R come from the plan case `parameters`. Use `change` to modify an existing root qdisc; `add` twice fails with `File exists`.
2. CPU starvation on the cores in the independence plan:
   ```
   stress-ng --cpu <N> --taskset <cpu_list> --timeout <S>s --metrics-brief
   ```
3. Process hang or crash of the supervised component:
   ```
   kill -STOP <component_pid>   # hang; resume with kill -CONT
   kill -9 <component_pid>      # crash
   ```
4. Each injection lasts the case duration, then is removed. Repeat for `repetitions`.
5. After each repetition, extract from the monitor log the first record with `verdict` `stale` or `fail` after the injection time:
   ```
   jq -c 'select(.t_mono_ns > <t_inject_ns> and (.verdict=="stale" or .verdict=="fail"))' events.jsonl | head -1
   ```

### Output
Raw per-repetition records.

### Quality Gate
- Every planned repetition has a row, including rows where no trip was found (`t_detect_ns` null).
- `tc qdisc show dev <test_interface>` during injection shows `netem` with the planned parameters (captured once per case).

---

## Phase 3: Clean Up and Classify

### Entry Criteria
- All repetitions done.

### Actions
1. Remove netem: `sudo tc qdisc del dev <test_interface> root`. Confirm `tc qdisc show dev <test_interface>` equals the Phase 1 baseline.
2. Confirm no `stress-ng` remains: `pgrep stress-ng` prints nothing. Resume or restart any stopped process.
3. Classify each row: `must_trip` with a detection inside `detection_deadline_ms` is `pass`; detection after the deadline is `late`; no detection is `missed`; `must_not_trip` with a detection is `false_trip`.

### Output
`timing_fault_results`.

### Quality Gate
- Final `tc qdisc show` output equals the saved baseline.
- `pgrep stress-ng` exits 1 (no process).

---

## Worked Example

Illustrative only.
```
$ sudo tc qdisc add dev eth1 root netem delay 80ms 10ms
$ tc qdisc show dev eth1
qdisc netem 8001: root refcnt 2 limit 1000 delay 80ms  10ms
$ jq -c 'select(.t_mono_ns > 918273000000 and .verdict=="stale")' events.jsonl | head -1
{"t_mono_ns":918273034511,"event":"trip","check_id":"AGE-cmd_linear_x","verdict":"stale",...}
$ sudo tc qdisc del dev eth1 root
```
Detection 34.5 ms after injection; deadline open, so the row is recorded and the latency flow evaluates it.

---

## Exit Criteria

DONE when every timing case ran its repetitions, detection times come from the monitor log on the same monotonic clock, results are classified, and the rig is restored to baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No root or `CAP_NET_ADMIN` | **Stop**: request rig access; do not test on a shared network. |
| Phase 2 | `RTNETLINK answers: File exists` | **Adjust**: use `tc qdisc change` or delete the existing root qdisc first. |
| Phase 2 | netem has no effect on ROS 2 traffic | **Adjust**: disable shared-memory transport for the test and rerun. |
| Phase 3 | qdisc differs from baseline | **Retry**: `tc qdisc del dev <if> root` and compare again before leaving the rig. |

**Do not:** run netem on a production or vehicle network, leave qdiscs or stress processes running, or compare times from two different clocks.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
