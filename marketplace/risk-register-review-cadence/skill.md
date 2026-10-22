# Risk Register Review Cadence

Set the review cadence and produce the final risk register document. A risk register that is not reviewed decays into fiction.

## Inputs

- `mitigation-plans`: The mitigation plans for all managed risks
- `residual-risk-assessment`: The residual risk scores after mitigation

## Outputs

- `risk-register-document`: The complete risk register: every risk with its specific statement, probability, impact, score, tier, owner, mitigation plan, residual score, and review date
- `review-schedule`: The monthly review checklist: which risks to re-assess, what data to collect, and the escalation path for score changes

## Process

1. Compile the register in a single document or spreadsheet. Each row: risk ID, specific statement, probability, impact, score, tier, owner, mitigation plan summary, residual score, next review date.
2. Set the review cadence: critical risks monthly, high risks quarterly, medium risks semi-annually, low risks annually.
3. At each review: re-rate probability and impact using the latest evidence. If a score moves up a tier, trigger the mitigation plan. If a score drops, consider reducing the mitigation spend.
4. Add new risks discovered since the last review. Remove risks that are no longer relevant (the project ended, the dependency was eliminated, the market shifted).
5. The register is a living document. If the last review date is more than one cycle overdue, the register is not being used.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
