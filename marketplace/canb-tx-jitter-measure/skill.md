# Cycle Time and Jitter Measurement per CAN ID

**One-line description:** Measures the actual period and jitter of each cyclic CAN ID from a timestamped capture (hardware timestamps when available), computes per-ID statistics against the specified cycle time, and reports timestamp-source limits honestly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface to listen on (listen-only is fine; this flow never transmits).
- `cycle_times` (object, required): Map of ID to specified period in seconds, from the DBC GenMsgCycleTime attribute or the network specification.
- `link_state` (object, required): From `canb-socketcan-link-up`.
- `jitter_tolerance` (object, optional): Allowed deviation per ID from the network specification. If absent, the flow reports numbers without a pass/fail verdict.

---

## Outputs

- `jitter_report` (object): Per ID: frame count, specified period, mean, min, max, standard deviation of inter-arrival time, max absolute deviation from spec, missing-cycle count (whole periods skipped inside gaps), timestamp source, and verdict when a tolerance is given.

---

## Phase 1: Capture with the Best Timestamp

### Entry Criteria
- Interface up and ERROR-ACTIVE.

### Actions
1. `ethtool -T <can_netdev>`. If `hardware-receive` is listed, capture with `candump -H -l`; else use `candump -l` and record "kernel software timestamp".
2. Software timestamps include USB polling and host scheduling delay. For USB adapters, measured jitter includes the adapter's USB transfer timing; record that the result is an upper bound on bus-level jitter.
3. Capture with an ID filter for the IDs in `cycle_times`: `timeout <seconds> candump -l can0,0C9:7FF,1A0:7FF`. Duration is the user's choice; it must contain enough frames for the slowest ID to give a meaningful count (record the count).

### Output
Log with known timestamp source.

### Quality Gate
- Timestamp source recorded from `ethtool -T` output.
- Every ID in `cycle_times` appears in the log at least once (or is listed as absent).

---

## Phase 2: Compute Statistics

### Entry Criteria
- Log captured.

### Actions
1. Write one script `jitter.py` that parses `(ts) iface ID#DATA` lines, groups timestamps by ID, and computes `d[i] = t[i] - t[i-1]`.
2. Per ID: count, mean(d), min(d), max(d), population standard deviation of d, `max(|d - spec|)`, and `missing = sum(max(0, round(d / spec) - 1))`, the number of whole cycles that fit in each gap without a frame. This is a count, not a pass/fail threshold.
3. Use `statistics.pstdev` from the Python standard library; do not hand-roll variance.
4. If `jitter_tolerance` is given: verdict "pass" when `max(|d - spec|) <= tolerance`, else "fail". If not given: verdict "no tolerance specified".

### Output
`jitter_report`.

### Quality Gate
- For every ID, sum of d equals last minus first timestamp (check to 1e-6 s).
- Every verdict is either computed from a provided tolerance or reads "no tolerance specified".

---

## Worked Example

Illustrative. gs_usb adapter with hardware timestamps; IDs 0x0C9 (spec 0.010 s) and 0x1A0 (spec 0.020 s); 60 s capture; no tolerance given.

- Phase 1: `ethtool -T can0` lists `hardware-receive`; `candump -H -l can0,0C9:7FF,1A0:7FF`.
- Phase 2: 0x0C9: 6000 frames, mean 0.0100002, min 0.0099, max 0.0102, pstdev 0.00004, max dev 0.0002, missing 0. 0x1A0: 3000 frames, missing 2 (two gaps of 0.040). Verdicts "no tolerance specified".

---

## Exit Criteria

DONE when every specified ID has period statistics from a capture with a recorded timestamp source, and verdicts are given only where a tolerance was provided.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-H` rejected or no hardware timestamps | **Adjust**: capture with software timestamps and mark results as an upper bound. |
| Phase 1 | ID absent from the log | **Return**: report it; the sender may be off or on another bus. |
| Phase 2 | Sum check fails | **Retry**: frames from another interface were mixed in; filter by interface name. |
| Phase 2 | User asks for a pass/fail without a tolerance | **Return**: ask for the specification value; do not invent one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
