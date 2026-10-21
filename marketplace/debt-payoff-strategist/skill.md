# Debt Payoff Strategist

**One-line description:** Process debt_list, debt_payoff_method, emergency_fund_monthly_contribution to produce debt_payoff_plan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `debt_list` (string, required): Input for debt list.
- `debt_payoff_method` (string, required): Input for debt payoff method.
- `emergency_fund_monthly_contribution` (string, required): Input for emergency fund monthly contribution.
- `monthly_surplus_deficit` (string, required): Input for monthly surplus deficit.

---

## Outputs

- `debt_payoff_plan` (object): Debt Payoff Plan.

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

Return the structured result containing `debt_payoff_plan`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
