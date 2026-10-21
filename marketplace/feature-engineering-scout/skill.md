# Feature Engineering Scout

**One-line description:** Process analysis_scope, correlation_plan, dataset_profile to produce feature_engineering_opportunities.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `analysis_scope` (string, required): Input for analysis scope.
- `correlation_plan` (string, required): Input for correlation plan.
- `dataset_profile` (string, required): Input for dataset profile.
- `distribution_plan` (string, required): Input for distribution plan.

---

## Outputs

- `feature_engineering_opportunities` (object): Feature Engineering Opportunities.

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

Return the structured result containing `feature_engineering_opportunities`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
