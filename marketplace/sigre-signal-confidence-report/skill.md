# Per-Signal Confidence Report

**One-line description:** Assigns every decoded signal a confidence level from explicit evidence rules (action-correlated, reference-fitted, held-out validated, replay-consistent), lists the evidence and open questions for each, and writes `signal_confidence.md` next to the DBC.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dbc_validation` (object, required): Output of `sigre-cantools-dbc-validate`.
- `scaled_signals` (object[], required): Output of `sigre-scale-offset-regression`.
- `counter_checksum_map` (object[], required): Output of `sigre-counter-checksum-detect`.
- `canplayer_replay_report` (object, optional): Output of `sigre-linux-canplayer-offline-replay`.
- `python_replay_report` (object, optional): Output of `sigre-py-offline-replay-decode`.
- `savvycan_replay_report` (object, optional): Output of `sigre-savvycan-offline-playback`.

---

## Outputs

- `signal_confidence_report` (object): Path to `work/signal_confidence.md` and a table with one row per signal: ID, name, level, evidence list, failed checks, open questions, and the commands that reproduce each piece of evidence.

---

## Phase 1: Gather Evidence per Signal

### Entry Criteria
- `dbc_validation` exists.

### Actions
1. List every `SG_` in the DBC: `cantools dump work/vehicle_re.dbc | grep -E '^\s+[A-Za-z_]+'` or iterate `db.messages` / `msg.signals` with the cantools API.
2. For each signal collect, from earlier outputs only (do not recompute or reinterpret):
   - action correlation tier (strict, ranked, weak) and repetitions from `candidate_bytes` via its `CM_` comment
   - `boundary_resolved`
   - fit R squared, `fit_r2_min`, rounded-factor decision from `scaled_signals`
   - held-out result from `dbc_validation`
   - range, counter and checksum check counts from `dbc_validation`
   - replay result from whichever replay report exists

### Output
Evidence table.

### Quality Gate
- Every `SG_` in the DBC has a row.
- Every evidence cell names its source output.

---

## Phase 2: Assign Levels

### Entry Criteria
- Evidence table complete.

### Actions
1. Assign the highest level whose every condition holds:

| Level | Name | Conditions |
|---|---|---|
| 0 | Unknown | Field changes, but no action or reference explains it |
| 1 | Correlated | Strict or ranked tier for one labeled action in every repetition |
| 2 | Fitted | Level 1, plus reference fit with R squared at or above `fit_r2_min`, zero range failures, and `boundary_resolved` true |
| 3 | Validated | Level 2, plus held-out pass in `dbc_validation`, plus a replay report pass |
| C | Structural | Counter or checksum with full match fraction in `counter_checksum_map` and the same fraction rechecked in `dbc_validation` |

2. A state signal (flag or enum) without a numeric reference tops out at level 1 unless a held-out capture repeats the same action with the same result; then record it as level 3 with "held-out action repeat" as evidence instead of a fit.
3. Never raise a level because the signal "makes sense"; only listed evidence counts.
4. For every signal below level 3, write the specific missing evidence as an open question (for example "upper boundary unproven above bit 3 of byte 0: capture above 41 km/h").

### Output
Levels and open questions.

### Quality Gate
- Every level cites each condition it relies on.
- Every signal below level 3 has at least one open question naming the capture or test that would close it.

---

## Phase 3: Write the Report

### Entry Criteria
- Levels assigned.

### Actions
1. Write `work/signal_confidence.md` with: vehicle description, capture dates, stack, the levels table above, then one section per message with each signal's level, evidence, reproduce commands and open questions.
2. State at the top: "Decoded from passive listen-only captures of an owned vehicle. No frames were transmitted. Values are engineering estimates, not manufacturer data."
3. Update each signal's `CM_ SG_` comment in a copy of the DBC (`work/vehicle_re_v2.dbc`) to begin with `conf=<level>;`, then reload with cantools to confirm the file still parses.
4. Emit `signal_confidence_report`.

### Output
`signal_confidence_report`.

### Quality Gate
- `python -c "import cantools; cantools.database.load_file('work/vehicle_re_v2.dbc')"` exits without error.
- `grep -c 'conf=' work/vehicle_re_v2.dbc` equals the number of `SG_` lines.

---

## Worked Example

Illustrative only.

| ID | Signal | Level | Evidence | Open question |
|---|---|---|---|---|
| 0x2C4 | VehicleSpeed | 3 | strict drive_speed 5/5; 16-bit after boundary fix; R2 0.99973 (min 0.999); held-out R2 0.99962; canplayer replay identical | none |
| 0x3B0 | BrakePedalPressed | 3 | strict brake 5/5; held-out action repeat 5/5; replay identical | none |
| 0x2C4 | BrakePressureRaw | 1 | strict brake 5/5; no pressure reference | scale needs a reference; unscaled |
| 0x1A0 | Counter_1A0 | C | step 1 match 1.0000; rechecked | none |
| 0x1A0 | Checksum_1A0 | C | CRC-8 SAE J1850 match 1.0000; rechecked | none |

---

## Exit Criteria

DONE when every DBC signal has an evidence-backed level, every gap below level 3 has an open question naming how to close it, and the annotated DBC copy loads in cantools.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A signal has no `CM_` evidence comment | **Return**: to `sigre-dbc-entry-write` to add it. |
| Phase 2 | Evidence conflicts (fit passes, held-out fails) | **Adjust**: assign the lower level and record both results. |
| Phase 3 | Annotated DBC fails to load | **Adjust**: a quote or semicolon inside a comment broke the syntax; escape or remove it and reload. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
