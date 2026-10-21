# SocketCAN Bus-Off Recovery

**One-line description:** Recovers a SocketCAN controller from BUS-OFF either automatically with restart-ms or manually with `ip link set ... type can restart`, proves the recovery from the re-started counter, and fixes the root cause instead of looping restarts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface, for example "can0".
- `error_report` (object, required): From `canb-error-frame-diagnosis`; names the dominant error class and cause.
- `restart_ms` (integer, optional): Desired automatic restart delay in ms, from the system specification or the user. 0 or absent means manual restart.

---

## Outputs

- `recovery_plan` (object): Restart mode chosen (auto or manual), the commands, the before/after counters, the root cause addressed, and how the application must react to bus-off.

---

## Phase 1: Confirm Bus-Off and Its Cause

### Entry Criteria
- `error_report` present.

### Actions
1. Run `ip -details -statistics link show <can_netdev>` and confirm `state BUS-OFF`. Record `re-started` and `bus-off` counter values.
2. Read the cause row in `error_report`. A restart without fixing the cause puts the controller straight back into bus-off: ISO 11898-1 bus-off happens only after TEC exceeds 255, which takes many consecutive failed transmissions.
3. Decision table:

| `error_report` cause | Fix before restart |
|---|---|
| Bit rate or sample point mismatch | Correct bit timing via `canb-bit-timing-calc` |
| Termination or wiring | Fix per `canb-termination-check` |
| ACK error, node alone on bus | Add a second active node or use `loopback on` only for self-tests |
| Unknown | Restart once manually and capture with `candump -e` to gather evidence |

### Output
Cause confirmed and fix chosen.

### Quality Gate
- The state line `BUS-OFF` is quoted.
- One table row is selected.

---

## Phase 2: Restart

### Entry Criteria
- Fix applied or the "Unknown" row chosen.

### Actions
1. Manual restart (works only when restart-ms is 0 and the state is BUS-OFF): `sudo ip link set <can_netdev> type can restart`.
2. Automatic restart: `sudo ip link set <can_netdev> down`, `sudo ip link set <can_netdev> type can restart-ms <restart_ms>`, `sudo ip link set <can_netdev> up`. The kernel restarts the controller that many ms after each bus-off.
3. Alternative full reset: `sudo ip link set <can_netdev> down && sudo ip link set <can_netdev> up`.
4. Run `ip -details -statistics link show <can_netdev>` again.

### Output
Controller restarted.

### Quality Gate
- `re-started` increased by at least 1, or the state left BUS-OFF after a down/up.
- State is now ERROR-ACTIVE. If it returns to BUS-OFF within one capture, the fix failed.

---

## Phase 3: Define Application Behavior

### Entry Criteria
- Controller recovered.

### Actions
1. Write in `recovery_plan` what the application sees during bus-off:
   - raw socket `write()` fails with `errno` ENETDOWN or ENOBUFS (C);
   - python-can `bus.send()` raises `can.CanOperationError` (python-can 4.x) wrapping the OS error.
2. Required behavior: catch the error, log it with a timestamp, and retry sending after the interface is back. Do not busy-loop on `send()`; sleep or wait on the socket.
3. Receivers subscribed to error frames get a CAN_ERR_BUSOFF frame and, after restart, CAN_ERR_RESTARTED. Log both.
4. Never put a brake or emergency-stop signal behind any bus-off handling logic that could delay it; those paths are hardwired or independent of this bus in a correct design.

### Output
`recovery_plan`.

### Quality Gate
- `recovery_plan` lists the commands run, before/after counters, and the error the application must catch for the user's stack.

---

## Worked Example

Illustrative. Bench node alone on the bus transmitting with no other node to ACK.

- Phase 1: `state BUS-OFF (berr-counter tx 248 rx 0)` with `bus-off 1`; cause row "ACK error, node alone on bus". Second dev board connected.
- Phase 2: `ip link set can0 type can restart`; then `re-started 1`, state ERROR-ACTIVE.
- Phase 3: plan states that `cansend` would have printed `write: No buffer space available` during the fault and the Python app must catch `can.CanOperationError`.

---

## Exit Criteria

DONE when the controller is ERROR-ACTIVE after restart, the root cause is fixed or listed as open, and the application reaction is written down.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | State is not BUS-OFF | **Return**: no recovery needed; go back to `canb-error-frame-diagnosis`. |
| Phase 2 | `restart` rejected with Invalid argument | **Adjust**: restart-ms is non-zero (auto mode) or state is not bus-off; use down/up. |
| Phase 2 | Bus-off repeats right after restart | **Stop**: do not loop restarts; return to the fix table. |
| Phase 3 | Application crashes on send error | **Adjust**: add the error handling above and rerun the bench test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
