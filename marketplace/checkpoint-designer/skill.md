# Checkpoint Designer

**One-line description:** Process key_result_areas, milestones, weekly_tasks to produce checkpoint_template.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `key_result_areas` (string, required): Input for key result areas.
- `milestones` (string, required): Input for milestones.
- `weekly_tasks` (string, required): Input for weekly tasks.

---

## Outputs

- `checkpoint_template` (object): Checkpoint Template.

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

Return the structured result containing `checkpoint_template`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
