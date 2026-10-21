# Export Skill Definition

**One-line description:** Process improved_skill_definition, skill_documentation, validation_report to produce deployment_checklist, final_skill_json.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `improved_skill_definition` (string, required): Input for improved skill definition.
- `skill_documentation` (string, required): Input for skill documentation.
- `validation_report` (string, required): Input for validation report.

---

## Outputs

- `deployment_checklist` (object): Deployment Checklist.
- `final_skill_json` (object): Final Skill Json.

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

Return the structured result containing `deployment_checklist`, `final_skill_json`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
