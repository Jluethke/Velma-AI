# Phase 3 Decompose Skill Into Scaffolded Learning Steps

**One-line description:** Process common_misconceptions_draft, learning_objective, project_brief to produce scaffolded_steps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `common_misconceptions_draft` (string, required): Input for common misconceptions draft.
- `learning_objective` (string, required): Input for learning objective.
- `project_brief` (string, required): Input for project brief.
- `time_constraint` (string, required): Input for time constraint.

---

## Outputs

- `scaffolded_steps` (object): Scaffolded Steps.

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

Return the structured result containing `scaffolded_steps`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
