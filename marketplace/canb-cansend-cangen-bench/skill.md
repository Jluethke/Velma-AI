# Bench Transmission with cansend and cangen

**One-line description:** Sends single test frames with cansend and generated traffic with cangen on a virtual or bench bus only, using the exact frame syntax for standard, extended, RTR and CAN FD frames, and confirms each transmission from a parallel candump.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Bench or virtual interface (for example "vcan0" or a bench "can1").
- `tx_permission` (string, required): From `canb-tx-scope-check`. Must be "virtual_only", "bench_tx" or "bench_tx_actuators".
- `test_frames` (object[], required): Frames to send: id (hex), extended (bool), data (hex), fd (bool), brs (bool), purpose. Plus optional cangen settings: gap_ms, count.

---

## Outputs

- `tx_log` (string): Path to a candump log taken during the test, plus a table of each frame sent and whether it was seen on the bus.

---

## Phase 1: Gate and Build Commands

### Entry Criteria
- `tx_permission` is not "none". If it is "virtual_only", `can_netdev` must start with "vcan".
- Any frame whose purpose is an actuator command requires "bench_tx_actuators": the actuator runs only on a bench or closed course behind a tested, independent hardware emergency stop.

### Actions
1. Refuse any frame that `canb-tx-scope-check` refused. Do not "just try one".
2. Build cansend strings (syntax from `cansend` usage text, run `cansend` with no arguments to print it):
   - standard: `123#DEADBEEF` (3 hex ID digits);
   - extended: `1F334455#1122` (8 hex ID digits);
   - remote request: `123#R` (optionally `123#R4` for a DLC on newer versions);
   - CAN FD: `123##1DEADBEEF` where the nibble after `##` is the flags (1 = bit rate switch, 2 = error state indicator); data follows.
3. For generated load, read `cangen -h`. Common options: `-g <ms>` gap, `-I <mode>` ID (r random, i increment, or a fixed hex ID), `-L <mode>` length, `-D <mode>` data (r, i, or fixed hex), `-n <count>`, `-e` extended, `-f` FD, `-b` FD with BRS. Use only listed options.

### Output
Command list.

### Quality Gate
- Every command maps to one entry in `test_frames` or cangen settings.
- No command targets a non-vcan interface when `tx_permission` is "virtual_only".

---

## Phase 2: Send and Confirm

### Entry Criteria
- Commands built.

### Actions
1. Start logging first: `timeout 60 candump -l -x <can_netdev>`. The `-x` option marks TX vs RX direction per the help text.
2. Send each frame: `cansend can1 123#DEADBEEF`. A `write: No buffer space available` message means the TX queue is full or the controller is bus-off; stop and run `canb-error-frame-diagnosis`.
3. Generated traffic: `cangen can1 -g 10 -I 123 -L 8 -D i -n 100` sends 100 frames on ID 0x123 with incrementing data every 10 ms.
4. After the run, check every frame in the log: `grep -c ' can1 123#' <log>` must equal the number sent.
5. On a real bench bus, a second active node must be present to ACK; otherwise the sender gets ACK errors.

### Output
`tx_log`.

### Quality Gate
- Count of each ID in the log equals the count sent.
- `ip -details -statistics link show <can_netdev>` still shows ERROR-ACTIVE after the run.

---

## Worked Example

Illustrative. `tx_permission`="virtual_only", `can_netdev`="vcan0", one standard and one FD frame plus cangen 100 frames.

- Phase 1: commands `cansend vcan0 123#DEADBEEF`, `cansend vcan0 456##1A1A2B2C`, `cangen vcan0 -g 10 -I 321 -L 8 -D i -n 100`.
- Phase 2: log `candump-2026-10-21_110000.log`; `grep -c ' vcan0 321#'` prints 100; `grep -c ' vcan0 456##1'` prints 1.

---

## Exit Criteria

DONE when every permitted frame was sent on the permitted interface and every one is confirmed in `tx_log`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `tx_permission` is "none" | **Stop**: no transmission on this target. |
| Phase 1 | Actuator frame without hardware emergency stop | **Stop**: refuse it. |
| Phase 2 | `write: Invalid argument` on an FD frame | **Adjust**: interface MTU is 16; enable FD (`fd on` or vcan MTU 72). |
| Phase 2 | `No buffer space available` | **Return**: run `canb-error-frame-diagnosis`; usually no ACK or bus-off. |
| Phase 2 | Sent count differs from logged count | **Retry**: start candump before sending and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
