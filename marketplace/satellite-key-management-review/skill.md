# Satellite Key Management Review

Review key management for link encryption covering generation, distribution, storage, and rotation.

## Inputs

- `command-injection-findings`: Authentication mechanisms using crypto keys
- `telemetry-encryption-findings`: Encryption implementations to review
- `station-specifications`: Key management infrastructure details

## Outputs

- `key-management-findings`: Key management weaknesses and recommendations
- `ground-station-report`: Final ground station security report

## Process

1. Review key generation procedures and entropy sources
2. Assess key distribution security for uplink and downlink encryption
3. Check key storage protections (HSMs, access controls, zeroization)
4. Compile all findings into the ground station security report with severity ratings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
