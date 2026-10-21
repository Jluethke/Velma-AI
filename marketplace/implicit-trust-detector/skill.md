# Implicit Trust Detector

Detect implicit trust assumptions in the architecture.

## Inputs

- `microsegmentation-findings`: Microsegmentation gaps
- `identity-gap-list`: Access flows missing identity checks

## Outputs

- `implicit-trust-findings`: Places where network location, source IP, or VPN connection grants access without identity
- `trust-assumption-inventory`: Complete catalog of trust assumptions in the architecture

## Process

1. Identify resources accessible solely because the requester is on the corporate network
2. Test for VPN split-tunnel configurations that expose internal resources
3. Check for API endpoints that trust caller identity based on source IP rather than authentication
4. Catalog every place where access is granted by something other than verified identity and context

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
