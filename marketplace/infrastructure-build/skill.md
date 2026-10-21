# Infrastructure Build

Build the challenge infrastructure: servers, containers, and network segments.

## Inputs

- `challenge-specs`: Challenge specifications to implement

## Outputs

- `challenge-environments`: Running challenge instances
- `infra-config`: Infrastructure configuration and deployment files

## Process

1. Build each challenge environment in isolated containers or VMs
2. Configure networking to isolate challenges from each other
3. Deploy and verify each challenge is accessible and functional

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
