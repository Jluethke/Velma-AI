# Chain Designer

**One-line description:** Process available_skills, goal to produce data_type_inventory, requirements_list, skill_capability_map.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `available_skills` (string, required): Input for available skills.
- `goal` (string, required): Input for goal.

---

## Outputs

- `data_type_inventory` (object): Data Type Inventory.
- `requirements_list` (object): Requirements List.
- `skill_capability_map` (object): Skill Capability Map.

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

Return the structured result containing `data_type_inventory`, `requirements_list`, `skill_capability_map`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
