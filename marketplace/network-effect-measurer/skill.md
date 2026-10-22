# Network Effect Measurer

Measure the network effect: as the user base grows, does engagement, retention, or value per user increase?

## Inputs

- `density-strategy`: The density approach being executed
- `network-effect-type`: The effect type for measurement design

## Outputs

- `network-effect-metrics`: Metrics that track the network effect: engagement per user vs. total users, retention vs. network size, value per transaction vs. supply count
- `effect-curve`: The curve showing how user value changes with network size: linear (no effect), convex (strong effect), or concave (diminishing effect)

## Process

1. Track the proxy metric for the network effect type. For direct: interactions per user as user count grows. For indirect: matches per participant as supply and demand grow. For data: prediction accuracy or recommendation relevance as data volume grows.
2. Plot the curve: does the metric increase as the network grows? If yes, the network effect is working. If it flatlines, the effect may be weak or the product may not facilitate the connection between users well enough.
3. Compare across markets: is the network effect stronger in your dense market vs. sparse markets? This validates the density strategy.
4. Watch for negative network effects: if the product becomes worse as it grows (spam, noise, congestion), you have a scaling problem that will cap growth.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
