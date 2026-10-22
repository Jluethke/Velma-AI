# Engagement Velocity Calculator

Calculate the engagement velocity for each contact: how quickly and consistently they respond and initiate, which determines the natural rhythm of the relationship.

## Inputs

- `contact-interaction-history`: Timestamped log of all interactions (sent and received) for the contacts to analyze
- `time-window`: The lookback period for velocity calculation (default 180 days)

## Outputs

- `velocity-scores`: Per-contact velocity score combining response speed, response rate, and initiation ratio
- `velocity-segments`: Contacts grouped into velocity tiers: high (responds fast, initiates often), medium (responds reliably, rarely initiates), low (slow or inconsistent responses), dormant (no response in window)

## Process

1. Calculate three metrics per contact. Response speed: median time from your message to their reply (ignore outliers beyond 7 days). Response rate: percentage of your messages that received any reply. Initiation ratio: their initiated contacts divided by total contacts (0.5 means they reach out as often as you do, 0.0 means you always initiate).
2. Combine into a velocity score. Weight response rate highest (a contact who always replies but slowly is better than one who sometimes replies instantly). A reasonable weighting: 50% response rate, 30% initiation ratio, 20% response speed.
3. Segment contacts into tiers using natural breaks in the distribution, not arbitrary cutoffs. If your contacts cluster at 0.8 and 0.3 with a gap at 0.5, the break is at 0.5. Do not force four even quartiles.
4. Flag anomalies: contacts whose velocity changed significantly in the last 30 days (a previously high-velocity contact going silent, or a dormant contact suddenly re-engaging). These are transition signals for the lifecycle system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
