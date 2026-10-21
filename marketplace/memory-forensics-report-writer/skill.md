# Memory Forensics Report Writer

Produce the memory forensics report with all findings and extracted evidence.

## Inputs

- `rootkit-analysis`: Kernel integrity and rootkit findings
- `injection-findings`: Code injection and process hollowing findings
- `extracted-credentials`: Recovered credentials and keys

## Outputs

- `memory-forensics-report`: The complete memory forensics report
- `ioc-list`: Indicators of compromise extracted from memory

## Process

1. Compile all findings into a structured narrative
2. Cross-reference process, network, and injection evidence
3. Extract indicators of compromise (IPs, domains, hashes, mutexes)
4. Write the executive summary and technical details

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
