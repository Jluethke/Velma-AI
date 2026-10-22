# Channel Quality Analyzer

Measure the quality of users from each channel: do they activate, retain, and generate revenue, or do they sign up and leave?

## Inputs

- `cost-per-acquisition-by-channel`: The cost data by channel
- `acquisition-channels`: The channels to analyze

## Outputs

- `channel-quality-metrics`: For each channel: activation rate, 30-day retention, 90-day retention, and average revenue per user
- `channel-ltv-estimate`: The estimated lifetime value of users from each channel

## Process

1. For users from each channel, calculate: what percentage activated (reached the activation milestone)? What percentage retained at 30 and 90 days? What is the average revenue per user?
2. Estimate the lifetime value (LTV) for each channel's users: retained revenue over the expected lifetime.
3. Compare the LTV to the cost per acquisition. A channel with $50 CPA and $500 LTV is more valuable than a channel with $10 CPA and $30 LTV.
4. Rank channels by LTV:CPA ratio. This is the true measure of channel quality, not the volume or the cost alone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
