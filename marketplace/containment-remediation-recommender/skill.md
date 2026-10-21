# Containment Remediation Recommender

Recommend containment actions and long-term remediation based on investigation findings.

## Inputs

- `compromise-extent`: What was accessed, modified, or exfiltrated
- `persistence-inventory`: Attacker persistence mechanisms found

## Outputs

- `containment-actions`: Immediate actions to stop the attack and prevent further damage
- `remediation-plan`: Long-term fixes addressing root cause and control failures

## Process

1. Define immediate containment: isolate systems, reset credentials, block indicators
2. Plan eradication: remove all persistence, rebuild compromised systems
3. Recommend long-term remediation: patch the root cause, improve failed controls
4. Prioritize actions by urgency and impact

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
