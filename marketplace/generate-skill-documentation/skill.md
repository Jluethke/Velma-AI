# Generate Skill Documentation

**One-line description:** Process change_log, improved_skill_definition, validation_report to produce skill_documentation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `change_log` (string, required): Input for change log.
- `improved_skill_definition` (string, required): Input for improved skill definition.
- `validation_report` (string, required): Input for validation report.

---

## Outputs

- `skill_documentation` (object): Skill Documentation.

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

Return the structured result containing `skill_documentation`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
