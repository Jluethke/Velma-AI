# True False Positive Determiner

Determine whether the alert is a true positive, false positive, or requires further investigation.

## Inputs

- `enriched-alert`: Alert with full context from asset, user, and threat intel lookups
- `related-alerts`: Correlated alerts from the same timeframe or assets

## Outputs

- `tp-fp-determination`: Classification as true positive, false positive, or needs investigation
- `determination-evidence`: Evidence supporting the true/false positive classification

## Process

1. Compare the alert indicators against known benign activity baselines for the asset
2. Check if the activity matches a known attack pattern or technique
3. Evaluate whether the context (user behavior, time of day, business process) explains the activity
4. Classify as true positive, false positive, or indeterminate requiring deeper investigation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
