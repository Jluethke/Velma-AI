# Soar Use Case Selector

Select the use case for automation based on alert volume, response time, and analyst effort.

## Inputs

- `alert-statistics`: Alert volume, response time, and analyst hours per alert type
- `existing-playbooks`: List of already automated use cases to avoid duplication

## Outputs

- `selected-use-case`: The use case to automate with justification based on volume and effort
- `manual-workflow-doc`: Current manual investigation steps for this alert type

## Process

1. Rank alert types by the product of volume and average analyst time per alert
2. Exclude use cases already automated or requiring complex judgment
3. Select the highest-value candidate that can be meaningfully automated
4. Document the current manual workflow step by step

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
