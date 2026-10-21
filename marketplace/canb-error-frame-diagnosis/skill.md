# CAN Error Frame and Error Counter Diagnosis

**One-line description:** Reads SocketCAN error frames and the controller's TX/RX error counters, decodes each error class from linux/can/error.h, and maps the dominant error class to its likely physical or configuration cause with a fixed table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface, for example "can0".
- `link_state` (object, required): From `canb-socketcan-link-up`; must show `BERR-REPORTING` if the driver supports it.
- `candump_log` (string, required): From `canb-candump-capture`, captured with `-e` and the `#FFFFFFFF` error mask.

---

## Outputs

- `error_report` (object): Controller state, TEC/REC values, counts per error class, the dominant class, the likely cause from the table, and the evidence lines.

---

## Phase 1: Read the Counters

### Entry Criteria
- Interface exists.

### Actions
1. Run `ip -details -statistics link show <can_netdev>` and record:
   - `state` and `(berr-counter tx N rx M)`;
   - the counters line `re-started bus-errors arbit-lost error-warn error-pass bus-off`.
2. Interpret the state using the fault confinement rules of ISO 11898-1 and the Linux state names in `include/uapi/linux/can/netlink.h`:
   - ERROR-ACTIVE: both counters below the warning level the driver uses (the netlink.h comment gives "< 96");
   - ERROR-WARNING: a counter at or above that level and below 128;
   - ERROR-PASSIVE: a counter at 128 or above (ISO 11898-1 error passive);
   - BUS-OFF: TEC above 255 (ISO 11898-1 bus off).
3. If the driver prints no `berr-counter`, record "counters not reported by driver" and rely on Phase 2.

### Output
Counters and state.

### Quality Gate
- The recorded state string is copied from the command output.
- Counter values or "not reported" are recorded.

---

## Phase 2: Decode Error Frames

### Entry Criteria
- `candump_log` present.

### Actions
1. Print error frames with decoding: `candump -e -ta can0,#FFFFFFFF` live, or filter the log: `grep -E ' [0-9A-F]{8}#' <log>` and keep IDs with bit 0x20000000 set.
2. The error class is in the CAN ID bits (from `linux/can/error.h`):

| Bit | Name | Meaning |
|---|---|---|
| 0x001 | CAN_ERR_TX_TIMEOUT | TX timeout (driver) |
| 0x002 | CAN_ERR_LOSTARB | Lost arbitration; data[0] is the bit number |
| 0x004 | CAN_ERR_CRTL | Controller problem; data[1] details (RX/TX warning, passive, overflow) |
| 0x008 | CAN_ERR_PROT | Protocol violation; data[2] type (bit, form, stuff, bit0, bit1, overload), data[3] location |
| 0x010 | CAN_ERR_TRX | Transceiver status; data[4] |
| 0x020 | CAN_ERR_ACK | No ACK received on transmission |
| 0x040 | CAN_ERR_BUSOFF | Bus off |
| 0x080 | CAN_ERR_BUSERROR | Bus error (may flood the bus) |
| 0x100 | CAN_ERR_RESTARTED | Controller restarted |

   Confirm the table against the `error.h` installed on your system (`/usr/include/linux/can/error.h`); newer kernels add classes such as CAN_ERR_CNT.
3. `candump -e` prints the decoded text, for example `ERRORFRAME protocol-violation{{tx-dominant-bit-error}{}}`. Copy those strings as evidence.
4. Count frames per class and pick the dominant one.

### Output
Per-class counts.

### Quality Gate
- Every counted class is backed by at least one quoted candump line.

---

## Phase 3: Map to Cause

### Entry Criteria
- Dominant class known.

### Actions
1. Use this table; take the first row that matches:

| Dominant evidence | Likely cause | Next flow |
|---|---|---|
| CAN_ERR_ACK on own TX, no other node on bus | Node is alone or every other node is listen-only | Add a second active node on the bench |
| PROT stuff/form errors from bus start | Bit rate or sample point mismatch | `canb-bit-timing-calc` |
| PROT bit0/bit1 errors, counters climbing slowly | Termination, wiring, ground offset | `canb-termination-check` |
| CRTL RX overflow | Host cannot drain the controller FIFO | Reduce load or filter; check `canbusload` |
| BUSOFF | TEC exceeded 255 | `canb-busoff-recovery` |
| LOSTARB only | Normal arbitration; not an error by itself | None |

2. Write `error_report` with state, counters, counts, dominant class, matched row and quoted evidence.

### Output
`error_report`.

### Quality Gate
- Exactly one table row is cited as the match, or "no errors" when counts are zero.

---

## Worked Example

Illustrative. Bench with one dev board at 500 kbit/s, adapter accidentally set to 250 kbit/s.

- Phase 1: `state ERROR-PASSIVE (berr-counter tx 0 rx 128)`; `bus-errors 4211`.
- Phase 2: `candump -e` shows `ERRORFRAME protocol-violation{{frame-format-error}{}}` repeated; class PROT dominates.
- Phase 3: row "PROT stuff/form errors from bus start" matches; next flow `canb-bit-timing-calc`. Fixing the bit rate brings the state back to ERROR-ACTIVE.

---

## Exit Criteria

DONE when `error_report` records the controller state, per-class error counts with evidence, and one matched cause row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Driver reports no counters | **Adjust**: rely on error frames; note it in the report. |
| Phase 2 | No error frames in the log but counters rise | **Retry**: recapture with `-e` and `#FFFFFFFF`; confirm `berr-reporting on` in `link_state`. |
| Phase 2 | Adapter is slcan | **Return**: slcan generally does not deliver error frames; use a gs_usb or native adapter for diagnosis. |
| Phase 3 | No row matches | **Return**: report the evidence and mark the cause as an open question. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
