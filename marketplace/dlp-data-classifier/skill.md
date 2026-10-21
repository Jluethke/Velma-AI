# Dlp Data Classifier

Classify the data types in scope for exfiltration testing.

## Inputs

- `data-inventory`: Inventory of data stores and types in the environment
- `classification-policy`: The organization's data classification policy
- `test-scope`: Which systems and data types are in scope

## Outputs

- `test-data-set`: Synthetic test data matching each classification level
- `classification-matrix`: Data types mapped to sensitivity levels and expected controls

## Process

1. Review the data classification policy and identify all sensitivity levels
2. Create synthetic test data that matches each level (PII, financial, health, IP, credentials)
3. Map each data type to the DLP controls that should detect it
4. Prepare test payloads in multiple formats (plain text, encoded, compressed, encrypted)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
