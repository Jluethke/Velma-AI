# Graphql Security Report Compiler

Compile all GraphQL security findings into a prioritized report with remediation steps.

## Inputs

- `batching-findings`: Batching vulnerability findings
- `disclosure-findings`: Information disclosure findings
- `subscription-findings`: Subscription and mutation access findings
- `idor-findings`: IDOR findings from authorization testing

## Outputs

- `graphql-security-report`: Full GraphQL security assessment report
- `remediation-priority-list`: Prioritized fixes for the API

## Process

1. Aggregate findings across all test phases and deduplicate
2. Score each finding by severity and exploitability
3. Write specific remediation guidance (depth limiting, persisted queries, auth middleware)
4. Produce the final report with executive summary and technical appendix

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
