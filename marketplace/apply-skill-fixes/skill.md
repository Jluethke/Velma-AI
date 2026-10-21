# Apply Skill Fixes

**One-line description:** Process change_log, improvement_plan, skill_definition to produce improved_skill_definition.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `change_log` (string, required): Input for change log.
- `improvement_plan` (string, required): Input for improvement plan.
- `skill_definition` (string, required): Input for skill definition.

---

## Outputs

- `improved_skill_definition` (object): Improved Skill Definition.

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

Return the structured result containing `improved_skill_definition`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
