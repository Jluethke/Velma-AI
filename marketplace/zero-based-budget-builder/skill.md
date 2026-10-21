# Zero Based Budget Builder

**One-line description:** Process debt_payoff_plan, emergency_fund_plan, expense_summary to produce zero_based_budget.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `debt_payoff_plan` (string, required): Input for debt payoff plan.
- `emergency_fund_plan` (string, required): Input for emergency fund plan.
- `expense_summary` (string, required): Input for expense summary.
- `monthly_net_income` (string, required): Input for monthly net income.
- `savings_allocation_plan` (string, required): Input for savings allocation plan.

---

## Outputs

- `zero_based_budget` (object): Zero Based Budget.

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

Return the structured result containing `zero_based_budget`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
