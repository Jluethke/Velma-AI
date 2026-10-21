# Risk Prioritizer

**One-line description:** Process assessed_risks, risk_appetite, risk_assessment_scale to produce priority_summary, ranked_risks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `assessed_risks` (string, required): Input for assessed risks.
- `risk_appetite` (string, optional): Input for risk appetite.
- `risk_assessment_scale` (string, optional): Input for risk assessment scale.

---

## Outputs

- `priority_summary` (object): Priority Summary.
- `ranked_risks` (object): Ranked Risks.

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

Return the structured result containing `priority_summary`, `ranked_risks`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
