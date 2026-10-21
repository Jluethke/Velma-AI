# Voice Analyzer

**One-line description:** Process focus_areas, sample_context, target_audience to produce analysis_report, metadata, style_guide.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `focus_areas` (string, required): Input for focus areas.
- `sample_context` (string, required): Input for sample context.
- `target_audience` (string, required): Input for target audience.
- `writing_sample` (string, required): Input for writing sample.

---

## Outputs

- `analysis_report` (object): Analysis Report.
- `metadata` (object): Metadata.
- `style_guide` (object): Style Guide.
- `validation_report` (object): Validation Report.

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

Return the structured result containing `analysis_report`, `metadata`, `style_guide`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
