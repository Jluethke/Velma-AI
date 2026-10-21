# Risk Brainstormer

**One-line description:** Process historical_data, project_type, scope_summary to produce risk_count_by_category, risk_list.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `historical_data` (string, optional): Input for historical data.
- `project_type` (string, required): Input for project type.
- `scope_summary` (string, required): Input for scope summary.
- `stakeholder_input` (string, optional): Input for stakeholder input.

---

## Outputs

- `risk_count_by_category` (object): Risk Count By Category.
- `risk_list` (object): Risk List.

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

Return the structured result containing `risk_count_by_category`, `risk_list`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
