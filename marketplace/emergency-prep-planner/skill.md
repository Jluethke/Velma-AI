# Emergency Prep Planner

**One-line description:** Process existing_insurance_info, home_description, include_pet_supplies to produce processed output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `existing_insurance_info` (string, optional): Input for existing insurance info.
- `home_description` (string, required): Input for home description.
- `include_pet_supplies` (string, optional): Input for include pet supplies.
- `local_hazards` (string, optional): Input for local hazards.

---

## Outputs

- `result` (object): Processed result.

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

Return the structured result containing `result`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
