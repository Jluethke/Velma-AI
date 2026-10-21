# Business Context Enricher

**One-line description:** Process business_context_source, column_metadata to produce business_descriptions, missing_descriptions, valid_values.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `business_context_source` (string, required): Input for business context source.
- `column_metadata` (string, required): Input for column metadata.

---

## Outputs

- `business_descriptions` (object): Business Descriptions.
- `missing_descriptions` (object): Missing Descriptions.
- `valid_values` (object): Valid Values.

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

Return the structured result containing `business_descriptions`, `missing_descriptions`, `valid_values`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
