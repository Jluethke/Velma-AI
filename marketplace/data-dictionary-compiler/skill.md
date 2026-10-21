# Data Dictionary Compiler

**One-line description:** Process business_descriptions, column_metadata, data_quality_notes to produce data_dictionary, output_file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `business_descriptions` (string, required): Input for business descriptions.
- `column_metadata` (string, required): Input for column metadata.
- `data_quality_notes` (string, required): Input for data quality notes.
- `output_format` (string, required): Input for output format.
- `pii_flags` (string, required): Input for pii flags.
- `relationships_array` (string, required): Input for relationships array.
- `sample_values` (string, required): Input for sample values.
- `valid_values` (string, required): Input for valid values.

---

## Outputs

- `data_dictionary` (object): Data Dictionary.
- `output_file` (object): Output File.

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

Return the structured result containing `data_dictionary`, `output_file`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
