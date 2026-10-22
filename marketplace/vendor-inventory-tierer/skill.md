# Vendor Inventory Tierer

Maintain the vendor inventory with risk tiers.

## Inputs

- `vendor-list`: List of current vendors
- `risk-criteria`: Criteria for vendor risk tiering

## Outputs

- `tiered-vendor-inventory`: Vendor inventory with risk tiers (critical, high, medium, low)
- `reassessment-schedule`: Schedule for periodic reassessments by tier

## Process

1. Inventory all active vendors with their services and data access.
2. Assign each vendor to a risk tier based on criticality and data sensitivity.
3. Set the reassessment frequency by tier (critical: annual, high: biannual, medium/low: triennial).
4. Update the inventory with current contract and contact information.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
