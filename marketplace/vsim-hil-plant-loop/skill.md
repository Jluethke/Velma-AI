# HIL Closed Loop with a Simulated Vehicle Plant over CAN

**One-line description:** Runs a fixed-period Python loop on a Linux host that reads the ECU's command frames from the bench CAN bus, steps a simulated vehicle plant, and sends back simulated sensor frames at their DBC cycle times, then measures loop timing and jitter so the bench result can be trusted.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bench_can_config` (object, required): From `vsim-hil-can-bench-setup`, with transmit enabled on the bench bus.
- `dbc_file` (string, required): DBC with the ECU command messages it sends and the sensor messages it expects.
- `plant_model_spec` (object, required): Plant equations and parameters with sources, for example a longitudinal point-mass model (mass, drag area, rolling resistance, brake and drive limits) or a kinematic bicycle model (wheelbase, steering ratio), and the integration step.
- `estop_verified` (boolean, required): True only when the independent hardware emergency stop on the bench was tested in this session by cutting power to every connected actuator.

---

## Outputs

- `hil_loop_script` (string): Path to the plant loop script in the user's project.
- `hil_timing_report` (object): Loop period target, measured period mean and max, jitter histogram, missed deadlines count, per-message transmit period error, host kernel (`uname -a`), and `cyclictest` latency summary.

---

## Phase 1: Safety and Interface Map

### Entry Criteria
- `estop_verified` is true. If any physical actuator (motor, brake actuator, steering motor) is connected, it is on the bench, behind that stop. The ECU is not installed in a vehicle.
- Braking and emergency-stop paths are hardware paths; this loop never gates, delays or filters a brake or stop command.

### Actions
1. From the DBC list: command messages the ECU sends (inputs to the plant) and sensor or state messages the plant must send (outputs), with each message's cycle time (`cantools` `message.cycle_time`, from `GenMsgCycleTime`). A message without a cycle time is an open question.
2. For each command signal, write how it enters the plant (for example brake pressure request to deceleration through the brake gain in `plant_model_spec`).
3. Brake and stop command signals pass to the plant every cycle with no rate limit, clamp or delay added by this loop.

### Output
Interface map: signal, direction, plant variable, cycle time.

### Quality Gate
- Every signal used has a DBC message, a cycle time and a plant variable.
- The map shows no limit, filter or hold on brake or stop signals.

---

## Phase 2: Write the Fixed-Period Loop

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create `hil/plant_loop.py` (in the user's project) with:
   - `bus = can.Bus(interface='socketcan', channel=<iface>, receive_own_messages=False)`.
   - `db = cantools.database.load_file(<dbc_file>, strict=True)`.
   - A loop scheduled on absolute deadlines: `next_t = time.monotonic_ns()` then each cycle `next_t += period_ns` and sleep until `next_t` (for example `time.sleep(max(0, (next_t - time.monotonic_ns())/1e9))`). Never sleep a fixed amount after work; that accumulates drift.
   - Each cycle: drain received frames with `bus.recv(timeout=0)` until None; decode commands with `db.decode_message(msg.arbitration_id, msg.data)`; step the plant once by the integration step; for each output message whose cycle time is due, `bus.send(can.Message(arbitration_id=..., data=db.encode_message(name, signals), is_extended_id=...))`.
   - Log per cycle: planned time, actual wake time, work duration.
2. Plant step: implement the equations in `plant_model_spec` exactly; integration step equals the loop period unless the spec says otherwise.
3. If the ECU stops sending commands, keep sending plant outputs and log the timeout; do not invent commands.
4. Do NOT call blocking file writes inside the loop; buffer logs and write at exit.

### Output
`hil_loop_script`.

### Quality Gate
- `grep -n "monotonic_ns" hil/plant_loop.py` shows absolute-deadline scheduling.
- `grep -n "strict=True" hil/plant_loop.py` finds the DBC load.

---

## Phase 3: Measure Timing

### Entry Criteria
- Script written; bench powered; `estop_verified` true.

### Actions
1. Characterize the host first: `sudo cyclictest -m -p 80 -i <period_us> -l <loops> -q` (from `rt-tests`; confirm flags with `cyclictest --help`). Record Min, Avg and Max latency. A PREEMPT_RT kernel (`uname -a` shows `PREEMPT_RT`) usually lowers Max; record which kernel you used.
2. Run the loop for a soak period chosen by the user. Optionally run with `sudo chrt -f 80 python hil/plant_loop.py` for real-time scheduling.
3. From the per-cycle log compute: actual period mean and max, wake-up lateness distribution, count of cycles whose work plus lateness exceeded the period (missed deadlines).
4. From `candump -t d can0` (delta timestamps) compute per output message the period mean and max versus its DBC cycle time.
5. Compare with the ECU's documented receive timeout for each message, if documented. Report; do not set your own pass limit.

### Output
`hil_timing_report`.

### Quality Gate
- `hil_timing_report` contains cyclictest Max, loop missed-deadline count, and per-message period stats.
- Kernel string is recorded.

---

## Worked Example

Illustrative. Point-mass plant, 10 ms period, ECU sends `BrakeCmd` and `DriveTorqueCmd`; plant sends `WheelSpeeds` (10 ms) and `VehSpeed` (20 ms).
```
$ sudo cyclictest -m -p 80 -i 1000 -l 100000 -q
T: 0 ( 4121) P:80 I:1000 C: 100000 Min: 2 Act: 4 Avg: 4 Max: 41
$ candump -t d can0 | grep " 1A0 " | head -3
 (000.010003)  can0  1A0   [8]  00 7B 00 7B 00 7B 00 7B
```
Report: loop period mean 10.000 ms, max 10.31 ms, 0 missed deadlines in 30 min; WheelSpeeds period max 10.4 ms.

---

## Exit Criteria

DONE when the loop runs on absolute deadlines, brake and stop commands pass through unaltered, and timing is measured and reported against the DBC cycle times.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `estop_verified` false | **Stop**: test the hardware emergency stop before powering any actuator. |
| Phase 1 | Plant parameter without a source | **Return**: record an open question; do not fill a typical value. |
| Phase 2 | `encode_message` raises on a signal | **Adjust**: provide every signal of the message or the DBC defaults; check ranges. |
| Phase 3 | Missed deadlines | **Adjust**: run with `chrt`, use a PREEMPT_RT kernel, or move logging out of the loop; remeasure. |
| Phase 3 | Controller goes BUS-OFF | **Stop**: return to `vsim-hil-can-bench-setup`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
