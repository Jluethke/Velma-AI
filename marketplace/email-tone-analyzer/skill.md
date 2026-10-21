# Email Tone Analyzer

**One-line description:** Process emotional_trajectory, responder_relationship_to_sender, responder_role to produce communication_style, formality_level, inferred_resolution_goal.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `emotional_trajectory` (string, required): Input for emotional trajectory.
- `responder_relationship_to_sender` (string, required): Input for responder relationship to sender.
- `responder_role` (string, required): Input for responder role.
- `structured_thread` (string, required): Input for structured thread.
- `tone_override` (string, required): Input for tone override.
- `unresolved_points` (string, required): Input for unresolved points.

---

## Outputs

- `communication_style` (object): Communication Style.
- `formality_level` (object): Formality Level.
- `inferred_resolution_goal` (object): Inferred Resolution Goal.
- `responder_relationship_clarity` (object): Responder Relationship Clarity.
- `tone_analysis` (object): Tone Analysis.
- `tone_override_applied` (object): Tone Override Applied.
- `urgency` (object): Urgency.

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

Return the structured result containing `communication_style`, `formality_level`, `inferred_resolution_goal`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
