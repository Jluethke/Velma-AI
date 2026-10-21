# Email Response Drafter

**One-line description:** Process communication_style, formality_level, length_flag to produce draft_word_count, response_draft, tone_consistency_check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `communication_style` (string, required): Input for communication style.
- `formality_level` (string, required): Input for formality level.
- `length_flag` (string, required): Input for length flag.
- `responder_relationship_clarity` (string, required): Input for responder relationship clarity.
- `response_outline` (string, required): Input for response outline.
- `response_structure` (string, required): Input for response structure.
- `tone_profile` (string, required): Input for tone profile.
- `unresolved_points` (string, required): Input for unresolved points.
- `urgency` (string, required): Input for urgency.

---

## Outputs

- `draft_word_count` (object): Draft Word Count.
- `response_draft` (object): Response Draft.
- `tone_consistency_check` (object): Tone Consistency Check.

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

Return the structured result containing `draft_word_count`, `response_draft`, `tone_consistency_check`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
