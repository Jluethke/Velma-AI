# Expense Analyzer

**One-line description:** Process expenses to produce expense_summary, monthly_surplus_deficit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `expenses` (string, required): Input for expenses.

---

## Outputs

- `expense_summary` (object): Expense Summary.
- `monthly_surplus_deficit` (object): Monthly Surplus Deficit.

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

Return the structured result containing `expense_summary`, `monthly_surplus_deficit`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
