# Load Performance Test Generator

**One-line description:** Process dependency_graph, endpoint_registry, include_load_tests to produce load_test_scenarios, performance_assertions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dependency_graph` (string, required): Input for dependency graph.
- `endpoint_registry` (string, required): Input for endpoint registry.
- `include_load_tests` (string, required): Input for include load tests.
- `performance_sla_ms` (string, required): Input for performance sla ms.

---

## Outputs

- `load_test_scenarios` (object): Load Test Scenarios.
- `performance_assertions` (object): Performance Assertions.

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

Return the structured result containing `load_test_scenarios`, `performance_assertions`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
