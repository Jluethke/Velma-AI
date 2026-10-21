# C2 Traffic Identifier

Identify command and control communication patterns in the network traffic.

## Inputs

- `reconstructed-sessions`: Rebuilt sessions for pattern analysis
- `capture-statistics`: Overall traffic statistics for baseline comparison

## Outputs

- `c2-candidates`: Sessions identified as potential C2 communication
- `beacon-analysis`: Analysis of periodic beaconing patterns

## Process

1. Detect periodic beaconing by analyzing inter-arrival times
2. Identify sessions with encoded or encrypted payloads to non-standard ports
3. Check for DNS tunneling patterns (high query rates, long subdomain labels)
4. Compare against known C2 framework traffic signatures

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
