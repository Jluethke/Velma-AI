# Phase 8 Validate Project Design Against Learning Objective

**One-line description:** Process available_resources, checkpoints, completion_rubric to produce validation_report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `available_resources` (string, required): Input for available resources.
- `checkpoints` (string, required): Input for checkpoints.
- `completion_rubric` (string, required): Input for completion rubric.
- `extensions` (string, required): Input for extensions.
- `learning_objective` (string, required): Input for learning objective.
- `prerequisites` (string, required): Input for prerequisites.
- `project_brief` (string, required): Input for project brief.
- `scaffolded_steps` (string, required): Input for scaffolded steps.
- `supporting_materials` (string, required): Input for supporting materials.

---

## Outputs

- `validation_report` (object): Validation Report.

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

Return the structured result containing `validation_report`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
