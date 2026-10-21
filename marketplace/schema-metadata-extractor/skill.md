# Schema Metadata Extractor

**One-line description:** Process raw_schema_metadata, schema_filter, table_filter to produce column_metadata, constraint_mappings.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `raw_schema_metadata` (string, required): Input for raw schema metadata.
- `schema_filter` (string, required): Input for schema filter.
- `table_filter` (string, required): Input for table filter.

---

## Outputs

- `column_metadata` (object): Column Metadata.
- `constraint_mappings` (object): Constraint Mappings.

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

Return the structured result containing `column_metadata`, `constraint_mappings`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
