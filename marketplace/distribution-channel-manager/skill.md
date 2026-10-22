# Distribution Channel Manager

Manage room inventory across distribution channels (OTA, direct, GDS, wholesale).

## Inputs

- `pricing-rules`: Dynamic pricing rules
- `channel-list`: Active distribution channels and their terms

## Outputs

- `channel-allocation`: Room allocation per channel per date
- `rate-parity-check`: Rate consistency across channels

## Process

1. Allocate rooms to each channel based on margin and volume.
2. Push rates to all channels maintaining parity.
3. Monitor channel production against allocation.
4. Adjust allocations based on booking pace.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
