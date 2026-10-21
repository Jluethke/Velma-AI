# Phase Refactorer

**One-line description:** Process improvement_opportunities, original_phases, quality_issues to produce complexity_reduction, refactored_phases.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `improvement_opportunities` (string, required): Input for improvement opportunities.
- `original_phases` (string, required): Input for original phases.
- `quality_issues` (string, required): Input for quality issues.

---

## Outputs

- `complexity_reduction` (object): Complexity Reduction.
- `refactored_phases` (object): Refactored Phases.

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

Return the structured result containing `complexity_reduction`, `refactored_phases`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
