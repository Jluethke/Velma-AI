# Resource Allocator

**One-line description:** Process available_resources, dependency_graph, weekly_tasks to produce resource_plan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `available_resources` (string, optional): Input for available resources.
- `dependency_graph` (string, required): Input for dependency graph.
- `weekly_tasks` (string, required): Input for weekly tasks.

---

## Outputs

- `resource_plan` (object): Resource Plan.

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

Return the structured result containing `resource_plan`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
