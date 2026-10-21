# Stride Threat Enumerator

Enumerate threats at each trust boundary crossing using the STRIDE classification.

## Inputs

- `trust-boundary-map`: Diagram with trust boundaries marked
- `boundary-crossing-inventory`: Data flows crossing trust boundaries
- `privilege-level-map`: Privilege levels at each boundary

## Outputs

- `threat-catalog`: Full list of identified threats with STRIDE category
- `attack-trees`: Attack tree diagrams for high-complexity threats

## Process

1. For each boundary crossing, enumerate Spoofing threats to identity
2. Enumerate Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege threats
3. Build attack trees for threats that involve multiple steps
4. Cross-reference with known vulnerability patterns for the technology stack

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
