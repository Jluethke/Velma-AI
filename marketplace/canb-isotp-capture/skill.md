# ISO-TP Capture and Reassembly with isotpdump

**One-line description:** Passively captures ISO 15765-2 (ISO-TP) transport traffic between a known request and response ID with can-utils isotpdump, reads the single, first, consecutive and flow control frames, and reassembles complete payloads for diagnostic analysis.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface, listen-only on any vehicle.
- `isotp_ids` (object, required): {"tx": "7E0", "rx": "7E8"}, the tester-to-ECU and ECU-to-tester IDs, from the ECU's documentation or from a log where a diagnostic tool owned by the user was talking.
- `candump_log` (string, required): From `canb-candump-capture`; a log recorded during the diagnostic session.

---

## Outputs

- `isotp_transcript` (object[]): One entry per reassembled message: direction, total length, payload hex, the frame sequence that built it, and for UDS (ISO 14229-1) payloads the service ID byte.

---

## Phase 1: Capture

### Entry Criteria
- `isotp_ids` known.
- Any diagnostic requests on the vehicle bus come from the user's own scan tool, not from this host (this host stays listen-only unless `tx_permission` allows bench TX).

### Actions
1. Run `isotpdump -h` and read your version's options. The core ones are `-s <can_id>` (source), `-d <can_id>` (destination), `-c` (color), `-a` (ASCII), `-t <type>` (timestamp type); newer versions add UDS decoding. Use only listed options.
2. Live: `isotpdump -s 7E0 -d 7E8 -c -ta can0`.
3. Offline: replay the log onto a virtual interface and dump there: `canplayer -I <candump_log> vcan0=can0` in one terminal and `isotpdump -s 7E0 -d 7E8 vcan0` in another. Create vcan0 first with `canb-vcan-setup`.

### Output
isotpdump text output saved to a file.

### Quality Gate
- The saved output contains lines for both the `-s` and `-d` IDs.

---

## Phase 2: Read Frame Types

### Entry Criteria
- Output saved.

### Actions
1. Classify each CAN frame by the high nibble of the first PCI byte (ISO 15765-2, normal addressing):

| High nibble | Frame | Meaning |
|---|---|---|
| 0 | Single Frame | Low nibble = length (classic CAN) |
| 1 | First Frame | 12-bit total length in low nibble + next byte |
| 2 | Consecutive Frame | Low nibble = sequence number 0..F, wraps |
| 3 | Flow Control | Low nibble 0 = continue, 1 = wait, 2 = overflow; next bytes block size and STmin |

2. For extended or mixed addressing the first data byte is an address byte and the PCI moves one byte right; if every frame starts with the same byte before a plausible PCI, record "extended addressing" and pass `-x` per the help text.
3. Check sequence numbers in consecutive frames increase by 1 modulo 16. A gap means a lost frame.

### Output
Frame classification.

### Quality Gate
- Every frame in the session has a type from the table.
- Sequence gaps are counted (0 is the expected value).

---

## Phase 3: Reassemble

### Entry Criteria
- Frames classified.

### Actions
1. For a Single Frame the payload is the next `length` bytes.
2. For a First Frame, read the total length, take its data bytes, then append Consecutive Frame data in sequence order until the total length is reached; discard padding bytes beyond it.
3. Record for each message the first payload byte. For UDS, a positive response is request SID + 0x40; a negative response starts with 0x7F followed by the SID and a response code (ISO 14229-1).
4. Build `isotp_transcript`.

### Output
`isotp_transcript`.

### Quality Gate
- Each reassembled length equals the First Frame length field.
- Each response pairs with a preceding request in the opposite direction.

---

## Worked Example

Illustrative. The user's own scan tool reads the VIN (UDS 0x22 F190) on their car while the host listens.

- Phase 1: `isotpdump -s 7E0 -d 7E8 -c -ta can0` prints frames on 7E0 and 7E8.
- Phase 2: `7E0 03 22 F1 90` single frame; `7E8 10 14 62 F1 90 31 43 34` first frame length 0x014 = 20; `7E0 30 00 00` flow control continue; `7E8 21 ...`, `7E8 22 ...` consecutive frames, no gaps.
- Phase 3: 20-byte payload `62 F1 90` + 17 ASCII VIN characters; 0x62 = 0x22 + 0x40, a positive response.

---

## Exit Criteria

DONE when every diagnostic exchange in the capture is reassembled with lengths matching the First Frame and requests paired with responses.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No frames on the given IDs | **Return**: IDs may be 29-bit (for example 18DA..), or traffic goes through a gateway; check the log ID list. |
| Phase 1 | User wants this host to send requests on a vehicle | **Stop**: vehicle scope is listen-only; requests come from the user's own tool. |
| Phase 2 | Sequence gap found | **Retry**: recapture with a larger receive buffer and no other load on the host. |
| Phase 3 | Length mismatch | **Adjust**: check for extended addressing or CAN FD length rules. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
