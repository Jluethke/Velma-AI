# Risk Information Gatherer

Gather and organize the risk information needed for underwriting evaluation.

## Inputs

- `submission-summary`: Structured summary of the applicant and coverage request
- `missing-information-list`: Outstanding items to collect

## Outputs

- `risk-profile`: Complete risk profile including loss history, exposures, and controls
- `third-party-reports`: External reports collected (credit, MVR, inspection, industry benchmarks)

## Process

1. Request and collect any missing items from the broker.
2. Pull loss history for the prior 5 years and calculate loss ratios.
3. Order third-party reports as required by the line of business.
4. Compile the risk profile with exposures, controls, and loss trends.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
