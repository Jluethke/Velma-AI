# Container Pivot Test

Attempt container-to-host and container-to-container network pivoting.

## Inputs

- `target-container`: Container under test
- `runtime-profile`: Network configuration details

## Outputs

- `pivot-findings`: Network paths from container to host or other containers
- `reachable-services`: Services reachable from within the container

## Process

1. Scan for reachable services from within the container network namespace
2. Test access to the host network stack and cloud metadata services
3. Attempt to reach other containers or pods that should be segmented

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
