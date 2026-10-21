# Format And Output Structured Action Items

**One-line description:** Process actions_with_priority, ambiguities_summary, default_reminder_days_before to produce action_items, ambiguities_summary, processing_notes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `actions_with_priority` (string, required): Input for actions with priority.
- `ambiguities_summary` (string, required): Input for ambiguities summary.
- `default_reminder_days_before` (string, required): Input for default reminder days before.
- `timezone` (string, required): Input for timezone.

---

## Outputs

- `action_items` (object): Action Items.
- `ambiguities_summary` (object): Ambiguities Summary.
- `processing_notes` (object): Processing Notes.

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

Return the structured result containing `action_items`, `ambiguities_summary`, `processing_notes`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
