# Phase 2 Design Project Concept And Real World Context

**One-line description:** Process available_resources, learner_motivation, learning_objective to produce project_brief.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `available_resources` (string, required): Input for available resources.
- `learner_motivation` (string, required): Input for learner motivation.
- `learning_objective` (string, required): Input for learning objective.

---

## Outputs

- `project_brief` (object): Project Brief.

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

Return the structured result containing `project_brief`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
