# Missing Value Analyzer

**One-line description:** Process dataset_profile, known_constraints to produce missing_value_plan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dataset_profile` (string, required): Input for dataset profile.
- `known_constraints` (string, required): Input for known constraints.

---

## Outputs

- `missing_value_plan` (object): Missing Value Plan.

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

Return the structured result containing `missing_value_plan`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
