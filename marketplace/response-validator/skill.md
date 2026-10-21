# Response Validator

**One-line description:** Process emotional_trajectory, inferred_resolution_goal, must_address_count to produce addressed_points, clarity_check, iteration_needed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `emotional_trajectory` (string, required): Input for emotional trajectory.
- `inferred_resolution_goal` (string, required): Input for inferred resolution goal.
- `must_address_count` (string, required): Input for must address count.
- `response_draft` (string, required): Input for response draft.
- `tone_profile` (string, required): Input for tone profile.
- `unresolved_points` (string, required): Input for unresolved points.

---

## Outputs

- `addressed_points` (object): Addressed Points.
- `clarity_check` (object): Clarity Check.
- `iteration_needed` (object): Iteration Needed.
- `resolution_status` (object): Resolution Status.
- `tone_match` (object): Tone Match.
- `validation_notes` (object): Validation Notes.

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

Return the structured result containing `addressed_points`, `clarity_check`, `iteration_needed`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
