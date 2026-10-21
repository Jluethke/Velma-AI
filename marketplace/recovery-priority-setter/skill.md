# Recovery Priority Setter

Define recovery priorities, RTO, and RPO for each critical process.

## Inputs

- `impact-analysis`: BIA results with criticality rankings
- `dependency-map`: Process dependencies

## Outputs

- `recovery-objectives`: RTO and RPO for each critical process
- `recovery-priority-list`: Ordered list of what to recover first

## Process

1. Set RTO for each critical process based on maximum tolerable downtime
2. Set RPO for each data-dependent process based on acceptable data loss
3. Order recovery priority based on impact and dependency chains
4. Validate objectives are achievable with current infrastructure

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
