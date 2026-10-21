# Decode a candump Log to Signals with cantools

**One-line description:** Turns a candump log into a time series of physical signal values with cantools, handling unknown IDs, wrong-length frames and decode errors explicitly, and writes a CSV with one row per decoded frame.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dbc_file` (string, required): DBC file that passed `canb-dbc-lint-load`.
- `candump_log` (string, required): Log from `canb-candump-capture`.
- `byte_order_table` (object[], required): From `canb-dbc-byte-order`; signals that disagreed there are flagged in the output.

---

## Outputs

- `decoded_signals` (object): Path to `decoded.csv` (columns: timestamp, frame_id, message, signal, value, unit), counts of decoded, unknown-ID, and failed frames, and the flagged signals.

---

## Phase 1: Quick Look with the CLI

### Entry Criteria
- `dbc_file` loads; `candump_log` non-empty.

### Actions
1. `head -n 20 <candump_log> | python3 -m cantools decode <dbc_file>` prints each candump line followed by its decoded message. IDs not in the DBC are printed undecoded.
2. Read `python3 -m cantools decode --help` for options on your version (for example single-line output). Use only listed options.
3. Spot-check two signals against a known state (for example a gear selector in park) to catch scale or byte order errors before the full run.

### Output
Spot-check result.

### Quality Gate
- Two spot-checked signals match the known state, or the mismatch is recorded and the flow stops.

---

## Phase 2: Full Decode Script

### Entry Criteria
- Spot check passed.

### Actions
1. Write one script, `decode_log.py`, that:
   1. loads the DBC with `strict=True`;
   2. reads the log with `can.LogReader(candump_log)` (python-can) or parses lines with the regex `^\((\d+\.\d+)\)\s+(\S+)\s+([0-9A-Fa-f]+)#(#?)([0-9A-Fa-f]*)`;
   3. looks up each ID with `db.get_message_by_frame_id(frame_id)` inside `try/except KeyError` and counts unknown IDs;
   4. compares `len(data)` with `message.length`; counts and skips mismatches (cantools would raise or misdecode);
   5. calls `message.decode(data, decode_choices=False)` inside `try/except` for decode errors; counts failures;
   6. writes one CSV row per signal with the unit from the DBC.
2. Do not catch every exception with a bare `except:`; catch the specific ones and count them, so silent data loss is visible.
3. Run it on the full log.

### Output
`decoded.csv`.

### Quality Gate
- decoded + unknown + length mismatch + failed == total frames in the log.
- `decoded.csv` row count is greater than 0.

---

## Phase 3: Sanity Checks

### Entry Criteria
- CSV written.

### Actions
1. For each signal compute min and max and compare with the DBC `[min|max]` range. Values outside the range indicate wrong scale, offset, byte order, or signedness.
2. Mark rows for signals flagged in `byte_order_table` as "unverified layout".
3. Report the top unknown IDs by count; they are candidates for `canb-cansniffer-signal-hunt`.

### Output
`decoded_signals`.

### Quality Gate
- Each out-of-range signal is listed with its observed min and max.

---

## Worked Example

Illustrative. Log of 60 s, DBC with 12 messages.

- Phase 1: `head -n 20 run.log | python3 -m cantools decode bench.dbc` shows `GearState(Gear: 'P')` while the selector is in park.
- Phase 2: 182340 frames: 151002 decoded, 31338 unknown ID, 0 length mismatch, 0 failed; sum matches.
- Phase 3: CoolantTemp range in DBC -40..215, observed 21..34; fine. Unknown ID 0x2F1 has 3000 frames.

---

## Exit Criteria

DONE when `decoded.csv` exists, the frame accounting balances, and out-of-range and unverified signals are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Spot check wrong | **Stop**: return to `canb-dbc-byte-order`. |
| Phase 2 | Many length mismatches for one ID | **Return**: DBC length is wrong for that message or the frame is CAN FD; report it. |
| Phase 2 | Accounting does not balance | **Adjust**: find the uncounted code path; never drop frames silently. |
| Phase 3 | Signal out of DBC range | **Return**: report it with values; do not clip. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
