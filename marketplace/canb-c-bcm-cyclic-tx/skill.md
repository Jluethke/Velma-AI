# Cyclic Transmission in C with the SocketCAN Broadcast Manager

**One-line description:** Writes a C program that sets up kernel-timed cyclic transmission with a CAN_BCM socket (TX_SETUP with SETTIMER and STARTTIMER, a multi-frame sequence for rolling counters), updates and deletes the job, and verifies the period with candump.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Bench or virtual interface.
- `encoded_frames` (object[], required): From `canb-cantools-encode-frame`; one or more payloads per ID (several for a counter sequence).
- `cycle_times` (object, required): Map of ID to period, from the DBC GenMsgCycleTime attribute or the network specification.
- `tx_permission` (string, required): From `canb-tx-scope-check`; must not be "none".
- `project_dir` (string, required): C project root.

---

## Outputs

- `cyclic_tx_task` (object): Source path, compile command, IDs and periods configured, the TX_SETUP flags used, and the candump verification result.

---

## Phase 1: Gate

### Entry Criteria
- `tx_permission` is "virtual_only" (vcan only), "bench_tx", or "bench_tx_actuators".
- Actuator command frames only under "bench_tx_actuators": bench or closed course behind a tested, independent hardware emergency stop.

### Actions
1. Confirm every ID has a period with a cited source.
2. Read the kernel documentation `Documentation/networking/can.rst`, section on the broadcast manager, for the installed kernel. All struct and flag names below come from `<linux/can/bcm.h>`; confirm them in `/usr/include/linux/can/bcm.h`.

### Output
Gate passed, periods cited.

### Quality Gate
- `grep -c TX_SETUP /usr/include/linux/can/bcm.h` prints at least 1.

---

## Phase 2: Write the Program

### Entry Criteria
- Gate passed.

### Actions
1. Create one file `<project_dir>/bcm_tx.c`.
2. Open: `int s = socket(PF_CAN, SOCK_DGRAM, CAN_BCM);` then `connect()` with a `struct sockaddr_can` whose `can_ifindex` comes from `if_nametoindex(can_netdev)`. BCM uses connect, not bind.
3. Message layout: a `struct bcm_msg_head` immediately followed by `nframes` `struct can_frame` (or `struct canfd_frame` with the `CAN_FD_FRAME` flag). Declare a struct with `struct bcm_msg_head msg_head; struct can_frame frame[N];`.
4. Fill: `opcode = TX_SETUP`, `can_id = <id>`, `flags = SETTIMER | STARTTIMER`, `count = 0`, `ival2.tv_sec/tv_usec = <period>`, `nframes = N`. With count 0 only ival2 is used. With N > 1 the kernel sends the frames in order, one per interval, which gives a rolling counter sequence.
5. `write(s, &msg, sizeof(msg))` and check the return equals `sizeof(msg)`.
6. Update payload without restarting the timer: send TX_SETUP again with the same can_id and without SETTIMER/STARTTIMER (only the frames change). Check the docs for `TX_ANNOUNCE` if the change must go out immediately.
7. Stop: `opcode = TX_DELETE` with the same can_id, `nframes = 0`. Closing the socket also removes its jobs.
8. Compile: `gcc -std=c11 -Wall -Wextra -Werror -o bcm_tx bcm_tx.c`.

### Output
Compiled `bcm_tx`.

### Quality Gate
- Compile exits 0 with `-Werror`.
- Every `write()` return value is checked in the source.

---

## Phase 3: Verify Timing

### Entry Criteria
- Program runs on the permitted interface.

### Actions
1. Run `./bcm_tx` and in another terminal `candump -td <can_netdev>,<id>:7FF`.
2. Read 20 deltas; they must sit around the requested period. Detailed jitter is measured in `canb-tx-jitter-measure`.
3. For a frame sequence, confirm the payloads cycle in order: `candump <can_netdev>,<id>:7FF | head -n 2N`.
4. Send TX_DELETE and confirm frames stop.

### Output
`cyclic_tx_task`.

### Quality Gate
- 20 consecutive deltas recorded.
- No frames after TX_DELETE.

---

## Worked Example

Illustrative. `vcan0`, ID 0x210, period 20 ms, four frames carrying counter values 0..3.

- Phase 1: period cited from DBC `BA_ "GenMsgCycleTime" BO_ 528 20;`.
- Phase 2: TX_SETUP with `ival2 = {0, 20000}`, `nframes = 4`; write returns 120 on an x86_64 build (56-byte head plus 4 x 16-byte frames) (head plus 4 frames; print `sizeof` to confirm on yours).
- Phase 3: `candump -td vcan0,210:7FF` shows deltas near 0.020000 and the first byte cycling 00, 01, 02, 03.

---

## Exit Criteria

DONE when the program compiles strictly, the ID transmits at the cited period on a permitted interface, sequences cycle in order, and TX_DELETE stops it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `tx_permission` is "none" | **Stop**. |
| Phase 2 | `connect: No such device` | **Return**: interface missing; run `canb-vcan-setup` or bring the bench interface up. |
| Phase 2 | `write` returns -1 with EINVAL | **Adjust**: check nframes against the struct size and the FD flag against the frame type. |
| Phase 3 | Frames stop when the program exits | **Adjust**: expected; BCM jobs end with the socket. Keep the process running. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
