# Data Staging Collection

Stage target data for exfiltration by collecting and compressing from accessed systems.

## Inputs

- `compromised-systems`: Systems with access to target data
- `ttp-playbook`: Collection and staging techniques

## Outputs

- `staged-data`: Description of collected and staged data (no actual sensitive data)
- `collection-evidence`: Evidence of successful data access for the report

## Process

1. Identify target data on compromised systems matching exercise objectives
2. Collect representative samples (file listings, screenshots, metadata)
3. Stage collected evidence in a temporary location for exfiltration
4. Avoid collecting actual sensitive data beyond what proves the point

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
