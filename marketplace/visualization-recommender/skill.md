# Visualization Recommender

**One-line description:** Process correlation_plan, distribution_plan, outlier_detection_plan to produce visualization_recommendations.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `correlation_plan` (string, required): Input for correlation plan.
- `distribution_plan` (string, required): Input for distribution plan.
- `outlier_detection_plan` (string, required): Input for outlier detection plan.

---

## Outputs

- `visualization_recommendations` (object): Visualization Recommendations.

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

Return the structured result containing `visualization_recommendations`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
