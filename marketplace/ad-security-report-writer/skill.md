# Ad Security Report Writer

Compile the Active Directory security assessment report.

## Inputs

- `kerberoastable-accounts`: Kerberoasting results
- `privilege-findings`: Privilege escalation findings
- `delegation-findings`: Delegation misconfigurations
- `gpo-findings`: Group Policy findings

## Outputs

- `ad-security-report`: Complete Active Directory security assessment report
- `ad-remediation-plan`: Prioritized remediation actions with implementation guidance

## Process

1. Rank findings by exploitability and impact
2. Write the executive summary with the most critical attack paths
3. Detail each finding with reproduction steps and evidence
4. Produce the remediation plan with quick wins, medium-term fixes, and long-term improvements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
