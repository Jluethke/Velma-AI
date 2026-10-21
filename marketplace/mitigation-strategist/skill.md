# Mitigation Strategist

**One-line description:** Process ranked_risks, risk_appetite, scope_summary to produce contingency_plans, mitigated_risks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ranked_risks` (string, required): Input for ranked risks.
- `risk_appetite` (string, optional): Input for risk appetite.
- `scope_summary` (string, required): Input for scope summary.

---

## Outputs

- `contingency_plans` (object): Contingency Plans.
- `mitigated_risks` (object): Mitigated Risks.

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

Return the structured result containing `contingency_plans`, `mitigated_risks`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
