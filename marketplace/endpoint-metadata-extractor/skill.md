# Endpoint Metadata Extractor

**One-line description:** Process include_dependencies, validated_spec to produce auth_matrix, dependency_graph, endpoint_registry.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `include_dependencies` (string, required): Input for include dependencies.
- `validated_spec` (string, required): Input for validated spec.

---

## Outputs

- `auth_matrix` (object): Auth Matrix.
- `dependency_graph` (object): Dependency Graph.
- `endpoint_registry` (object): Endpoint Registry.
- `parameter_matrix` (object): Parameter Matrix.

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

Return the structured result containing `auth_matrix`, `dependency_graph`, `endpoint_registry`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
