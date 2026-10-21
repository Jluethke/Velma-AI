# Hardware Power Tree

**One-line description:** Builds the power tree from the input source to every rail, with each rail's current summed from itemized datasheet values, isolated rails for every isolated interface, and the input transient profile carried through.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `board_ask` (string, required): What the board must do.
- `interface_table` (object[], required): From `hw-interface-spec`.
- `environment_profile` (object, required): From `hw-interface-spec`.

---

## Outputs

- `power_tree` (object): Input source, nominal and worst-case range, transient list; every rail with voltage, tolerance, itemized consumers (part, datasheet maximum current, citation), summed worst-case current, regulator type, and estimated dissipation; isolated rails per isolated interface; total worst-case input power and dissipation.

---

## Phase 1: Define the Input

### Entry Criteria
- `environment_profile` present.

### Actions
1. State the input source, nominal voltage, and the full steady-state range (automotive 12V: 6V cold crank to 16V running, plus 24V jump start).
2. Carry the transient list from `environment_profile` onto the input node.

### Output
Input node of `power_tree`.

### Quality Gate
- The input range covers every steady-state condition in the environment profile.

---

## Phase 2: List Rails and Consumers

### Entry Criteria
- Input node defined; `interface_table` present.

### Actions
1. For each function in the ask and each interface, name the device class and its supply rail (example: CAN transceiver on 5V, logic on 3.3V).
2. For each consumer, take the datasheet maximum supply current, not typical, and cite the datasheet line. When the exact part is not chosen yet, use the maximum from a representative datasheet and mark it provisional.
3. Add one isolated rail per isolated interface, sized from its isolator or transceiver datasheet.
4. Sum each rail's consumers to its worst-case current.

### Output
Rail list with itemized consumers.

### Quality Gate
- Every rail current is a sum of cited datasheet maximums.
- Every isolated interface has an isolated rail.

---

## Phase 3: Choose Regulator Types and Dissipation

### Entry Criteria
- Rail list complete.

### Actions
1. For each rail, compute linear dissipation (Vin_max minus Vout) times I_max. If it exceeds 0.5 W, mark the rail for a switching regulator; otherwise a linear regulator is acceptable.
2. For switching rails, estimate dissipation as Pout times (1 / efficiency minus 1) using 85% until a part is chosen, and mark it provisional.
3. Total worst-case input power and board dissipation.

### Output
`power_tree`.

### Quality Gate
- Every rail has a regulator type justified by the dissipation computation.
- Total input power and dissipation are stated.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Build the power tree from input to every rail with itemized datasheet currents, , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every rail's voltage, current, regulator type, and dissipation are derived from cited datasheet numbers, and total input power is known.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Consumer current not published | **Adjust**: use the absolute maximum or a measured value from an app note, cite it, mark provisional. |
| Phase 3 | Total dissipation over 2 W with no airflow stated | **Adjust**: flag thermal design as an open item for the constraints flow. |
| Any | User rejects output | **Targeted revision**: rerun only the affected rail. |

---

## Reference Section

### Linear Versus Switching
Linear dissipation = (Vin - Vout) x I. A 12V to 3.3V linear at 200 mA dissipates 1.74 W; a buck at 90% efficiency dissipates about 0.07 W for the same load.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
