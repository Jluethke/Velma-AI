# Storage Zone Designer

Define storage zones for receiving, picking, packing, and shipping.

## Inputs

- `abc-classification`: Products classified into A, B, and C velocity tiers
- `movement-patterns`: Frequency and volume patterns for each SKU

## Outputs

- `zone-definitions`: Named zones with product assignments and capacity
- `zone-adjacency-map`: Map of zone relationships and flow direction

## Process

1. Define zones for receiving, bulk storage, forward pick, packing, and shipping
2. Assign products to zones based on velocity tier
3. Size each zone for current and projected inventory
4. Map zone adjacencies to minimize travel distance

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
