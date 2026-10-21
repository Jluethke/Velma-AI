# Improvement Integrator

**One-line description:** Process enhanced_inputs, enhanced_outputs, error_handling to produce integrated_skill_definition.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `enhanced_inputs` (string, required): Input for enhanced inputs.
- `enhanced_outputs` (string, required): Input for enhanced outputs.
- `error_handling` (string, required): Input for error handling.
- `measurable_gates` (string, required): Input for measurable gates.
- `original_skill` (string, required): Input for original skill.
- `refactored_phases` (string, required): Input for refactored phases.

---

## Outputs

- `integrated_skill_definition` (object): Integrated Skill Definition.

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

Return the structured result containing `integrated_skill_definition`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
