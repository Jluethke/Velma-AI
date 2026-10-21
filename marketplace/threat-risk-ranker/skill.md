# Threat Risk Ranker

Rank each identified threat by likelihood and impact to prioritize remediation.

## Inputs

- `threat-catalog`: Full list of identified threats
- `attack-trees`: Attack tree diagrams for complex threats

## Outputs

- `ranked-threat-list`: Threats ordered by risk score (likelihood times impact)
- `risk-matrix`: Visual risk matrix mapping threats to likelihood and impact

## Process

1. Score each threat for likelihood (attacker skill, access required, tooling availability)
2. Score each threat for impact (confidentiality, integrity, availability, financial, regulatory)
3. Compute risk as likelihood times impact
4. Plot threats on the risk matrix and sort by descending risk

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
