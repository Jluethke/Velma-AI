# Attack Matrix Coverage Mapper

Map detection rules to MITRE ATT&CK techniques and identify uncovered techniques.

## Inputs

- `rule-effectiveness-matrix`: Rule effectiveness data
- `log-source-inventory`: Available data sources

## Outputs

- `attack-coverage-heatmap`: Heatmap showing which ATT&CK techniques are covered by rules and data
- `uncovered-techniques`: List of ATT&CK techniques with no detection rule or insufficient data

## Process

1. Tag each correlation rule with the ATT&CK technique(s) it detects
2. Build the coverage heatmap across all tactics and techniques
3. Identify techniques with no rule and techniques with rules but missing data sources
4. Prioritize uncovered techniques by relevance to the organization's threat model

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
