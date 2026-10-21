# OBD-II PID Scaling per SAE J1979

**One-line description:** Converts raw OBD-II service 0x01 responses into engineering units with the SAE J1979 formulas for the common PIDs (load, coolant, fuel trims, MAP, RPM, speed, timing, IAT, MAF, throttle, run time, fuel level, voltage), with unit tests built from known byte patterns.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `supported_pids` (object, required): From `uds-obd2-supported-pids`.
- `raw_pid_responses` (object[], optional): Raw responses to scale. When absent, read them from the vehicle with the requests in `uds-obd2-supported-pids` Phase 3.

---

## Outputs

- `decoded_pids` (object[]): One row per PID per ECU: PID, name, raw bytes, scaled value, unit, formula used.

---

## Phase 1: Validate Raw Responses

### Entry Criteria
- `supported_pids` present.

### Actions
1. For each raw response confirm byte 0 is `41` and byte 1 equals the requested PID. Discard (and record) anything else.
2. Confirm the data length matches the table in Phase 2. A shorter response is malformed; do not scale it.
3. Strip ISO-TP padding before counting; use the SF length nibble, not the 8-byte frame.

### Output
Validated responses.

### Quality Gate
- Every validated response has the data byte count from the Phase 2 table.

---

## Phase 2: Apply J1979 Formulas

### Entry Criteria
- Validated responses.

### Actions
1. Let A, B be the first and second data bytes after `41 <pid>`. Apply:

| PID | Name | Bytes | Formula | Unit |
|---|---|---|---|---|
| 0x04 | Calculated engine load | 1 | A * 100 / 255 | % |
| 0x05 | Engine coolant temperature | 1 | A - 40 | degC |
| 0x06 / 0x07 | Short / long term fuel trim bank 1 | 1 | (A - 128) * 100 / 128 | % |
| 0x0B | Intake manifold absolute pressure | 1 | A | kPa |
| 0x0C | Engine speed | 2 | (256 * A + B) / 4 | rpm |
| 0x0D | Vehicle speed | 1 | A | km/h |
| 0x0E | Timing advance | 1 | A / 2 - 64 | degrees before TDC |
| 0x0F | Intake air temperature | 1 | A - 40 | degC |
| 0x10 | Mass air flow rate | 2 | (256 * A + B) / 100 | g/s |
| 0x11 | Absolute throttle position | 1 | A * 100 / 255 | % |
| 0x1F | Run time since engine start | 2 | 256 * A + B | s |
| 0x2F | Fuel tank level input | 1 | A * 100 / 255 | % |
| 0x33 | Absolute barometric pressure | 1 | A | kPa |
| 0x42 | Control module voltage | 2 | (256 * A + B) / 1000 | V |
| 0x46 | Ambient air temperature | 1 | A - 40 | degC |

2. For any PID not in this table, open SAE J1979 (or J1979-DA, which holds the PID definitions) and copy the formula with its table reference. Do not guess a formula from the PID name.
3. Use floating point for divisions; keep the raw integer too.
4. Never convert km/h to mph silently; add a separate field when the user asks.

### Output
`decoded_pids`.

### Quality Gate
- Every row has `formula` and `unit` filled from the table or a cited J1979-DA reference.

---

## Phase 3: Unit Tests

### Entry Criteria
- A decoder exists in code (any language).

### Actions
1. Add these test vectors and assert exact results:
   - `41 0C 1A F8` gives (256 * 26 + 248) / 4 = 1726.0 rpm.
   - `41 05 7B` gives 123 - 40 = 83 degC.
   - `41 0D 32` gives 50 km/h.
   - `41 10 01 F4` gives 500 / 100 = 5.0 g/s.
   - `41 06 80` gives 0.0 %.
   - `41 42 35 0C` gives 13580 / 1000 = 13.58 V.
2. Add a test that a wrong PID echo (`41 0D` in reply to a `01 0C` request) is rejected.
3. Run the test suite and paste the summary line into `decoded_pids` metadata.
4. Do not change expected values to match the code; fix the code.

### Output
Test summary.

### Quality Gate
- The test runner prints all 7 tests passed and 0 failed.

---

## Worked Example

Illustrative only.

Raw `41 0C 0B B8` from 7E8: A = 0x0B = 11, B = 0xB8 = 184, (256 * 11 + 184) / 4 = 750.0 rpm. Row: `{"ecu": "7E8", "pid": "0C", "name": "Engine speed", "raw": "0BB8", "value": 750.0, "unit": "rpm"}`.

---

## Exit Criteria

DONE when every supported PID with a known formula is scaled with a cited formula and the test vectors pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | PID echo mismatch | **Return**: discard the response and log it; a functional request mixed two replies. |
| Phase 2 | PID missing from the table | **Adjust**: look it up in SAE J1979-DA and cite it, or mark it unscaled. |
| Phase 3 | Test vector fails | **Stop**: fix the decoder; do not edit the vector. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
