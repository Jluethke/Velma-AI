# Sigma Siem Converter

Convert the Sigma rule to the target SIEM query language for testing.

## Inputs

- `draft-sigma-rule`: Sigma rule in YAML format
- `rule-metadata`: ATT&CK mapping and references

## Outputs

- `siem-query`: Rule converted to the target SIEM format (Splunk SPL, Elastic KQL, etc.)
- `conversion-notes`: Notes on any field mappings or adjustments needed for the target SIEM

## Process

1. Run the Sigma rule through the converter for the target SIEM platform
2. Review the converted query for correctness, especially field name mappings
3. Adjust for any platform-specific syntax or field naming conventions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
