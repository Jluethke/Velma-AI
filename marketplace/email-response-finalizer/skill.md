# Email Response Finalizer

**One-line description:** Process action_items, addressed_points, iteration_needed to produce addressed_points_final, follow_up_suggestion, iteration_count.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `action_items` (string, required): Input for action items.
- `addressed_points` (string, required): Input for addressed points.
- `iteration_needed` (string, required): Input for iteration needed.
- `resolution_status` (string, required): Input for resolution status.
- `response_draft` (string, required): Input for response draft.
- `tone_analysis` (string, required): Input for tone analysis.
- `validation_notes` (string, required): Input for validation notes.

---

## Outputs

- `addressed_points_final` (object): Addressed Points Final.
- `follow_up_suggestion` (object): Follow Up Suggestion.
- `iteration_count` (object): Iteration Count.
- `ready_to_send` (object): Ready To Send.
- `resolution_status_final` (object): Resolution Status Final.
- `response_draft_final` (object): Response Draft Final.
- `tone_analysis_final` (object): Tone Analysis Final.
- `validation_notes_final` (object): Validation Notes Final.

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

Return the structured result containing `addressed_points_final`, `follow_up_suggestion`, `iteration_count`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
