# Deserialization Report

Compile deserialization assessment findings into a prioritized report.

## Inputs

- `gadget-chain-results`: Gadget chain results
- `type-confusion-results`: Type confusion results
- `impact-assessment`: Impact assessment for each finding

## Outputs

- `deser-report`: Prioritized deserialization vulnerability report
- `deser-remediation-guide`: Remediation for each deserialization vulnerability

## Process

1. Rank findings by impact (RCE > file access > DoS) and exploitability
2. Document proof-of-concept steps for each vulnerability
3. Write remediation guidance (avoid native serialization, use allowlists, upgrade libraries)
4. Produce the final report with severity ratings and remediation priorities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
