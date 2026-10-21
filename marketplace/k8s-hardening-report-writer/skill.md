# K8S Hardening Report Writer

Compile all findings into the Kubernetes security audit report.

## Inputs

- `control-plane-findings`: Control plane findings
- `rbac-findings`: RBAC findings
- `network-policy-findings`: Network policy findings
- `runtime-security-findings`: Runtime security findings

## Outputs

- `k8s-security-report`: Complete Kubernetes security audit report
- `hardening-checklist`: Prioritized checklist of hardening actions

## Process

1. Organize findings by severity and category
2. Write the executive summary with critical and high severity counts
3. Produce the hardening checklist with specific remediation steps for each finding
4. Include CIS Benchmark compliance percentage and gap analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
