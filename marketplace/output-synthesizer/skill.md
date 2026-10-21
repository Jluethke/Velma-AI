# Output Synthesizer

**One-line description:** Process chain_definition_json, execution_plan, missing_skills_list to produce final_chain_definition, final_coverage_report, final_execution_plan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chain_definition_json` (string, required): Input for chain definition json.
- `execution_plan` (string, required): Input for execution plan.
- `missing_skills_list` (string, required): Input for missing skills list.
- `validation_report` (string, required): Input for validation report.

---

## Outputs

- `final_chain_definition` (object): Final Chain Definition.
- `final_coverage_report` (object): Final Coverage Report.
- `final_execution_plan` (object): Final Execution Plan.
- `final_missing_skills` (object): Final Missing Skills.

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

Return the structured result containing `final_chain_definition`, `final_coverage_report`, `final_execution_plan`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
