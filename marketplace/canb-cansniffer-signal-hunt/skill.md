# Read-Only Signal Discovery with cansniffer

**One-line description:** Finds which CAN ID and bytes change with one physical action (a switch, a pedal, a wheel) on the user's own network by watching cansniffer's changing-byte view and confirming against a candump log, without transmitting anything.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface in listen-only or normal mode.
- `candump_log` (string, required): From `canb-candump-capture`; a baseline log recorded while the action was NOT performed.
- `tx_permission` (string, required): From `canb-tx-scope-check`. This flow is read-only at every value.

---

## Outputs

- `candidate_signals` (object[]): For each action: CAN ID, byte and bit positions that change, observed raw values per state, cycle time, and confidence ("confirmed" after three repeats, otherwise "tentative").

---

## Phase 1: Baseline and Noise IDs

### Entry Criteria
- Baseline `candump_log` exists.
- The action can be performed safely by a second person, or with the vehicle stationary (parking brake set, transmission in park).

### Actions
1. From the baseline log list IDs whose payload changes without any action (counters, checksums, clocks): for each ID, count distinct payloads with `grep ' can0 0C9#' <log> | awk '{print $3}' | sort -u | wc -l`. IDs with many distinct payloads at rest are noise for this search.
2. Start cansniffer: `cansniffer -c can0`. It shows one line per ID and highlights bytes that changed (`-c` adds color). Read `cansniffer -h` for options on your version (for example the timeout `-t` and binary view `-B`).
3. Wait until the screen settles, then use cansniffer's interactive filter commands (documented in its help screen, opened in-session) to hide the noise IDs from step 1. Do not invent keystrokes; read the help.

### Output
Noise ID list and a quiet cansniffer view.

### Quality Gate
- The noise ID list has a distinct-payload count per ID from the baseline log.

---

## Phase 2: Perform the Action and Observe

### Entry Criteria
- Quiet view.

### Actions
1. Perform the action in a slow, repeatable pattern: on 3 s, off 3 s, three times.
2. Note IDs and bytes that change in step with the action. With `-B` you can see the exact bits.
3. Record at the same time: `timeout 30 candump -l can0` so the observation can be checked later.
4. In the action log, pull the candidate ID and print its payload over time: `grep ' can0 3B3#' <action_log>`. Confirm the bit pattern toggles three times.
5. Measure the cycle time of the candidate ID: `candump -td can0,3B3:7FF` for a few seconds and read the deltas.

### Output
Candidate rows.

### Quality Gate
- Each candidate has three on/off transitions visible in the saved log.
- Each candidate has a measured cycle time.

---

## Phase 3: Record Candidates

### Entry Criteria
- Candidates observed.

### Actions
1. Write `candidate_signals` with ID, byte/bit positions, raw values per state, cycle time, and confidence.
2. If a candidate looks like an actuator command rather than a status report, record it but mark "do not transmit". This flow never replays or injects frames.
3. Suggest DBC entries for confirmed signals (name, start bit, length, byte order) for `canb-dbc-lint-load` to validate later.

### Output
`candidate_signals`.

### Quality Gate
- No transmit command appears anywhere in this flow's outputs.
- "confirmed" is used only for candidates with three observed repeats.

---

## Worked Example

Illustrative. Action: hazard light switch on the user's own car, ignition on, parked.

- Phase 1: baseline shows 0C9 and 1A0 with hundreds of distinct payloads (counters); both hidden.
- Phase 2: ID 3B3 byte 2 toggles between 00 and 20 each time the switch is pressed. Saved log shows `3B3#0000200000000000` / `3B3#0000000000000000` three times. Cycle time from `-td` about 0.100 s.
- Phase 3: candidate {id: 0x3B3, byte: 2, bit: 5, on: 1, off: 0, cycle_s: 0.100, confidence: confirmed}.

---

## Exit Criteria

DONE when every studied action has a candidate with ID, bit position, values, cycle time and confidence, backed by a saved log, and nothing was transmitted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Too many changing IDs to see anything | **Adjust**: use the baseline to hide more IDs or capture with ID filters in candump. |
| Phase 2 | Nothing changes with the action | **Return**: the signal may be on another bus or only on a gateway-protected bus; report it, do not probe the gateway. |
| Phase 2 | Action requires the vehicle to move | **Stop**: do it on a closed course with a second person driving, or not at all. |
| Phase 3 | User asks to replay the frame to cause the action | **Stop**: out of scope for this read-only flow; run `canb-tx-scope-check` first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
