# C SocketCAN Raw Receiver with Kernel Filters

**One-line description:** Writes a C CAN_RAW receiver that binds to one interface, installs CAN_RAW_FILTER ID/mask filters and a CAN_RAW_ERR_FILTER error mask, enables CAN FD frames with CAN_RAW_FD_FRAMES, reads kernel receive timestamps, and is checked on vcan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface name.
- `capture_filters` (string[], optional): "ID:MASK" filters, same syntax as candump.
- `project_dir` (string, required): C project root.

---

## Outputs

- `c_receiver` (object): Source path, compile command, filters installed, FD enabled flag, and the vcan test result.

---

## Phase 1: Write the Receiver

### Entry Criteria
- Headers present: `/usr/include/linux/can.h` and `/usr/include/linux/can/raw.h`.

### Actions
1. Create one file `<project_dir>/raw_rx.c`.
2. Socket and bind: `socket(PF_CAN, SOCK_RAW, CAN_RAW)`; `struct sockaddr_can addr = { .can_family = AF_CAN, .can_ifindex = if_nametoindex(can_netdev) }`; `bind()`. An ifindex of 0 binds to all CAN interfaces; check for 0 from `if_nametoindex` and treat it as an error.
3. Filters: build `struct can_filter rfilter[N]` with `.can_id` and `.can_mask`. For an extended ID, set `CAN_EFF_FLAG` in can_id and include `CAN_EFF_FLAG | CAN_RTR_FLAG` in the mask as described in the kernel can.rst, so standard and extended IDs with the same number do not both match. Install with `setsockopt(s, SOL_CAN_RAW, CAN_RAW_FILTER, rfilter, sizeof(rfilter))`. Multiple filters are OR-ed; `CAN_RAW_JOIN_FILTERS` makes them AND-ed.
4. Error frames: `can_err_mask_t err_mask = CAN_ERR_MASK;` then `setsockopt(s, SOL_CAN_RAW, CAN_RAW_ERR_FILTER, &err_mask, sizeof(err_mask))`. Received error frames have `CAN_ERR_FLAG` set in can_id.
5. CAN FD: `int on = 1; setsockopt(s, SOL_CAN_RAW, CAN_RAW_FD_FRAMES, &on, sizeof(on));`. Then read into a `struct canfd_frame` and check the byte count returned by `read()`: `CAN_MTU` (16) means a classic frame, `CANFD_MTU` (72) an FD frame.
6. Timestamps: after each read, `ioctl(s, SIOCGSTAMP, &tv)` gives the kernel receive time; or use `recvmsg` with `SO_TIMESTAMPING` for hardware timestamps where supported.
7. Check every system call's return value and print `strerror(errno)` on failure.
8. Compile: `gcc -std=c11 -Wall -Wextra -Werror -o raw_rx raw_rx.c`.

### Output
Compiled `raw_rx`.

### Quality Gate
- Compile exits 0 with `-Werror`.
- Every `setsockopt`, `bind` and `read` return is checked in the source (search for each call and its check).

---

## Phase 2: Test on vcan

### Entry Criteria
- vcan0 up with MTU 72 (from `canb-vcan-setup`).

### Actions
1. Run `./raw_rx vcan0` with filter `123:7FF`.
2. Send `cansend vcan0 123#11`, `cansend vcan0 124#11`, `cansend vcan0 00000123#11` (extended 0x123), and an FD frame `cansend vcan0 123##1AABBCC`.
3. Expected: classic 0x123 printed, 0x124 not printed, extended 0x123 not printed (when the mask includes CAN_EFF_FLAG), FD 0x123 printed with length 3 and FD flag.
4. Record the results.

### Output
`c_receiver`.

### Quality Gate
- All four expected outcomes observed and recorded.

---

## Worked Example

Illustrative. `can_netdev`="vcan0", filter `123:7FF`, mask built as `CAN_SFF_MASK | CAN_EFF_FLAG | CAN_RTR_FLAG`.

- Phase 1: compiles clean.
- Phase 2: output `123 [1] 11`, `123 [3] AA BB CC (FD)`; 0x124 and extended 0x123 absent.

---

## Exit Criteria

DONE when `raw_rx` compiles strictly and the vcan test shows the filter, extended-ID separation and FD reception behaving as expected.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `if_nametoindex` returns 0 | **Stop**: interface missing; do not bind to all interfaces by accident. |
| Phase 1 | `setsockopt CAN_RAW_FD_FRAMES: Protocol not available` | **Return**: kernel too old for FD; record it. |
| Phase 2 | Extended 0x123 also received | **Adjust**: add CAN_EFF_FLAG to the mask. |
| Phase 2 | FD frame not received | **Adjust**: enable CAN_RAW_FD_FRAMES and set vcan MTU 72. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
