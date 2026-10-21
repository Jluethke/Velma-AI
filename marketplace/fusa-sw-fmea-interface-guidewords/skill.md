# Software FMEA on Interface Signals

**One-line description:** Analyzes every safety-relevant software interface signal (CAN frame, ROS 2 topic, shared memory field, function argument) with the software failure guidewords omission, commission, early, late, wrong value, stuck, corrupted and out of sequence, and records for each the detection mechanism that already exists in code, with file and line, or marks the gap.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `architecture_description` (string, required): Block diagram or element list including software components and their interfaces.
- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`.
- `source_dir` (string, required): Path to the source code of the safety-relevant software.

---

## Outputs

- `sw_fmea_rows` (object[]): `row_id`, `signal`, `producer`, `consumer`, `guideword`, `local_effect`, `item_effect`, `linked_req`, `existing_detection` (file:line or `none`), `reaction`, `gap` (true or false).

---

## Phase 1: Signal Inventory

### Entry Criteria
- `source_dir` exists and is readable.
- `safety_requirements` contains at least one TSR.

### Actions
1. List every signal named in a TSR or crossing an element boundary in `architecture_description`.
2. Find the producer and consumer code for each signal with a text search, for example:
   ```
   rg -n "0x210|STEER_CMD_ID" <source_dir>
   rg -n "create_publisher<.*>\(\"/steering_cmd\"" <source_dir>
   rg -n "steering_cmd" <source_dir> --type cpp --type c --type py
   ```
3. Record file and line for producer and consumer. If a signal has no consumer in the code, write that as a finding now.

### Output
Signal table with producer and consumer locations.

### Quality Gate
- Every signal row has producer and consumer file:line, or a written finding explaining the absence.
- Every TSR that names a signal maps to a row.

---

## Phase 2: Apply Guidewords

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. For each signal, apply every guideword:

   | Guideword | Example for a periodic command frame |
   |---|---|
   | Omission | frame not sent |
   | Commission | frame sent when not requested |
   | Early | frame sent before data is valid (startup) |
   | Late | frame delayed past its period |
   | Wrong value | value within range but wrong |
   | Stuck | same value repeated, counter not incrementing |
   | Corrupted | bits changed in transit |
   | Out of sequence | old frame delivered after a newer one |

2. Write `local_effect` (what the consumer does) and `item_effect` (what the vehicle or robot does). Link to the TSR or safety goal the effect violates.
3. Open the consumer code at the recorded line and find the check that detects the guideword: timeout check, alive counter compare, CRC compare, range check, plausibility cross-check with a second source. Record file:line. A check that only logs and continues is not detection with reaction; mark `reaction = log only` and `gap = true`.

### Output
Guideword rows with existing detection and reaction.

### Quality Gate
- Row count equals signals x 8 minus rows marked not applicable with a reason.
- Every row has `existing_detection` as file:line or `none`.
- Every row with `existing_detection = none` and a linked ASIL requirement has `gap = true`.

---

## Phase 3: Gap Report

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Sort gaps by the ASIL of the linked requirement, highest first.
2. For each gap, write the missing mechanism as a TSR proposal: for example "consumer shall reject frames whose 4-bit alive counter does not equal previous + 1 modulo 16". Send these to `fusa-requirements-decomposition` as new TSR candidates.
3. Note "wrong value within range" gaps separately; only a diverse second source or a plausibility model can catch them, and FMEA alone cannot settle whether that is needed.
4. Emit `sw_fmea_rows` as JSON.

### Output
`sw_fmea_rows`.

### Quality Gate
- `jq '[.[]|select(.gap==true)]|length' sw_fmea_rows.json` equals the number of TSR proposals written.
- Every file:line reference opens to a line containing the signal name or the check (spot-check five with `sed -n '<line>p' <file>`).

---

## Worked Example

Illustrative only. Signal `steering_angle_cmd` on CAN 0x210, producer `planner_bridge.cpp:88`, consumer `steer_mcu/src/can_rx.c:142`.

- Guideword Late: consumer has `if ((now_ms - last_rx_ms) > STEER_RX_TIMEOUT_MS) enter_safe_state();` at `can_rx.c:171`. Detection present, reaction present.
- Guideword Stuck: no alive counter compare found by `rg -n "alive" steer_mcu/src` (zero hits). `gap = true`; proposal: add alive counter check.
- Guideword Wrong value: range check at `can_rx.c:150` catches out-of-range only; recorded under the separate within-range note.

---

## Exit Criteria

DONE when every safety-relevant signal has all eight guidewords analyzed with detection located in code or a gap recorded and a TSR proposal written for each gap.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Signal name not found in code | **Adjust**: search by numeric id, topic string and struct field; record a finding if still absent. |
| Phase 2 | Detection exists but is disabled by a build flag | **Adjust**: record it as `none` and cite the flag location. |
| Phase 2 | Reaction only logs | **Adjust**: mark `gap = true`. |
| Phase 3 | Gap list long | **Return**: hand it to the requirements flow ranked by ASIL; do not drop rows. |

**Do not:** edit the source code in this flow, assume a check exists because a library "usually" does it, or cite line numbers you did not open.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
