# Linux can-isotp Kernel Module

**One-line description:** Loads the Linux `can-isotp` kernel module (mainline since 5.10), verifies it with `isotpsend`, `isotprecv` and `isotpdump` from can-utils, and performs one OBD-II read (mode 01 PID 00) as the transport smoke test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_link_status` (object, required): From `uds-socketcan-link-setup`; interface up in normal mode.
- `can_interface` (string, required): For example `can0` or `vcan0`.
- `tx_id` (string, required): Request CAN ID in hex, for example `7E0` (engine ECU physical) or `7DF` (OBD functional).
- `rx_id` (string, required): Response CAN ID in hex, for example `7E8`.

---

## Outputs

- `isotp_link_check` (object): Kernel version, module loaded flag, the tx/rx IDs, padding byte used, and the raw response to the smoke test.

---

## Phase 1: Load the Module

### Entry Criteria
- `can_link_status.state` is ERROR-ACTIVE and not listen-only.

### Actions
1. `uname -r`. If the kernel is 5.10 or newer, the module ships with the kernel (`CONFIG_CAN_ISOTP`). If older, the out-of-tree module from the can-isotp GitHub repository is required; build it per its README.
2. `sudo modprobe can-isotp`
3. `lsmod | grep can_isotp` must print one line.
4. `grep CAN_ISOTP /boot/config-$(uname -r)` shows `=m` or `=y` on distributions that ship the config.

### Output
Module loaded.

### Quality Gate
- `lsmod | grep can_isotp` prints a line.

---

## Phase 2: Smoke Test with can-utils

### Entry Criteria
- Module loaded.

### Actions
1. In terminal A start the decoder view: `isotpdump -s <tx_id> -d <rx_id> -c -a <can_interface>` (`-c` colors, `-a` prints ASCII; confirm with `isotpdump -h`).
2. In terminal B start the receiver first: `isotprecv -s <tx_id> -d <rx_id> -p AA:AA <can_interface>`. It binds a socket that receives on `rx_id` and sends flow control on `tx_id`.
3. In terminal C send OBD mode 01 PID 00: `echo "01 00" | isotpsend -s <tx_id> -d <rx_id> -p AA:AA <can_interface>`.
   - `-p AA:AA` pads transmitted and received frames to 8 bytes. ISO 15765-4 requires 8-byte frames for OBD on CAN; padding prevents ECUs from ignoring short frames.
4. Read the answer in terminal B, for example `41 00 BE 3F A8 13`. `41` is 0x01 + 0x40 (positive response).
5. With functional ID 7DF, more than one ECU may answer on 7E8 to 7EF. `isotprecv` listens on one `rx_id` only; run one per expected responder or use `candump` to see all.
6. Do NOT send any service outside `allowed_services` with these tools. The tools do not check.

### Output
`isotp_link_check`.

### Quality Gate
- The response first byte is `41` (positive) or `7F` (negative); record which.
- `isotpdump` shows the request as a Single Frame (`[SF]`).

---

## Worked Example

Illustrative only.

```
$ sudo modprobe can-isotp && lsmod | grep can_isotp
can_isotp              28672  0
$ isotprecv -s 7E0 -d 7E8 -p AA:AA can0 &
$ echo "01 00" | isotpsend -s 7E0 -d 7E8 -p AA:AA can0
41 00 BE 3F A8 13
```

`isotp_link_check` = `{"kernel": "6.8.0", "module": true, "tx_id": "7E0", "rx_id": "7E8", "pad": "AA", "response": "41 00 BE 3F A8 13"}`.

---

## Exit Criteria

DONE when the module is loaded and one OBD-II request gets a decoded response through the kernel ISO-TP socket.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `modprobe: FATAL: Module can-isotp not found` | **Adjust**: kernel older than 5.10 or module not built; build the out-of-tree module or upgrade the kernel. |
| Phase 2 | No response | **Retry**: confirm ignition on, swap to functional `7DF`, then try 29-bit IDs (8 hex digits) per `uds-diag-scope-readonly`. |
| Phase 2 | Response only on functional, not physical | **Adjust**: the physical ID guess is wrong; read the responder ID from `candump` and use it. |
| Phase 2 | `isotprecv` prints nothing but candump shows 7E8 frames | **Adjust**: the receiver started after the reply; start `isotprecv` first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
