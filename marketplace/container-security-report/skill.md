# Container Security Report

Produce the container security review report with all findings, risk ratings, and hardening recommendations.

## Inputs

- `supply-chain-findings`: Supply chain integrity issues
- `network-policy-findings`: Network policy findings
- `secrets-findings`: Secrets management findings

## Outputs

- `container-security-report`: Complete container security report
- `hardening-plan`: Prioritized hardening actions

## Process

1. Consolidate findings from image, Dockerfile, RBAC, network, secrets, and supply chain reviews.
2. Assign severity ratings based on exploitability and blast radius.
3. Write specific hardening recommendations for each finding.
4. Produce a phased hardening plan ordered by risk reduction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
