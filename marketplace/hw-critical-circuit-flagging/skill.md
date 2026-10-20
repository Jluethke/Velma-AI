# Hardware Critical Circuit Flagging

**One-line description:** Flags every circuit where a design mistake destroys parts or creates a hazard, and writes for each the failure it must survive and, for any interlock or emergency stop, its fail-safe direction.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `board_ask` (string, required): What the board must do.
- `interface_table` (object[], required): From `hw-interface-spec`.
- `power_tree` (object, required): From `hw-power-tree`.

---

## Outputs

- `critical_circuits` (object[]): One entry per critical circuit: id, category (input_protection, isolation, high_current, actuator_power, interlock), the nets or functions involved, the failure it must survive stated as a test condition, and for interlocks the fail-safe direction and reset requirement.

---

## Phase 1: Identify Critical Circuits

### Entry Criteria
- `interface_table` and `power_tree` present.

### Actions
1. Mark as `input_protection` every power entry point: reverse polarity, overvoltage, transient suppression, fusing.
2. Mark as `isolation` every barrier implied by an isolated interface or isolated rail.
3. Mark as `high_current` every path with worst-case current above 3 A in `power_tree`.
4. Mark as `actuator_power` any circuit that grants or removes power to a motor, valve, solenoid, heater, or other actuator.
5. Mark as `interlock` any emergency stop, enable chain, or safety interlock. When the ask includes an actuator and no stop mechanism, add a hardware emergency stop as a critical circuit and flag it.

### Output
Draft critical circuit list.

### Quality Gate
- Every power entry, isolation barrier, path above 3 A, actuator power path, and interlock appears.

---

## Phase 2: Write Survival Requirements

### Entry Criteria
- Draft list exists.

### Actions
1. For each entry, write the failure it must survive as a testable condition (examples: "input reversed indefinitely at the worst-case supply current limit", "ISO 16750-2 load dump pulse at the input", "host processor hung with all outputs frozen high").
2. For each interlock, state the fail-safe direction: loss of board power, a broken wire, or a crashed processor produces the safe state (actuator de-energized). Software may request a stop and holds no path that blocks one.
3. For each interlock, state that restart requires a manual reset.

### Output
`critical_circuits`.

### Quality Gate
- Every entry has a survival requirement phrased as a bench test.
- Every interlock states fail-safe direction and manual reset.

---

## Exit Criteria

DONE when every circuit that can damage hardware or a person is listed with a testable survival requirement, and every interlock is defined as normally closed, energize to run, and manually reset.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Actuator present, no stop in the ask | **Adjust**: add a hardware emergency stop entry and flag it for the user. |
| Phase 2 | Environment transient standard unknown | **Adjust**: use the profile from `power_tree`; record the standard used. |
| Any | User rejects output | **Targeted revision**: rerun only the disputed entry. |

---

## Reference Section

### Emergency Stop Principles
Normally closed, energize to run, de-energize to stop; independent of software; latching with manual reset; single faults end safe or are detected. ISO 13849-1 sets performance levels where a certified safety function is required; this flow applies its single-fault reasoning and does not certify a level.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
