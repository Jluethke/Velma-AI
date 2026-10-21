# Audit Skill Definition

**One-line description:** Process audit_criteria, skill_definition to produce audit_report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `audit_criteria` (string, required): Input for audit criteria.
- `skill_definition` (string, required): Input for skill definition.

---

## Outputs

- `audit_report` (object): Audit Report.

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

Return the structured result containing `audit_report`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
