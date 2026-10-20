# Hardware Bring-Up Plan

**One-line description:** Writes a staged bring-up plan for a new board: unpowered checks, current-limited first power, rails, critical circuits first including every interlock single fault, conversion efficiency at three loads, interfaces on a bench target, and the real system connected last.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `board_spec` (object, required): Power tree, interfaces, environment.
- `critical_circuits` (object[], required): Circuits to exercise first.
- `review_report` (object[], required): The single faults enumerated for each interlock.
- `layout_notes` (string[], required): Where each critical circuit sits and which nets were hand-routed, so probe points can be named.

---

## Outputs

- `bringup_plan` (object[]): Ordered steps, each with setup, probe points, the measurement, expected value with tolerance, and the stop condition.

---

## Phase 1: Power Steps

### Entry Criteria
- All inputs present.

### Actions
1. Step 1, unpowered: resistance from input to ground and from each rail to ground; expected not a short (record the computed load resistance where known). Stop on any reading under 10 ohm on a rail not expected to be that low.
2. Step 2, first power: bench supply at nominal input, current limit at 1.25x the computed idle draw from the power tree. Record draw. Stop if the supply enters current limit.
3. Step 3, rails: measure each rail against its target within the regulator's datasheet tolerance.
4. Step 4, efficiency: with electronic or resistor loads, measure input voltage and current and each rail's output voltage and current at light (10%), typical, and full load. Efficiency = sum of rail output power / input power. Record the datasheet-predicted efficiency at each point beside it.

### Output
Power steps.

### Quality Gate
- Every step has a measurement, expected value, and stop condition.
- Efficiency is defined as measured input versus per-rail output power at three loads.

---

## Phase 2: Critical Circuit Steps

### Entry Criteria
- Power steps written.

### Actions
1. Order critical circuits as listed in `critical_circuits`.
2. Reverse polarity: apply reversed input briefly at a 100 mA current limit; expected no conduction and no damage; then repeat Step 3.
3. Isolation: measure resistance across each barrier; expected over 10 megohm.
4. For each interlock, one step per single fault listed in `review_report` (power loss, host hung, output shorted high, loop wire broken, wire shorted to ground, contact welded): induce the fault and confirm the actuator output is de-energized or the fault is latched. Confirm restart requires the manual reset.

### Output
Critical circuit steps.

### Quality Gate
- Every single fault in `review_report` has its own step.
- Every step names how to induce the fault safely.

---

## Phase 3: Interface and System Steps

### Entry Criteria
- Critical steps written.

### Actions
1. For each interface, bring it up against a bench target before the real far end (e.g., two bus nodes on a correctly terminated bench bus).
2. Final step: connect the real system only after every earlier step passes.

### Output
`bringup_plan`.

### Quality Gate
- Every interface has a bench-target step.
- The real system connection is the last step.

---

## Exit Criteria

DONE when the plan takes a new board from unpowered to the real system with every critical circuit and every interlock fault exercised before the real system is connected, and efficiency measured at three loads.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Idle draw unknown | **Adjust**: compute from datasheet quiescent currents, record the assumption. |
| Phase 2 | A fault cannot be induced safely on the bench | **Adjust**: specify a fixture or simulation of the fault input, record it. |
| Phase 3 | No bench target available for an interface | **Adjust**: specify a loopback test, record it. |

---

## Reference Section

### Why Current-Limited First Power
A short or a reversed part draws its fault current from an unlimited supply in milliseconds. A bench supply at 1.25x expected draw turns a destroyed board into a measurement.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
