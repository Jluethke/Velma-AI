# Pick Strategy Configurator

Configure pick strategies for order fulfillment.

## Inputs

- `location-schema`: Location naming convention and hierarchy
- `product-catalog`: Full list of products with storage requirements

## Outputs

- `pick-strategy-config`: Pick strategy configuration (wave, batch, zone, discrete)
- `pick-performance-targets`: Target pick rates and accuracy by strategy

## Process

1. Select the pick strategy based on order profile (wave, batch, zone, discrete)
2. Configure pick list generation rules in the WMS
3. Set pick performance targets (lines per hour, accuracy rate)
4. Document fallback procedures when the primary strategy is interrupted

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
