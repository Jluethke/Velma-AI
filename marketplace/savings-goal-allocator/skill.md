# Savings Goal Allocator

**One-line description:** Process emergency_fund_monthly_contribution, financial_goals, monthly_surplus_deficit to produce savings_allocation_plan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `emergency_fund_monthly_contribution` (string, required): Input for emergency fund monthly contribution.
- `financial_goals` (string, required): Input for financial goals.
- `monthly_surplus_deficit` (string, required): Input for monthly surplus deficit.
- `total_debt_payments` (string, required): Input for total debt payments.

---

## Outputs

- `savings_allocation_plan` (object): Savings Allocation Plan.

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

Return the structured result containing `savings_allocation_plan`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
