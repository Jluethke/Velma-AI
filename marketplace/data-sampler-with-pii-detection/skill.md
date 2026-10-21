# Data Sampler With Pii Detection

**One-line description:** Process column_metadata, connection_status, sampling_config to produce data_quality_notes, pii_flags, sample_values.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `column_metadata` (string, required): Input for column metadata.
- `connection_status` (string, required): Input for connection status.
- `sampling_config` (string, required): Input for sampling config.

---

## Outputs

- `data_quality_notes` (object): Data Quality Notes.
- `pii_flags` (object): Pii Flags.
- `sample_values` (object): Sample Values.

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

Return the structured result containing `data_quality_notes`, `pii_flags`, `sample_values`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
