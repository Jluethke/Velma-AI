# Detection Gap Identifier

Analyze missed and partially detected techniques to identify the root cause of each gap.

## Inputs

- `detection-scorecard`: Scorecard of detection outcomes per technique
- `execution-log`: Detailed execution log

## Outputs

- `gap-analysis`: Root cause analysis for each detection gap
- `missing-data-sources`: Data sources needed but not currently ingested

## Process

1. For each missed technique, determine whether the gap is missing data source, missing rule, or rule misconfiguration
2. For partial detections, determine why the alert was not investigated (noise, low priority, unclear)
3. Catalog all missing data sources that would close gaps
4. Rank gaps by risk, considering the technique's position in the kill chain

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
