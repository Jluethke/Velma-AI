# Kra Decomposer

**One-line description:** Process clarified_goal, goal_context to produce key_result_areas.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `clarified_goal` (string, required): Input for clarified goal.
- `goal_context` (string, optional): Input for goal context.

---

## Outputs

- `key_result_areas` (object): Key Result Areas.

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

Return the structured result containing `key_result_areas`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
