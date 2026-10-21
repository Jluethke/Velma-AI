# Plan Assembler

**One-line description:** Process checkpoint_template, clarified_goal, dependency_graph to produce action_plan_document.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `checkpoint_template` (string, required): Input for checkpoint template.
- `clarified_goal` (string, required): Input for clarified goal.
- `dependency_graph` (string, required): Input for dependency graph.
- `key_result_areas` (string, required): Input for key result areas.
- `milestones` (string, required): Input for milestones.
- `resource_plan` (string, required): Input for resource plan.
- `risk_register` (string, required): Input for risk register.
- `weekly_tasks` (string, required): Input for weekly tasks.

---

## Outputs

- `action_plan_document` (object): Action Plan Document.

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

Return the structured result containing `action_plan_document`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
