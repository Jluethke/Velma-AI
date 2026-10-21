# Phase 9 Develop Instructor Guide And Differentiation Strategy

**One-line description:** Process checkpoints, common_misconceptions_draft, extensions to produce differentiation_strategy, instructor_guide.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `checkpoints` (string, required): Input for checkpoints.
- `common_misconceptions_draft` (string, required): Input for common misconceptions draft.
- `extensions` (string, required): Input for extensions.
- `learner_level` (string, required): Input for learner level.
- `scaffolded_steps` (string, required): Input for scaffolded steps.
- `validation_report` (string, required): Input for validation report.

---

## Outputs

- `differentiation_strategy` (object): Differentiation Strategy.
- `instructor_guide` (object): Instructor Guide.

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

Return the structured result containing `differentiation_strategy`, `instructor_guide`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
