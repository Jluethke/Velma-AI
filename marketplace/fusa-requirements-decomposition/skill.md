# Derive Functional and Technical Safety Requirements with ASIL Decomposition

**One-line description:** Derives functional safety requirements (FSR) from each safety goal, allocates them to architecture elements, applies ASIL decomposition only in the pairs listed in ISO 26262-9 clause 5 with a recorded independence argument, and refines each FSR into testable technical safety requirements (TSR).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_goals` (object[], required): Output of `fusa-safety-goals-safe-states`.
- `item_definition` (object, required): Output of `fusa-item-definition`.
- `architecture_description` (string, required): Path to a block diagram or text listing hardware and software elements (MCUs, compute boards, processes, nodes, relays) and their connections.

---

## Outputs

- `safety_requirements` (object[]): `req_id` (FSR-nnn or TSR-nnn), `parent` (SG or FSR id), `text`, `asil` (with decomposition notation such as `B(D)` when decomposed), `allocated_to`, `verification_method` (test, analysis, inspection, review), `independence_argument` (for decomposed pairs), `open_questions`.

---

## Phase 1: Functional Safety Requirements

### Entry Criteria
- Every safety goal has a safe state mechanism.
- `architecture_description` names at least one element.

### Actions
1. For each goal, write FSRs covering these five aspects (ISO 26262-3 clause 7 lists them as content of the functional safety concept): fault detection, fault reaction and transition to the safe state, fault tolerant time, warning or degradation to the driver or operator, and arbitration of conflicting requests.
2. Write each FSR as one "shall" sentence with one subject, for example: "The item shall detect a steering angle command that deviates from the plausibility range and remove steering motor power within the detection-plus-reaction budget of SG-02."
3. Give each FSR the ASIL of its goal.
4. Allocate each FSR to one architecture element in `architecture_description`. If no element fits, add an open question; do not invent hardware.

### Output
FSR list with parents, ASIL and allocation.

### Quality Gate
- Every goal has at least one FSR for detection and one for reaction.
- Every FSR contains exactly one "shall".
- Every `allocated_to` value appears verbatim in `architecture_description`.

---

## Phase 2: ASIL Decomposition

### Entry Criteria
- Phase 1 gate passed.
- The team wants to implement a requirement with redundant, independent elements.

### Actions
1. Use only these decomposition pairs from ISO 26262-9 clause 5 (verify against your copy):

   | Original | Allowed pairs |
   |---|---|
   | D | C(D) + A(D); B(D) + B(D); D(D) + QM(D) |
   | C | B(C) + A(C); C(C) + QM(C) |
   | B | A(B) + A(B); B(B) + QM(B) |
   | A | A(A) + QM(A) |

2. Write both redundant requirements, each with the decomposed notation (for example `B(D)`).
3. Write an `independence_argument` for the pair: separate power supply, separate clock, separate software, physical separation, no shared sensor. Each shared resource is a dependent failure candidate and must be listed for the dependent failure analysis (ISO 26262-9 clause 7).
4. If the two elements share a supply, a clock, a sensor or the same software build, decomposition is not allowed; keep the original ASIL on one element.

### Output
Decomposed requirement pairs with independence arguments.

### Quality Gate
- Every decomposed pair matches a row in the table above.
- Every decomposed pair has a non-empty `independence_argument` and a list of shared resources (possibly empty with a written reason).

---

## Phase 3: Technical Safety Requirements

### Entry Criteria
- Phase 2 gate passed or skipped (no decomposition).

### Actions
1. Refine each FSR into TSRs that name the mechanism: "The steering MCU shall compare the received `steering_angle_cmd` with the range [user-supplied min, max] every control cycle and, on violation, drive GPIO `STOP_REQ_N` low within one control cycle." Every number comes from the user, a datasheet or the goal's FTTI derivation, with the source cited in the requirement.
2. Set `verification_method` for each TSR. Requirements on timing are verified by test with measurement (logic analyzer or oscilloscope), not by review.
3. Emit `safety_requirements` as JSON with FSRs and TSRs together.

### Output
`safety_requirements`.

### Quality Gate
- Every TSR has a `parent` FSR and every FSR has a `parent` goal (`jq` query finds zero orphans).
- Every TSR containing a number cites its source in the text or in `open_questions`.
- Every timing TSR has `verification_method = test`.

---

## Worked Example

Illustrative only. `SG-02` ASIL B.

- Phase 1: `FSR-004 (B): The item shall remove steering motor power when the steering command is implausible.` Allocated to `steering MCU`.
- Phase 2: team splits into `TSR` paths on the steering MCU and an external window watchdog IC as `A(B) + A(B)`; independence argument: separate clock, separate supply regulator; shared resource: the 12 V input, listed for dependent failure analysis.
- Phase 3: `TSR-011 A(B): The steering MCU shall drive STOP_REQ_N low within 10 ms of detecting a CRC or alive-counter error on CAN id 0x210 (10 ms from SG-02 FTTI budget allocation, see Q4).`

---

## Exit Criteria

DONE when every goal has detection and reaction FSRs, every FSR is allocated and refined into TSRs with a verification method, and every decomposition has an allowed pair and an independence argument.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Element for allocation missing from the architecture | **Return**: ask for the architecture element; record an open question. |
| Phase 2 | Requested pair not in the table | **Stop**: decomposition not allowed in that form; keep the original ASIL. |
| Phase 2 | Redundant elements share software | **Adjust**: drop the decomposition or add diverse implementation and document it. |
| Phase 3 | TSR contains a number with no source | **Adjust**: replace with a named user input or open question. |

**Do not:** decompose to lower cost without independence, write requirements with "and" joining two behaviors, or let software be the only path to the safe state.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
