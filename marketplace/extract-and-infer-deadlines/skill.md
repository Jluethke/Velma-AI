# Extract And Infer Deadlines

**One-line description:** Process actions_with_owners, meeting_notes, timezone to produce actions_with_deadlines.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `actions_with_owners` (string, required): Input for actions with owners.
- `meeting_notes` (string, required): Input for meeting notes.
- `timezone` (string, required): Input for timezone.

---

## Outputs

- `actions_with_deadlines` (object): Actions With Deadlines.

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

Return the structured result containing `actions_with_deadlines`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
