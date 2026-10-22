# Channel Inventory Baseline

Inventory every active growth channel and establish the baseline cost per acquisition and volume for each.

## Inputs

- `channel-list`: All active marketing and growth channels (paid ads, organic search, social, referral, email, content, partnerships, events, outbound)
- `spend-and-results-data`: Monthly spend and acquisition counts per channel for at least the last 6 months

## Outputs

- `channel-baseline-report`: For each channel: monthly CPA, monthly volume, CPA trend direction, and volume trend direction
- `channel-health-scores`: Each channel scored as growing, stable, or declining based on the CPA and volume trends

## Process

1. For each channel, calculate the monthly CPA (total spend divided by acquisitions) for each of the last 6 months.
2. Plot the CPA trend: rising, flat, or falling. Plot the volume trend: rising, flat, or falling.
3. Score each channel: falling CPA plus rising volume is healthy. Rising CPA plus flat volume is saturating. Rising CPA plus falling volume is dying.
4. Flag any channel where CPA rose for 3 or more consecutive months. This is the early warning signal.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
