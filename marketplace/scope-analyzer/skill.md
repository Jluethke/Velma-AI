# Scope Analyzer

**One-line description:** Process project_type, scope_document to produce clarification_questions, scope_summary.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_type` (string, required): Input for project type.
- `scope_document` (string, required): Input for scope document.

---

## Outputs

- `clarification_questions` (object): Clarification Questions.
- `scope_summary` (object): Scope Summary.

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

Return the structured result containing `clarification_questions`, `scope_summary`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
