# Attack Chain Analyzer

Analyze the collected evidence to reconstruct the full attack chain.

## Inputs

- `evidence-inventory`: Catalog of collected evidence
- `preserved-artifacts`: Forensic images, logs, and captures

## Outputs

- `attack-chain-timeline`: Chronological reconstruction of the attacker's actions
- `attacker-ttps`: Techniques, tactics, and procedures used, mapped to ATT&CK

## Process

1. Build a timeline of events across all evidence sources
2. Identify the initial access vector and first compromise timestamp
3. Trace lateral movement, privilege escalation, and persistence mechanisms
4. Map each attacker action to the MITRE ATT&CK framework

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
