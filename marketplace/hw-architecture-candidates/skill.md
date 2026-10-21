# Hardware Architecture Candidates

**One-line description:** Generates at least four alternative board architectures, at least two of them unconventional, each built on a named design lever with a stated mechanism for beating the conventional baseline.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `board_spec` (object, required): From `hw-spec-consolidate`.
- `critical_circuits` (object[], required): From `hw-critical-circuit-flagging`.
- `baseline_architecture` (object, required): From `hw-baseline-architecture`.

---

## Outputs

- `architecture_candidates` (object[]): At least 4 candidates. Each: id, the lever or levers applied, the blocks changed relative to baseline, the parts that make it possible (with datasheet citations), the mechanism by which it should beat baseline on named objectives, `unconventional` flag with reason, and any critical circuit it touches.

---

## Phase 1: Find Lever Opportunities

### Entry Criteria
- All inputs present.

### Actions
1. Walk every block of `baseline_architecture` against the lever list in the Reference Section and record each block where a lever applies.
2. For each opportunity, search for parts that enable it (example: an isolated CAN transceiver with integrated isolated power, a microcontroller with on-chip CAN FD, an ideal-diode controller rated for the environment) and cite their datasheets.
3. Discard opportunities with no available enabling part.

### Output
Lever opportunity list.

### Quality Gate
- Each opportunity names the block, the lever, and a cited enabling part.

---

## Phase 2: Compose Candidates

### Entry Criteria
- Opportunity list exists.

### Actions
1. Compose at least 4 candidates, each a coherent combination of opportunities. Include at least one single-lever candidate (to isolate that lever's effect) and at least one combining three or more levers.
2. Mark a candidate `unconventional` when it departs from vendor reference practice: repartitioning, function merging, board shape fitted to the enclosure, or a topology the baseline references do not use for this function. At least 2 candidates are unconventional.
3. For each candidate, write the mechanism per objective (example: "deletes the 5V rail by choosing a 3.3V-supply transceiver; expected gains: part count minus 6, dissipation minus the 5V regulator loss").
4. List every critical circuit the candidate touches. A candidate may change how a critical circuit is built; it may never remove its protection.

### Output
`architecture_candidates`.

### Quality Gate
- At least 4 candidates, at least 2 unconventional.
- Every candidate states lever, mechanism per objective, and cited enabling parts.
- No candidate removes a critical circuit's protection.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Generate at least four alternative board architectures, two or more unconvention, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when at least four cited, coherent candidates exist, each with a mechanism that predicts which baseline metrics it moves and in which direction.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fewer than 4 viable opportunities | **Adjust**: add board-level levers (shape, layer count, repartitioning), which apply to any board. |
| Phase 2 | Candidate weakens a critical circuit | **Reject**: drop it and record why. |
| Any | User rejects candidates | **Targeted revision**: ask which lever or objective to emphasize and regenerate. |

---

## Reference Section

### Design Levers
- **Topology swap:** linear to synchronous buck; Schottky reverse protection to P-channel MOSFET or ideal-diode controller; discrete to integrated protection.
- **Integration:** isolator with integrated isolated DC-DC; microcontroller with on-chip peripherals replacing external controllers; transceiver with integrated ESD.
- **Rail consolidation:** choose parts that share one supply voltage to delete a regulator stage.
- **Function merging:** one part doing two jobs (ideal-diode controller also providing overvoltage cutoff).
- **Repartitioning:** move a cable's job onto a board-edge connector; fold two boards into one; split a hot section onto its own board.
- **Board shape:** outline fitted to the enclosure cavity to shorten paths and free area.
- **Component count reduction:** fewer, larger passives; resistor arrays; internal pull-ups where specified.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
