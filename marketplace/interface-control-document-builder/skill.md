# Interface Control Document Builder

Define and document interfaces between constituent systems at the physical, logical, and data layers using ICD best practice.

## Inputs

- `constituent-profiles`: Per-system profile with interface maturity scores
- `sos-classification`: SoS governance type

## Outputs

- `interface-catalog`: Complete catalog of inter-system interfaces with physical, logical, and data layer specifications
- `icd-gap-list`: Interfaces that lack formal documentation or verification, ranked by criticality

## Process

1. Build an N x N interaction matrix where rows and columns are constituent systems. For each cell, identify data exchanged, protocol, physical medium, and timing constraints.
2. For each interface, document three layers: physical (connector, cable, frequency band, voltage), logical (protocol, message format, handshake, error handling), and data (schema, units, valid ranges, update rate).
3. Assign each interface a criticality score: high if a failure breaks a mission capability, medium if it degrades performance, low if workarounds exist.
4. Flag interfaces where maturity is below 4 and criticality is high. These are the ICD gaps that drive integration risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
