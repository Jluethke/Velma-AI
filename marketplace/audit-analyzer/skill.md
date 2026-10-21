# Audit Analyzer

**One-line description:** Process audit_report to produce improvement_opportunities, issues_prioritized, quality_gaps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `audit_report` (string, required): Input for audit report.

---

## Outputs

- `improvement_opportunities` (object): Improvement Opportunities.
- `issues_prioritized` (object): Issues Prioritized.
- `quality_gaps` (object): Quality Gaps.

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

Return the structured result containing `improvement_opportunities`, `issues_prioritized`, `quality_gaps`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
