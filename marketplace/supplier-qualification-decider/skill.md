# Supplier Qualification Decider

Make the qualification decision and onboard the supplier.

## Inputs

- `sample-evaluation`: Sample part test results
- `audit-findings`: Audit findings
- `evaluation-scorecard`: Scorecard template

## Outputs

- `qualification-decision`: Approved, conditionally approved, or rejected
- `supplier-qualification-report`: Complete qualification report with all evidence

## Process

1. Score the supplier on the evaluation scorecard across all criteria
2. Review audit nonconformances and corrective action adequacy
3. Make the qualification decision (approved, conditional, rejected)
4. Set up the supplier in the approved supplier list with any conditions or monitoring requirements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
