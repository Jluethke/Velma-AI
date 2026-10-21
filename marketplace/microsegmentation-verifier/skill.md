# Microsegmentation Verifier

Verify microsegmentation between workloads and services.

## Inputs

- `access-flow-map`: All access flows
- `architecture-documentation`: Architecture and segmentation design

## Outputs

- `microsegmentation-findings`: Workloads that can communicate when they should not
- `segmentation-coverage-map`: Map of enforced vs unenforced segment boundaries

## Process

1. Test connectivity between workloads that should be isolated
2. Verify that microsegmentation policies match the intended design
3. Check for flat network segments where all workloads can reach all others
4. Test whether segmentation is enforced at the application layer, not just the network layer

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
