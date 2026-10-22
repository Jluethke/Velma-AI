# Instance Rightsizer

Right-size compute instances and storage by matching resource allocation to actual usage.

## Inputs

- `waste-inventory`: Underutilized resources
- `utilization-metrics`: Detailed utilization data

## Outputs

- `rightsizing-recommendations`: Instance type changes recommended
- `rightsizing-savings`: Estimated savings from right-sizing

## Process

1. Analyze CPU, memory, and network utilization for each instance
2. Recommend smaller instance types that still meet peak demand with headroom
3. Identify storage volumes that can be downgraded (SSD to HDD, provisioned to standard)
4. Calculate the savings from each recommendation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
