# Channel Cost Calculator

Calculate the true cost per acquisition for each channel, including all costs (not just ad spend).

## Inputs

- `acquisition-channels`: All channels used to acquire users or customers (paid ads, organic search, referral, social, content, events, partnerships)
- `channel-spend`: The total spend per channel including ad costs, content creation, tooling, and time

## Outputs

- `cost-per-acquisition-by-channel`: The fully loaded cost to acquire one user or customer through each channel
- `channel-volume`: The number of acquisitions through each channel per period

## Process

1. For each channel, sum ALL costs: ad spend, content creation time (valued at hourly rate), tool costs, agency fees, event costs, and staff time spent managing the channel.
2. Divide by the number of acquisitions attributed to the channel. This is the fully loaded cost per acquisition.
3. Do not use the channel's self-reported numbers (ad platform attribution). Use your own tracking. Ad platforms over-attribute because they take credit for conversions that would have happened anyway.
4. Rank channels by cost per acquisition. But do not stop here: the cheapest channel may produce the lowest-value customers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
