# CAN Bus Termination Check

**One-line description:** Verifies high-speed CAN bus termination by measuring the resistance between CAN_H and CAN_L with the bus unpowered, and maps the reading to the number of 120 ohm terminators present per ISO 11898-2.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_kind` (string, required): From `canb-tx-scope-check` inputs; "virtual", "bench", "closed_course" or "vehicle". A virtual bus has no physical layer and skips this flow.
- `bus_topology` (string, optional): Description of the harness: which nodes, which ones have on-board termination, stub lengths, and where the adapter connects (for example the SAE J1962 OBD-II connector, pin 6 CAN_H and pin 14 CAN_L).

---

## Outputs

- `termination_report` (object): Measured resistance, meter model, power state during measurement, inferred terminator count, and verdict "ok", "missing_one", "extra", "open", or "short".

---

## Phase 1: Prepare a Safe Measurement

### Entry Criteria
- `target_kind` is not "virtual".

### Actions
1. Remove power from every node on the bus. For a vehicle: ignition off, key out of range for keyless systems, and wait for the modules to sleep (the user's vehicle service information gives the sleep time; if unknown, record that). A resistance reading on a powered bus is invalid.
2. Unplug the CAN adapter from the bus, or confirm the adapter has no termination enabled (many USB adapters have a termination jumper or solder bridge; read its manual).
3. Set a digital multimeter to the ohms range. Record the meter model.
4. Identify CAN_H and CAN_L at the access point. At an OBD-II (SAE J1962) port: pin 6 is CAN_H, pin 14 is CAN_L for the diagnostic high-speed CAN.

### Output
Bus unpowered, probes on CAN_H and CAN_L.

### Quality Gate
- Power state "off" is recorded with how it was confirmed.
- Adapter termination state is recorded.

---

## Phase 2: Measure and Classify

### Entry Criteria
- Phase 1 complete.

### Actions
1. Measure resistance CAN_H to CAN_L. Wait for the reading to settle and record it.
2. ISO 11898-2 specifies a 120 ohm nominal termination at each end of the bus. Two in parallel read about 60 ohm. Classify with the table below, using your resistors' tolerance (from their datasheet or marking) and the meter accuracy (from its manual) to set the band. Do not invent a band.

| Reading near | Terminators | Verdict |
|---|---|---|
| 60 ohm (two 120 in parallel) | 2 | ok |
| 120 ohm | 1 | missing_one |
| 40 ohm (three in parallel) or lower but not near 0 | 3 or more | extra |
| open (OL) | 0 | open |
| near 0 ohm | wiring fault | short |

3. If the verdict is not "ok", measure at a second access point if one exists and record it; a different reading means a broken segment between the two points.
4. Optional, with power on and the bus idle: measure DC voltage CAN_H to ground and CAN_L to ground. Compare against the recessive levels in the transceiver datasheet; record the datasheet section used.

### Output
`termination_report`.

### Quality Gate
- The recorded reading has units and a meter model.
- The verdict follows from one row of the table with the tolerance band written out.

---

## Worked Example

Illustrative. Bench harness: two dev boards, each with a 120 ohm jumper, one USB adapter with termination off.

- Phase 1: bench power supply off; adapter termination jumper confirmed open.
- Phase 2: meter reads 121.4 ohm. Row "120 ohm" matches, verdict "missing_one". Second check: one dev board's jumper was not fitted. Fitted it; reading 60.3 ohm, verdict "ok".

---

## Exit Criteria

DONE when `termination_report` holds an unpowered resistance reading and a verdict from the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `target_kind` is "virtual" | **Return**: emit `termination_report` with verdict "not_applicable". |
| Phase 1 | Cannot confirm the bus is unpowered | **Stop**: do not take a reading; a powered reading is meaningless. |
| Phase 2 | Reading drifts | **Retry**: modules may still be awake; wait and remeasure. |
| Phase 2 | Verdict "extra" or "missing_one" on a vehicle | **Return**: report it; do not remove or add vehicle terminators without the vehicle service information. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
