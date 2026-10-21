# Response Mapper

**One-line description:** Process inferred_resolution_goal, must_address_count, tone_profile to produce decision_points, estimated_word_count, length_flag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `inferred_resolution_goal` (string, required): Input for inferred resolution goal.
- `must_address_count` (string, required): Input for must address count.
- `tone_profile` (string, required): Input for tone profile.
- `unresolved_points` (string, required): Input for unresolved points.

---

## Outputs

- `decision_points` (object): Decision Points.
- `estimated_word_count` (object): Estimated Word Count.
- `length_flag` (object): Length Flag.
- `response_outline` (object): Response Outline.
- `response_structure` (object): Response Structure.

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

Return the structured result containing `decision_points`, `estimated_word_count`, `length_flag`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
