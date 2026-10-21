# Cloud Native Security Report Compiler

Compile all cloud-native security findings into a prioritized assessment report.

## Inputs

- `ssrf-findings`: SSRF vulnerability findings
- `iac-findings`: IaC misconfiguration findings
- `autoscaling-findings`: Autoscaling abuse findings
- `observability-findings`: Observability gap findings

## Outputs

- `cloud-native-security-report`: Full cloud-native security assessment report
- `remediation-priority-list`: Prioritized remediation actions

## Process

1. Aggregate findings across mesh, auth, SSRF, IaC, scaling, and observability
2. Score each finding by exploitability and blast radius in the cloud environment
3. Write remediation guidance specific to the cloud provider and orchestrator
4. Produce the final report with architecture risk diagram and remediation timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
