# Test Code Generator

**One-line description:** Process output_format, performance_sla_ms, test_execution_plan to produce test_code, test_files.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `output_format` (string, required): Input for output format.
- `performance_sla_ms` (string, required): Input for performance sla ms.
- `test_execution_plan` (string, required): Input for test execution plan.
- `test_framework` (string, required): Input for test framework.
- `test_suite` (string, required): Input for test suite.

---

## Outputs

- `test_code` (object): Test Code.
- `test_files` (object): Test Files.

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

Return the structured result containing `test_code`, `test_files`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
