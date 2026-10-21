# Cyclic Transmission with python-can send_periodic

**One-line description:** Transmits periodic frames on a bench or virtual bus with python-can `bus.send_periodic`, which on SocketCAN hands the timing to the kernel broadcast manager, updates payloads with `modify_data`, and stops tasks cleanly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Bench or virtual interface.
- `encoded_frames` (object[], required): From `canb-cantools-encode-frame`.
- `cycle_times` (object, required): Map of frame ID to period in seconds, taken from the DBC GenMsgCycleTime attribute or the network specification. Never guess a period.
- `tx_permission` (string, required): From `canb-tx-scope-check`; must not be "none".

---

## Outputs

- `cyclic_tx_task` (object): Script path, the IDs and periods started, how the payload is updated, and the stop result.

---

## Phase 1: Gate and Prepare

### Entry Criteria
- `tx_permission` is "virtual_only" (and `can_netdev` starts with "vcan"), "bench_tx", or "bench_tx_actuators".
- Frames that command an actuator run only with "bench_tx_actuators": bench or closed course, independent hardware emergency stop tested today.

### Actions
1. Check every ID in `encoded_frames` has a period in `cycle_times`. Missing period: stop and ask.
2. Build `can.Message(arbitration_id=..., data=bytes.fromhex(...), is_extended_id=..., is_fd=...)` for each.

### Output
Message objects and periods.

### Quality Gate
- One period per ID, each with its source (DBC attribute or specification section).

---

## Phase 2: Start and Update Tasks

### Entry Criteria
- Messages built.

### Actions
1. Open the bus: `bus = can.Bus(interface="socketcan", channel=can_netdev)`.
2. Start each: `task = bus.send_periodic(msg, period)`; optional `duration=` seconds to stop automatically. On SocketCAN, python-can implements this with the kernel BCM (broadcast manager), so timing does not depend on the Python thread scheduler.
3. Payload changes (for example a rolling counter, see `canb-counter-checksum-verify`): call `task.modify_data(new_msg)` with a message of the same ID. Do not stop and restart the task for each change; that creates a gap.
4. Keep references to all tasks. At the end call `task.stop()` for each, or `bus.stop_all_periodic_tasks()`, then `bus.shutdown()`.
5. A rolling counter that must change every cycle cannot come from a single static frame. Options, in order of preference: (a) pass a list of messages, one per counter value with its checksum, to `send_periodic`; python-can 4.x accepts a message sequence and the BCM cycles through it (confirm in the docs of the installed version); (b) the C BCM flow with a frame sequence (`canb-c-bcm-cyclic-tx`); (c) per-cycle `modify_data` from a Python timer, whose timing then depends on the Python scheduler. Record which option was used.

### Output
Running tasks and a stop routine.

### Quality Gate
- `candump -td <can_netdev>,<id>:7FF` shows the ID at the requested period (read 20 deltas).
- After stop, the same candump shows no further frames for that ID.

---

## Worked Example

Illustrative. `can_netdev`="vcan0", frame 0x200 every 0.010 s, `tx_permission`="virtual_only".

- Phase 1: period source: DBC `BA_ "GenMsgCycleTime" BO_ 512 10;`.
- Phase 2: `task = bus.send_periodic(msg, 0.010)`; `candump -td vcan0,200:7FF` shows deltas `(000.010012)`, `(000.009988)`, ... After `task.stop()`, no new lines.

---

## Exit Criteria

DONE when each permitted ID transmits at its specified period, payload updates do not interrupt it, and all tasks stop cleanly.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `tx_permission` is "none" | **Stop**: no cyclic transmission on this target. |
| Phase 1 | Period missing | **Stop**: ask for the specified period. |
| Phase 2 | `can.CanOperationError` on start | **Return**: check the interface is UP and not bus-off. |
| Phase 2 | Gap after payload change | **Adjust**: use `modify_data` instead of stop/start. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
