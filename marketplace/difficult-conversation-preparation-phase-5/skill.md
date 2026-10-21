# Difficult Conversation Preparation Phase 5

**One-line description:** Process constraints, core_issue_statement, relationship_goals to produce success_criteria.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `constraints` (string, required): Input for constraints.
- `core_issue_statement` (string, required): Input for core issue statement.
- `relationship_goals` (string, required): Input for relationship goals.

---

## Outputs

- `success_criteria` (object): Success Criteria.

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

Return the structured result containing `success_criteria`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
