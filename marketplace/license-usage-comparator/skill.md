# License Usage Comparator

Compare actual usage against license entitlements.

## Inputs

- `license-catalog`: License catalog
- `usage-metrics`: Usage metrics

## Outputs

- `compliance-status`: Compliance status for each product (compliant, over, under)
- `variance-report`: Variance between entitlements and actual usage

## Process

1. Compare deployed seats or instances against licensed quantities
2. Check usage against geographic and entity restrictions
3. Identify over-deployed and under-utilized licenses

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
