# Database Connection Validator

**One-line description:** Process connection_type, database_name, host to produce connection_status, schema_metadata.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `connection_type` (string, required): Input for connection type.
- `database_name` (string, required): Input for database name.
- `host` (string, required): Input for host.
- `password` (string, required): Input for password.
- `port` (string, required): Input for port.
- `username` (string, required): Input for username.

---

## Outputs

- `connection_status` (object): Connection Status.
- `schema_metadata` (object): Schema Metadata.

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

Return the structured result containing `connection_status`, `schema_metadata`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
