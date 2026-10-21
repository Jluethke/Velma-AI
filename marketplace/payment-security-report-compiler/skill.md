# Payment Security Report Compiler

Compile all payment security findings into a PCI-aligned assessment report.

## Inputs

- `scope-findings`: PCI scope and segmentation findings
- `encryption-findings`: Encryption findings
- `fraud-findings`: Fraud pattern findings
- `audit-trail-findings`: Audit trail findings

## Outputs

- `payment-security-report`: Full payment system security assessment report
- `pci-gap-list`: PCI DSS requirement gaps for remediation

## Process

1. Map findings to PCI DSS requirements and identify compliance gaps
2. Score each finding by financial and regulatory risk
3. Write remediation guidance aligned to PCI DSS self-assessment questionnaire
4. Produce the final report with executive summary and detailed technical findings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
