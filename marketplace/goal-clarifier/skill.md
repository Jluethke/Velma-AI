# Goal Clarifier

**One-line description:** Process goal_context, goal_statement, known_risks to produce clarified_goal.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `goal_context` (string, optional): Input for goal context.
- `goal_statement` (string, required): Input for goal statement.
- `known_risks` (string, optional): Input for known risks.

---

## Outputs

- `clarified_goal` (object): Clarified Goal.

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

Return the structured result containing `clarified_goal`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
