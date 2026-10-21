# Ewi Designer

**One-line description:** Process mitigated_risks, ranked_risks to produce monitoring_plan, risks_with_ewis.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `mitigated_risks` (string, required): Input for mitigated risks.
- `ranked_risks` (string, required): Input for ranked risks.

---

## Outputs

- `monitoring_plan` (object): Monitoring Plan.
- `risks_with_ewis` (object): Risks With Ewis.

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

Return the structured result containing `monitoring_plan`, `risks_with_ewis`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
