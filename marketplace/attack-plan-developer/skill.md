# Attack Plan Developer

Develop the attack plan with specific techniques, tools, and phases.

## Inputs

- `osint-report`: Collected intelligence on the target
- `attack-surface-map`: External attack surface
- `rules-of-engagement`: Constraints and prohibited techniques

## Outputs

- `attack-plan`: Phased attack plan with techniques mapped to MITRE ATT&CK
- `tooling-list`: Tools and infrastructure required for each phase

## Process

1. Map potential attack paths from initial access through objectives
2. Select techniques for each phase and map to MITRE ATT&CK framework
3. Prepare custom tooling and infrastructure (C2, phishing domains, payloads)
4. Define fallback techniques if primary approaches are detected or blocked

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
