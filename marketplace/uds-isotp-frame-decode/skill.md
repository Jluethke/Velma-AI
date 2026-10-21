# ISO-TP Frame Decode from a CAN Log

**One-line description:** Reassembles ISO 15765-2 messages by hand or script from a candump log by reading the Protocol Control Information nibble of each frame (Single, First, Consecutive, Flow Control), and flags sequence, length and timeout errors.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `candump_log` (string, required): Path to a log from `uds-candump-passive-log` that contains a diagnostic exchange.
- `tx_id` (string, required): Tester request ID in hex, for example `7E0`.
- `rx_id` (string, required): ECU response ID in hex, for example `7E8`.

---

## Outputs

- `isotp_messages` (object[]): One row per reassembled message: direction, CAN ID, timestamp of first frame, declared length, payload hex.
- `isotp_errors` (object[]): Every sequence gap, length mismatch, unexpected frame type or timeout found, with the log line number. Empty when none.

---

## Phase 1: Filter and Classify Frames

### Entry Criteria
- `candump_log` exists and contains lines with `tx_id` or `rx_id`.

### Actions
1. Filter the two IDs: `grep -E ' (<tx_id>|<rx_id>)#' <candump_log> > isotp_pair.log`.
2. For each frame read byte 0. The high nibble is the PCI type (ISO 15765-2, classic CAN, normal addressing):

| High nibble | Type | Length / fields |
|---|---|---|
| 0 | Single Frame (SF) | low nibble = payload length 1 to 7; if low nibble is 0 on CAN FD, byte 1 holds the length |
| 1 | First Frame (FF) | 12-bit length = low nibble of byte 0 and all of byte 1; if that is 0, bytes 2 to 5 hold a 32-bit length; 6 data bytes follow (classic CAN) |
| 2 | Consecutive Frame (CF) | low nibble = sequence number; first CF after FF is 1, wraps from F to 0; 7 data bytes |
| 3 | Flow Control (FC) | low nibble = FlowStatus: 0 ContinueToSend, 1 Wait, 2 Overflow; byte 1 = BlockSize; byte 2 = STmin |

3. With extended or mixed addressing, byte 0 is an address byte and the PCI starts at byte 1. If byte 0 is the same constant on every frame of an ID and byte 1 high nibble fits the table, record extended addressing.
4. Ignore padding bytes after the declared length (commonly 0x00, 0x55, 0xAA or 0xCC).

### Output
Classified frame list.

### Quality Gate
- Every frame in `isotp_pair.log` has a type from the table or is listed in `isotp_errors` as unknown.

---

## Phase 2: Reassemble

### Entry Criteria
- Frames classified.

### Actions
1. SF: payload = bytes 1 to length. Emit a message.
2. FF: start a buffer with the declared length and the 6 data bytes. Expect an FC from the other ID next.
3. FC: read STmin. 0x00 to 0x7F = 0 to 127 ms; 0xF1 to 0xF9 = 100 to 900 microseconds; other values are reserved and a sender treats them as 0x7F (ISO 15765-2). BlockSize 0 means send all CFs without further FC.
4. CF: check the sequence number equals the expected one (mod 16). Append 7 data bytes. When the buffer reaches the declared length, truncate padding and emit the message.
5. Errors to record in `isotp_errors`: sequence gap, CF without FF, FF interrupted by a new FF or SF, total bytes short of declared length, FC with FlowStatus 2 (receiver overflow).
6. Timeouts: ISO 15765-2 sets N_Bs (wait for FC) and N_Cr (wait for next CF) to 1000 ms. Flag gaps longer than that between FF and FC or between CFs.

### Output
`isotp_messages`, `isotp_errors`.

### Quality Gate
- For each emitted message, payload length equals the declared length.
- Each error row cites a log line number.

---

## Phase 3: Cross-Check with a Tool

### Entry Criteria
- Phase 2 produced at least one message.

### Actions
1. Replay the log onto `vcan0` (`uds-vcan-bench-replay`) and run `isotpdump -s <tx_id> -d <rx_id> -c -u -a vcan0` (check flags with `isotpdump -h`).
2. Compare each reassembled payload with the tool output. They must match byte for byte.
3. Alternative: capture `vcan0` live in Wireshark during the replay and apply the `iso15765` display filter. If frames show only as raw CAN, enable the ISO 15765 heuristic or set the CAN ID mapping in the protocol preferences (see the Wireshark documentation for your version).

### Output
Cross-check result added to `isotp_messages`.

### Quality Gate
- Number of messages from Phase 2 equals the number of messages printed by isotpdump for the same ID pair.

---

## Worked Example

Illustrative only. VIN read (UDS 22 F1 90):

```
(…) can0 7E0#0322F19000000000   SF len 3: 22 F1 90
(…) can0 7E8#101462F190314731   FF len 0x014=20: 62 F1 90 31 47 31
(…) can0 7E0#3000000000000000   FC CTS BS=0 STmin=0
(…) can0 7E8#2134414B35323837   CF 1: 34 41 4B 35 32 38 37
(…) can0 7E8#2235313233343536   CF 2: 35 31 32 33 34 35 36
```

20 bytes reassembled: `62 F1 90` + 17 ASCII bytes. `isotp_errors` is empty.

---

## Exit Criteria

DONE when every frame on the ID pair is classified, every message is reassembled with a matching length, and the result matches isotpdump.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No frames on the ID pair | **Return**: the exchange used other IDs; list IDs with `uds-candump-passive-log` Phase 2 step 5. |
| Phase 2 | Sequence gaps throughout | **Retry**: the capture dropped frames; recapture with drop monitoring. |
| Phase 2 | FC FlowStatus Overflow | **Return**: the message exceeds the receiver buffer; report to `uds-isotp-flow-control-params`. |
| Phase 3 | Tool and manual decode differ | **Adjust**: recheck addressing mode (normal versus extended) from Phase 1 step 3. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
