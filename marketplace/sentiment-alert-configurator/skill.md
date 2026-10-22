# Sentiment Alert Configurator

Set up alerts for significant sentiment shifts.

## Inputs

- `sentiment-dashboard`: The active sentiment dashboard
- `sentiment-scores`: Historical scored data for baseline

## Outputs

- `sentiment-alerts`: Configured alerts for sentiment shifts (threshold, notification channel, recipient)
- `sentiment-tracking-setup-document`: Complete setup document with sources, analysis, dashboard, and alerts

## Process

1. Define the alert conditions: sudden drop in positive ratio, spike in negative volume, new negative theme.
2. Set the thresholds based on historical baseline (percentage change, absolute count, z-score).
3. Configure the notification channel and recipients for each alert type.
4. Produce the setup document covering sources, analysis method, dashboard design, alert rules, and maintenance plan.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
