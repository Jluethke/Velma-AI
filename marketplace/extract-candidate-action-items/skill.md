# Extract Candidate Action Items

**One-line description:** Process attendee_list, meeting_notes, parsed_structure to produce candidate_actions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `attendee_list` (string, required): Input for attendee list.
- `meeting_notes` (string, required): Input for meeting notes.
- `parsed_structure` (string, required): Input for parsed structure.

---

## Outputs

- `candidate_actions` (object): Candidate Actions.

---

## Worked Example

### Entry Criteria

All required inputs are provided and validated.

### Actions

## Phase 1: Analyze

Examine the provided inputs and extract key information.

### Quality Gate

All inputs parsed. No missing required fields.

### Actions

## Phase 2: Process

Apply domain logic to transform inputs into structured outputs.

### Quality Gate

All outputs populated. No empty required fields.

### Output

Return the structured result containing `candidate_actions`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
