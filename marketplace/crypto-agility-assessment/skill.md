# Crypto Agility Assessment

Assess the ability to migrate cryptographic algorithms in response to new threats or standards changes.

## Inputs

- `crypto-inventory`: Full cryptographic inventory
- `implementation-flaws`: Implementation flaw findings

## Outputs

- `agility-assessment`: Assessment of how easily algorithms can be swapped or upgraded
- `migration-risk-map`: Map of hardcoded algorithm choices vs configurable ones

## Process

1. Identify hardcoded algorithm choices vs runtime-configurable selections
2. Assess data at rest for re-encryption feasibility (volume, format, access patterns)
3. Check protocol negotiation support for algorithm upgrades
4. Evaluate post-quantum readiness for asymmetric cryptography

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
