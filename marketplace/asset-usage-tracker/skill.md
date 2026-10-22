# Asset Usage Tracker

Track asset usage, warranty, and maintenance needs.

## Inputs

- `asset-record`: CMDB record for the asset
- `deployment-record`: Deployment details

## Outputs

- `usage-report`: Asset utilization and health data
- `refresh-recommendation`: Whether the asset should be refreshed or retired

## Process

1. Monitor utilization metrics (CPU, disk, age, repair history).
2. Track warranty status and upcoming expirations.
3. Flag assets that exceed the refresh threshold.
4. Produce the usage report with refresh recommendations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
