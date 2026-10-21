# Virtual CAN (vcan) Interface Setup

**One-line description:** Creates a Linux vcan virtual CAN interface (classic or CAN FD MTU) for offline replay and unit tests, proves frames loop through it with cansend and candump, and documents what vcan cannot simulate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `vcan_name` (string, optional): Interface name; default "vcan0".
- `fd_enabled` (boolean, optional): True to allow CAN FD frames (MTU 72). Default false (MTU 16).
- `stack` (string, required): "python" or "c"; the language of the code that will be tested on this interface. It selects the test flow that consumes `vcan_setup`.

---

## Outputs

- `vcan_setup` (object): Interface name, MTU, the commands used, the loop test result, and the list of behaviors vcan does not model.

---

## Phase 1: Create the Interface

### Entry Criteria
- Linux host with sudo. Not needed: any CAN hardware.

### Actions
1. `sudo modprobe vcan`. Confirm with `lsmod | grep vcan`.
2. `sudo ip link add dev vcan0 type vcan` (use `vcan_name`). If it already exists, `ip link show vcan0` succeeds; reuse it, do not delete someone else's interface.
3. If `fd_enabled`: `sudo ip link set vcan0 mtu 72`. Classic CAN MTU is 16 (sizeof struct can_frame); CAN FD MTU is 72 (sizeof struct canfd_frame).
4. `sudo ip link set up vcan0`.
5. In CI containers the module must be loaded on the host; containers cannot `modprobe`. Record this if the tests will run in CI.

### Output
vcan interface up.

### Quality Gate
- `ip -details link show vcan0` prints `link/can` and `mtu 16` or `mtu 72` as requested.

---

## Phase 2: Loop Test

### Entry Criteria
- Interface up.

### Actions
1. Terminal A: `candump vcan0`.
2. Terminal B: `cansend vcan0 123#DEADBEEF`. Terminal A must print `vcan0  123   [4]  DE AD BE EF`.
3. If `fd_enabled`: `cansend vcan0 123##1112233445566778899AABB` (FD frame with BRS flag). With MTU 16 this fails with `write: Invalid argument`, which is the expected failure for a classic vcan.
4. Record `stack` in `vcan_setup` with the consuming flow: "python" goes to `canb-py-vcan-pytest`, "c" goes to `canb-c-vcan-test`. Any other value: stop and ask.
5. Record in `vcan_setup` what vcan does not model: bit timing (no bitrate setting), arbitration, ACK, error frames and error counters, bus-off, bus load and real transmission delay. Tests for those need real hardware.

### Output
`vcan_setup`.

### Quality Gate
- The loop test frame was printed by candump with matching ID and data.
- The "not modeled" list is present.

---

## Worked Example

Illustrative. Input: `fd_enabled`=true.

- Phase 1: `ip -details link show vcan0` prints `vcan0: <NOARP,UP,LOWER_UP> mtu 72 ... link/can`.
- Phase 2: classic and FD frames both appear in candump; FD frame prints as `vcan0  123  [12]  11 22 33 44 55 66 77 88 99 AA BB 00` with length 12 because the FD length 11 is padded up to the next valid FD length.

---

## Exit Criteria

DONE when the vcan interface is up with the requested MTU, a frame loops through it, and the limits of vcan are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `modprobe: FATAL: Module vcan not found` | **Adjust**: install the distro's extra kernel modules package; on WSL2 use a kernel built with vcan. |
| Phase 1 | `RTNETLINK answers: File exists` | **Adjust**: the interface exists; reuse it. |
| Phase 2 | Nothing printed in candump | **Retry**: check both commands use the same interface name and that it is UP. |
| Phase 2 | FD frame rejected on an FD request | **Retry**: set MTU 72 with the interface down, then up. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
