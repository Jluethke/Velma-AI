# Cooldown And Dedup Setup

Set cool-down periods and deduplication rules to prevent alert storms.

## Inputs

- `threshold-rules`: Threshold rules for each metric
- `alert-channels`: Channel assignments

## Outputs

- `cooldown-config`: Cool-down period and deduplication rules for each alert
- `grouping-rules`: Rules for grouping related alerts into a single notification

## Process

1. Set a cool-down period for each alert (e.g., do not re-fire for 30 minutes after the last fire).
2. Configure deduplication so identical alerts within the cool-down window are suppressed.
3. Define grouping rules for related metrics (e.g., if both error rate and latency breach, send one grouped alert).
4. Document the rationale for each cool-down setting.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
