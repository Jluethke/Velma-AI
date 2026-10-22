# Tax Item Categorizer

Organize tax documents by category: income, deductions, credits, and carryforwards.

## Inputs

- `document-inventory`: All collected tax documents
- `taxpayer-info`: Taxpayer filing status and dependents

## Outputs

- `categorized-items`: Tax items organized by schedule and form
- `deduction-summary`: Summary of itemized vs standard deduction comparison

## Process

1. Classify each document by income type (wages, interest, dividends, business, capital gains).
2. Organize deductions by category and compare itemized total to standard deduction.
3. Identify applicable credits (child tax credit, education, energy).
4. Note any carryforward items from prior years (capital losses, NOLs).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
