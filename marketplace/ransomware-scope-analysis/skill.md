# Ransomware Scope Analysis

Determine the full scope of the ransomware impact across the environment.

## Inputs

- `evidence-inventory`: Collected evidence from affected systems
- `scope-assessment`: Preliminary scope from isolation phase

## Outputs

- `full-scope-report`: Complete list of affected systems, data, and services
- `data-impact-assessment`: Classification of encrypted data by sensitivity and business criticality

## Process

1. Scan the network for indicators of compromise on systems not yet identified
2. Inventory all encrypted files and classify by data type and sensitivity
3. Determine which business services are impacted and their recovery priority
4. Estimate the timeline of the attack from initial access to encryption

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
