# Initial Compromise Identifier

Identify the initial compromise vector and the first signs of unauthorized access.

## Inputs

- `attack-timeline`: The reconstructed attack timeline
- `correlated-events`: Full correlated event data for deep analysis

## Outputs

- `compromise-assessment`: Analysis of the initial access method and evidence
- `lateral-movement-map`: Map of how the attacker moved through the environment

## Process

1. Examine the earliest suspicious events in the timeline
2. Test hypotheses for initial access (phishing, exploit, credential abuse)
3. Trace the path from initial access to each compromised system
4. Document the evidence supporting each conclusion

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
