# ISO-TP Flow Control Parameters

**One-line description:** Chooses and records the ISO 15765-2 transport parameters for a tester (BlockSize, STmin, padding byte, frame length, N_Bs and N_Cr timeouts) from the observed ECU behavior and the standard, so every client in the stack uses the same, justified values.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `isotp_messages` (object[], required): From `uds-isotp-frame-decode`, including the Flow Control frames the ECU sent.
- `isotp_link_check` (object, required): From `uds-kernel-can-isotp-module`; carries the padding byte that worked.

---

## Outputs

- `isotp_params` (object): `blocksize`, `stmin_raw`, `tx_padding`, `tx_data_length`, `n_bs_ms`, `n_cr_ms`, `wftmax`, addressing mode, and a source citation for every value.

---

## Phase 1: Read What the ECU Asks For

### Entry Criteria
- `isotp_messages` contains at least one multi-frame exchange or one FC frame.

### Actions
1. Find every FC frame the ECU sent (FC from `rx_id`). Record BlockSize (byte 1) and STmin (byte 2).
2. The ECU's FC governs how fast the tester may send CFs to it. The tester's own FC governs how fast the ECU sends to the tester. These are separate.
3. If the ECU sent FlowStatus 1 (Wait), count consecutive Waits. The tester must tolerate up to N_WFTmax Waits; record the maximum seen.
4. Record the padding byte observed in ECU frames (the bytes after the declared length).

### Output
Observed ECU FC values.

### Quality Gate
- Each observed value cites a log line from `isotp_messages`.

---

## Phase 2: Set Tester Values

### Entry Criteria
- Phase 1 done.

### Actions
1. Use this table. Every value must come from the named source:

| Parameter | Value | Source |
|---|---|---|
| Tester FC BlockSize | 0 (no further FC) | ISO 15765-2 allows 0; least overhead when the tester can buffer the whole message |
| Tester FC STmin | 0x00 | Tester can receive back-to-back frames; raise only if the tester host drops frames |
| Tester CF pacing | the ECU's STmin from Phase 1 | ISO 15765-2: sender must honor the receiver's STmin |
| tx_padding | 0xAA or the byte from `isotp_link_check` | ISO 15765-4 requires 8-byte frames for OBD; value of the pad byte is not fixed |
| tx_data_length | 8 (classic CAN) | CAN 2.0; use 64 only if the ECU uses CAN FD |
| N_Bs, N_Cr | 1000 ms | ISO 15765-2 timeout values |
| wftmax | 0 unless Phase 1 saw Waits | user input otherwise |

2. Never set STmin lower than the ECU requests to "speed up" a transfer. The ECU may drop frames and answer with a sequence error.
3. Translate STmin: raw 0x00 to 0x7F is milliseconds; 0xF1 to 0xF9 is 100 to 900 microseconds.

### Output
Draft `isotp_params`.

### Quality Gate
- Every field in `isotp_params` has a non-empty `source`.
- `stmin_raw` is in 0x00 to 0x7F or 0xF1 to 0xF9.

---

## Phase 3: Map to Each Client

### Entry Criteria
- Draft parameters exist.

### Actions
1. Record the same values in each client's terms:
   - can-utils: padding on both tools with `-p AA:AA`; the FC that the tester sends is set on the receiver, `isotprecv -b <bs> -m <stmin>` (check `isotprecv -h` and `isotpsend -h`; flag letters differ between the two tools).
   - Linux socket: `struct can_isotp_options.txpad_content`, flags `CAN_ISOTP_TX_PADDING`; `struct can_isotp_fc_options` fields `bs`, `stmin`, `wftmax`.
   - Python `isotp` package: params keys `blocksize`, `stmin`, `tx_padding`, `tx_data_length`, `rx_flowcontrol_timeout`, `rx_consecutive_frame_timeout`, `wftmax` (confirm names in the installed version's docs).
2. Write `isotp_params` with the mapping.

### Output
`isotp_params`.

### Quality Gate
- `isotp_params` contains a mapping for can-utils, the Linux socket API and the Python package.

---

## Worked Example

Illustrative only. FC from the ECU in reply to a tester First Frame reads `7E8#30000AAAAAAAAAAA` = ContinueToSend, BlockSize 0, STmin 0x0A (10 ms).

Result: tester CFs to this ECU are spaced at least 10 ms; tester's own FC = `30 00 00`; padding 0xAA; N_Bs and N_Cr 1000 ms.

---

## Exit Criteria

DONE when every transport value is set, cited, and mapped to each client API used in the stack.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No multi-frame exchange in the log | **Adjust**: capture one by reading DID 0xF190 (VIN), which is multi-frame on classic CAN. |
| Phase 2 | ECU replies with NRC or drops CFs | **Adjust**: confirm tester CF pacing honors the ECU STmin. |
| Phase 2 | Tester host drops frames | **Adjust**: raise tester STmin to the lowest value that stops drops, measured with `candump -d`. |
| Phase 3 | Client rejects a key name | **Stop**: read the installed package docs; do not guess key names. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
