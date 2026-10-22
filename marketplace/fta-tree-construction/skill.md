# Fta Tree Construction

Build the fault tree structure using AND, OR, and voting gates, decomposing from the top event to basic events representing component failures or human errors.

## Inputs

- `top-event-statement`: The precisely defined top event
- `boundary-conditions`: Scope and assumptions
- `resolution-level`: Target decomposition depth

## Outputs

- `fault-tree-structure`: Complete tree with all gates (AND, OR, k-of-n voting, PAND for sequence-dependent), intermediate events, and basic events at leaves
- `basic-event-list`: Every leaf node: component failure, human error, or external event, with its description and initial failure rate estimate
- `undeveloped-events`: Events that could not be decomposed further due to data or scope limitations, marked with diamond symbols

## Process

1. Start from the top event and ask: what immediate causes can produce this event? If ALL causes must occur simultaneously, connect them with an AND gate. If ANY single cause is sufficient, use an OR gate. For k-of-n redundancy (e.g., 2-of-3 voting), use a voting gate.
2. Decompose each intermediate event the same way, working downward. At each gate, verify the logic: cover an AND gate output and check that uncovering any single input does not produce the top event. For OR gates, each input alone must be sufficient.
3. Stop decomposition when you reach a basic event: a component failure with a known or estimable failure rate, a human error with a known probability, or an external event (lightning, power loss) with a known frequency. Mark events you cannot decompose as undeveloped (diamond symbol) and document why.
4. For systems where failure sequence matters (e.g., standby redundancy where detection of the first failure is required to switch), use priority AND (PAND) gates or sequence-dependent gates. Document the timing assumption: how long between the first failure and the detection/switching action.
5. Review the completed tree for logical completeness. Check that every basic event appears in at least one minimal cut set. Check that no gate has only one input (a single-input gate is either unnecessary or indicates a missing failure mode).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
