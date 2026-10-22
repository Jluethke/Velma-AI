# Pipeline Health Reviewer

Review pipeline health and produce the weekly pipeline report.

## Inputs

- `velocity-metrics`: Stage timing and conversion data
- `weighted-forecast`: Revenue forecast
- `stuck-deals`: Deals flagged as stalled

## Outputs

- `pipeline-report`: Weekly pipeline health summary
- `action-items`: Specific actions to move stuck deals or fill gaps

## Process

1. Compare this week's pipeline to last week's.
2. Identify new deals, lost deals, and stage changes.
3. List the top three risks to the forecast.
4. Write action items for each stuck deal and coverage gap.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
