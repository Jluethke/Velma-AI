# Channel Investment Optimizer

Optimize channel investment based on quality-adjusted cost. Shift spend from low-LTV channels to high-LTV channels.

## Inputs

- `channel-quality-metrics`: The quality data by channel
- `channel-ltv-estimate`: The LTV estimates by channel

## Outputs

- `channel-investment-plan`: For each channel: increase, maintain, decrease, or stop, with the reallocation amounts and the expected impact on overall acquisition quality
- `channel-monitoring-dashboard`: The metrics to track monthly: CPA, activation rate, retention, LTV:CPA ratio by channel

## Process

1. Increase investment in channels with the highest LTV:CPA ratio, up to the point of diminishing returns (the CPA starts rising as you exhaust the audience).
2. Decrease investment in channels with low LTV:CPA ratio. If the ratio is below 1 (you spend more to acquire than the customer generates), the channel destroys value.
3. Test new channels with a small budget. Measure the LTV:CPA ratio before scaling.
4. Monitor monthly: as you increase spend on a channel, does the LTV:CPA ratio hold or decline? Declining ratio means you are reaching diminishing returns for that channel.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
