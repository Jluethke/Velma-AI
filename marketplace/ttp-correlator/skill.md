# Ttp Correlator

Correlate timeline events with known attacker tactics, techniques, and procedures.

## Inputs

- `annotated-timeline`: Gap-annotated unified timeline
- `investigation-window`: Investigation context and threat intelligence

## Outputs

- `ttp-mapped-timeline`: Timeline with events mapped to MITRE ATT&CK techniques
- `attack-phases`: Identified phases of the attack (recon, access, movement, exfil)

## Process

1. Match event patterns against known ATT&CK technique indicators
2. Group events into attack phases (initial access, execution, persistence, etc.)
3. Identify the transition points between attack phases
4. Link to threat intelligence if the TTP pattern matches a known actor

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
