# Iot Security Report

Compile IoT device security findings into a prioritized report with remediation recommendations.

## Inputs

- `embedded-secrets`: Firmware secret findings
- `network-findings`: Network vulnerability findings
- `update-findings`: OTA update mechanism findings
- `debug-interface-findings`: Physical debug access findings

## Outputs

- `iot-security-report`: Complete IoT device security assessment report
- `remediation-plan`: Prioritized remediation actions for firmware and hardware issues

## Process

1. Classify findings by attack surface (network, physical, firmware, cloud)
2. Assess each finding against OWASP IoT Top 10 categories
3. Write remediation recommendations distinguishing firmware fixes from hardware redesigns
4. Produce the final report with risk ratings and executive summary

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
