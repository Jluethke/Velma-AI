# Failure Impact Estimator

For each single dependency, estimate the impact and time-to-impact if it fails.

## Inputs

- `single-dependency-list`: The list of single dependencies
- `critical-function-list`: The critical functions and their tolerable downtimes

## Outputs

- `failure-impact-table`: For each single dependency: the affected function, the time from failure to function stoppage, and the estimated recovery time without a workaround
- `most-fragile-dependencies`: The top 5 single dependencies ranked by (shortest time to impact) times (longest recovery time)

## Process

1. For each single dependency, define the failure scenario: the dependency is suddenly unavailable (person quits, system crashes, vendor goes offline, resource is destroyed).
2. Estimate the time from failure to function stoppage. Some failures are instant (server goes down). Others are delayed (key person gives 2 weeks notice but knowledge walks out the door).
3. Estimate the recovery time without a workaround: how long to replace the dependency from scratch? Hiring takes months. System migration takes weeks. Vendor qualification takes months.
4. Rank by fragility: (time to impact) divided by (recovery time). The most fragile dependencies are those where the impact is fast and the recovery is slow.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
