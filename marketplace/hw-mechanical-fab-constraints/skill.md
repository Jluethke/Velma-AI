# Hardware Mechanical and Fab Constraints

**One-line description:** Fixes the board outline, mounting holes, connector positions, layer count, and the fab's published design rules so placement and routing start from cited limits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `interface_table` (object[], required): Connectors and their families.
- `power_tree` (object, required): Rail currents, dissipation, switching regulators.
- `mechanical_limits` (string, optional): Maximum outline, mounting pattern, fixed connector positions, enclosure. Default: smallest outline that fits the connectors, with corner mounting holes.
- `fab_target` (string, optional): Fab and assembly service. Default: JLCPCB with assembly, standard capabilities.

---

## Outputs

- `mechanical_envelope` (object): Outline dimensions, mounting hole positions and sizes, fixed connector positions and edge orientation, maximum component height per side if constrained.
- `fab_rules` (object): Minimum trace width and space, minimum drill, via size, annular ring, copper weight options, board thickness, assembly limits, each cited to the fab's capabilities page with the page date.
- `layer_count` (integer): 2 or 4 (or more), with the reason.

---

## Phase 1: Set the Mechanical Envelope

### Entry Criteria
- `interface_table` present.

### Actions
1. Apply `mechanical_limits` when given. Otherwise sum connector footprints from their datasheets, place them on edges by cable direction, and propose the smallest rectangle that fits them with 3 mm edge clearance.
2. Place M3 mounting holes (3.2 mm drill) at the corners, 4 mm from each edge, unless a mounting pattern is given.
3. Record any height limit per side.

### Output
`mechanical_envelope`.

### Quality Gate
- Every connector from `interface_table` has a position and edge.
- Every dimension is either given by the user or derived from cited connector datasheets.

---

## Phase 2: Choose Layer Count

### Entry Criteria
- `power_tree` present.

### Actions
1. Choose 2 layers when every interface runs below 10 MHz, no switching regulator exceeds 1 A, and there is no isolation barrier.
2. Choose 4 layers (signal, ground, power, signal) when any of those conditions fail, so every signal has a continuous reference plane.
3. Record the reason.

### Output
`layer_count`.

### Quality Gate
- The layer count follows the stated rule and the reason names the triggering condition.

---

## Phase 3: Record Fab Rules

### Entry Criteria
- `fab_target` known or defaulted.

### Actions
1. Open the fab's published capabilities page and record minimum trace/space, drill, via, annular ring, copper weights, thickness options, and assembly limits for the chosen layer count.
2. Cite the page URL and the date read.

### Output
`fab_rules`.

### Quality Gate
- Every rule cites the fab page and date.

---

## Exit Criteria

DONE when outline, holes, connector positions, layer count, and every fab minimum are fixed and cited.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Connectors do not fit the given maximum outline | **Adjust**: report the shortfall in mm and propose the smallest outline that fits. |
| Phase 3 | Fab page unreachable | **Adjust**: use the fab's most recent cached page and record its date; flag for recheck. |
| Any | User rejects output | **Targeted revision**: rerun the affected phase. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
