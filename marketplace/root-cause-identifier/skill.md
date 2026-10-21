# Root Cause Identifier

Identify the root cause and contributing factors that enabled the incident.

## Inputs

- `attack-chain-timeline`: Chronological reconstruction of the attack
- `attacker-ttps`: Techniques used by the attacker

## Outputs

- `root-cause-analysis`: Root cause and contributing factors with evidence
- `control-failures`: Security controls that failed or were absent

## Process

1. Identify the vulnerability or weakness exploited for initial access
2. Determine why existing controls did not prevent or detect each stage
3. Distinguish between root cause (the exploited weakness) and contributing factors (detection gaps, delayed response)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
