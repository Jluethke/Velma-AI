# Cloud Account Hardening Reporter

Produce the cloud account hardening report with all configurations and compliance status.

## Inputs

- `cloud-provider`: Cloud provider
- `security-services`: Enabled security services

## Outputs

- `hardening-report`: Full cloud account hardening report
- `cis-compliance-score`: Compliance score against the CIS cloud benchmark

## Process

1. Run the CIS cloud benchmark assessment
2. Compile all configuration changes and their justification
3. Document any exceptions with risk acceptance
4. Produce the report with the compliance score and remaining items

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
