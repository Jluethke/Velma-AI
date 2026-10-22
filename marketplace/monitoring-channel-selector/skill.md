# Monitoring Channel Selector

Select and configure the channels to monitor.

## Inputs

- `keyword-list`: The organized keyword list
- `brand-name`: The brand being monitored

## Outputs

- `channel-configuration`: List of channels to monitor with access and configuration details
- `alert-rules`: Alert triggers for volume spikes or sentiment shifts

## Process

1. Identify which channels matter for this brand (Twitter/X, Reddit, forums, review sites, news, LinkedIn).
2. Configure monitoring on each selected channel.
3. Set alert thresholds for mention volume spikes (e.g., 3x normal daily volume).
4. Set sentiment shift alerts (e.g., negative mentions exceed 30% of total).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
