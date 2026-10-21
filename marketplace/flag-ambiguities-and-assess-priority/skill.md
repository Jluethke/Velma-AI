# Flag Ambiguities And Assess Priority

**One-line description:** Process actions_with_reminders to produce actions_with_priority, ambiguities_summary.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `actions_with_reminders` (string, required): Input for actions with reminders.

---

## Outputs

- `actions_with_priority` (object): Actions With Priority.
- `ambiguities_summary` (object): Ambiguities Summary.

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

Return the structured result containing `actions_with_priority`, `ambiguities_summary`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
