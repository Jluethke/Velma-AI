# Api Change Impact Analyzer

Analyze the types of changes the API undergoes and their impact on consumers.

## Inputs

- `api-history`: Past API changes and their effects on consumers
- `consumer-catalog`: Known API consumers and their usage patterns

## Outputs

- `change-taxonomy`: Types of changes (additive, breaking, deprecation) with historical frequency
- `consumer-sensitivity`: Which consumers are affected by which types of changes

## Process

1. Review past API changes and categorize them: additive (new fields/endpoints), breaking (removed/renamed fields), behavioral (logic changes).
2. For each consumer, determine which change types would break their integration.
3. Estimate the frequency of each change type going forward.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
