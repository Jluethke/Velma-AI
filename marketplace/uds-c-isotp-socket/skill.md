# C ISO-TP Socket Client

**One-line description:** Writes a small C program that opens a Linux `CAN_ISOTP` socket, sets padding and flow-control options with `setsockopt` before `bind`, sends one read-only diagnostic request and reads the response with a `poll` timeout.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `isotp_params` (object, required): From `uds-isotp-flow-control-params`.
- `can_interface` (string, required): For example `can0` or `vcan0`.
- `tx_id` (string, required): Request ID in hex.
- `rx_id` (string, required): Response ID in hex.

---

## Outputs

- `c_isotp_program` (object): Source path, compile command, compiler warnings count, and the result of a test run against `vcan0`.

---

## Phase 1: Write the Program

### Entry Criteria
- Kernel module `can_isotp` loaded (`uds-kernel-can-isotp-module`).
- Kernel headers installed (`/usr/include/linux/can/isotp.h` exists).

### Actions
1. Create `isotp_req.c`. Includes: `<linux/can.h>`, `<linux/can/isotp.h>`, `<net/if.h>`, `<sys/socket.h>`, `<poll.h>`, `<unistd.h>`, `<stdio.h>`, `<string.h>`.
2. Open: `int s = socket(PF_CAN, SOCK_DGRAM, CAN_ISOTP);`
3. Options, all before `bind`:
   - `struct can_isotp_options opts = {0}; opts.flags = CAN_ISOTP_TX_PADDING | CAN_ISOTP_RX_PADDING; opts.txpad_content = 0xAA; opts.rxpad_content = 0xAA;` then `setsockopt(s, SOL_CAN_ISOTP, CAN_ISOTP_OPTS, &opts, sizeof(opts));`
   - `struct can_isotp_fc_options fc = { .bs = 0, .stmin = 0, .wftmax = 0 };` then `setsockopt(s, SOL_CAN_ISOTP, CAN_ISOTP_RECV_FC, &fc, sizeof(fc));`
   - Values come from `isotp_params`; do not hard-code different ones.
4. Address: `struct sockaddr_can addr = {0}; addr.can_family = AF_CAN; addr.can_ifindex = if_nametoindex(ifname); addr.can_addr.tp.tx_id = 0x7E0; addr.can_addr.tp.rx_id = 0x7E8;` For 29-bit IDs OR each ID with `CAN_EFF_FLAG`.
5. `bind(s, (struct sockaddr *)&addr, sizeof(addr));` check every return value and print `perror` on failure.
6. Send: `write(s, req, req_len)`. The kernel splits into SF/FF/CF and handles FC.
7. Receive: `poll` on `s` with POLLIN and a timeout from user input (UDS P2 timing is read in `uds-session-control-0x10`), then `read(s, buf, sizeof(buf))`. One `read` returns one whole reassembled message.
8. Restrict the request bytes to services in `allowed_services`: accept the request as a hex argument and refuse anything whose first byte is not 0x01, 0x03, 0x09, 0x22, 0x19 or 0x3E unless the request guard is linked in.

### Output
`isotp_req.c`.

### Quality Gate
- `grep -n setsockopt isotp_req.c` shows both option calls on lines before the `bind` call.

---

## Phase 2: Build and Test

### Entry Criteria
- Source written.

### Actions
1. `gcc -std=c11 -Wall -Wextra -Werror -O2 -o isotp_req isotp_req.c`
2. On `vcan0`, start a fake ECU: `isotprecv -s 7E8 -d 7E0 -l vcan0` prints requests it receives (here the fake ECU's source is 7E8, it listens on 7E0).
3. Run `./isotp_req vcan0 7E0 7E8 "22 F1 90"`; the fake ECU terminal prints `22 F1 90`.
4. To test the receive path, answer from the fake ECU: `echo "62 F1 90 31 47 31 34 41 4B 35 32 38 37 35 31 32 33 34 35 36" | isotpsend -s 7E8 -d 7E0 -p AA:AA vcan0` while `isotp_req` waits.
5. Test a refused request: `./isotp_req vcan0 7E0 7E8 "2E F1 90 00"` must exit non-zero and `candump vcan0` must show no frame.

### Output
`c_isotp_program`.

### Quality Gate
- `gcc` exits 0 with `-Werror`.
- The 20-byte response prints in full.
- The 0x2E request exits non-zero and candump shows zero frames for it.

---

## Worked Example

Illustrative only.

```
$ gcc -std=c11 -Wall -Wextra -Werror -O2 -o isotp_req isotp_req.c
$ ./isotp_req vcan0 7E0 7E8 "22 F1 90"
rx 20 bytes: 62 F1 90 31 47 31 34 41 4B 35 32 38 37 35 31 32 33 34 35 36
$ ./isotp_req vcan0 7E0 7E8 "2E F1 90 00"; echo $?
refused: service 0x2E not in allowlist
2
```

---

## Exit Criteria

DONE when the program builds warning-free, completes a multi-frame read on `vcan0`, and refuses a write service without transmitting.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `isotp.h: No such file` | **Adjust**: install kernel headers (`linux-libc-dev` on Debian/Ubuntu). |
| Phase 2 | `socket: Protocol not supported` | **Stop**: load `can-isotp` first. |
| Phase 2 | `read` blocks forever | **Adjust**: the poll timeout is missing; add it, never block without one. |
| Phase 2 | Fake ECU gets nothing | **Adjust**: tx/rx IDs swapped; tester sends on 7E0 and listens on 7E8. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
