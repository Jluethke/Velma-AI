# Compromise Extent Assessor

Determine the full extent of the compromise including data access, exfiltration, and persistence.

## Inputs

- `root-cause-analysis`: Root cause and contributing factors
- `control-failures`: Controls that failed

## Outputs

- `compromise-extent`: Full accounting of what was accessed, modified, or exfiltrated
- `persistence-inventory`: All persistence mechanisms installed by the attacker

## Process

1. Catalog all data the attacker accessed based on log evidence
2. Determine if data was exfiltrated by analyzing network traffic and data transfer logs
3. Identify all persistence mechanisms (backdoors, scheduled tasks, modified accounts)
4. Assess whether the attacker retains any access

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
