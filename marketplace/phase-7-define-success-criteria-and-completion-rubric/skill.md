# Phase 7 Define Success Criteria And Completion Rubric

**One-line description:** Process checkpoints, extensions, learning_objective to produce completion_rubric.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `checkpoints` (string, required): Input for checkpoints.
- `extensions` (string, required): Input for extensions.
- `learning_objective` (string, required): Input for learning objective.
- `scaffolded_steps` (string, required): Input for scaffolded steps.

---

## Outputs

- `completion_rubric` (object): Completion Rubric.

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

Return the structured result containing `completion_rubric`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
