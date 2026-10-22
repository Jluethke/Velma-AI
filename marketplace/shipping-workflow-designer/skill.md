# Shipping Workflow Designer

Set up shipping station workflows.

## Inputs

- `pick-strategy-config`: Pick strategy configuration
- `receiving-procedures`: Step-by-step receiving and inspection procedures

## Outputs

- `shipping-procedures`: Shipping station workflow from pack to ship
- `wms-setup-document`: Complete WMS setup documentation

## Process

1. Define the pack station workflow (verify, pack, label, weigh)
2. Configure carrier integration for label generation
3. Set up manifest and end-of-day close procedures
4. Produce the complete WMS setup documentation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
