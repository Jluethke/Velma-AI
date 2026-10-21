# Ics Security Report Generation

Compile ICS security assessment findings into a report suitable for both IT security and operations teams.

## Inputs

- `protocol-findings`: Industrial protocol vulnerabilities
- `segmentation-findings`: Network segmentation gaps
- `remote-access-findings`: Unauthorized remote access paths
- `firmware-findings`: Firmware security issues

## Outputs

- `ics-security-report`: Complete ICS/SCADA security assessment report
- `ics-remediation-roadmap`: Prioritized remediation plan considering operational constraints

## Process

1. Categorize findings by zone (enterprise, DMZ, control, field) and severity
2. Write executive summary with risk context specific to operational technology
3. Document remediation options that account for uptime and safety constraints
4. Produce the remediation roadmap with maintenance window dependencies

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
