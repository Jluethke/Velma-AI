# Pcrm Cadence Rule Setter

Set a target contact cadence for each tier (inner 5 weekly, close 15 biweekly, regular 50 monthly, acquaintance 150 quarterly) and then pressure-test whether the total contact load those cadences imply is actually achievable in the time you have.

## Inputs

- `context-field-schema`: The per-contact fields including last contact date
- `field-fill-priority`: Which fields matter most per tier

## Outputs

- `tier-cadence-rules`: The target days between contacts for each tier, with any per-tier adjustments
- `cadence-load-estimate`: The number of touchpoints per week the cadences imply, checked against available time

## Process

1. Set the starting cadences: inner 5 weekly (7 days), close 15 biweekly (14 days), regular 50 monthly (30 days), acquaintance 150 quarterly (90 days). These are the defaults you will adjust.
2. Compute the implied weekly load. At full tier sizes this is roughly 5 weekly, 7.5 biweekly, 11.7 monthly, and 12.5 quarterly touchpoints, which lands near 36 contacts per week. Compare that to the time you actually have for relationship upkeep.
3. If the load exceeds your time, do not just miss cadences silently. Either lengthen the outer-tier cadences (acquaintances every 180 days instead of 90) or shrink the tiers. A cadence you cannot meet trains you to ignore the system.
4. Allow per-contact overrides for known rhythms. A friend you see every holiday does not need a monthly nudge, and a mentor you want to stay close to may warrant a tighter cadence than their tier default.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
