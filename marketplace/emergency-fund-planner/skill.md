# Emergency Fund Planner

**One-line description:** Process current_emergency_fund_balance, emergency_fund_target, monthly_surplus_deficit to produce emergency_fund_plan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `current_emergency_fund_balance` (string, required): Input for current emergency fund balance.
- `emergency_fund_target` (string, required): Input for emergency fund target.
- `monthly_surplus_deficit` (string, required): Input for monthly surplus deficit.
- `total_monthly_expenses` (string, required): Input for total monthly expenses.

---

## Outputs

- `emergency_fund_plan` (object): Emergency Fund Plan.

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

Return the structured result containing `emergency_fund_plan`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
