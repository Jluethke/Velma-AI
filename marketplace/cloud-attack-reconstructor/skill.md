# Cloud Attack Reconstructor

Reconstruct the attacker's actions by combining API, network, and workload evidence.

## Inputs

- `api-events`: Parsed and filtered API audit events
- `flow-analysis`: Network flow analysis results
- `workload-findings`: Container and serverless evidence

## Outputs

- `attack-reconstruction`: Step-by-step reconstruction of attacker actions
- `impact-assessment`: Assessment of what data or resources were compromised

## Process

1. Merge evidence from API, network, and workload sources into one timeline
2. Identify the initial access method (compromised credentials, exposed service, SSRF)
3. Trace each action from initial access through persistence, escalation, and impact
4. Assess what data was accessed, modified, or exfiltrated

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
