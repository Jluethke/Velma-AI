# Contract Template Selector

Select the contract template based on the deal type and engagement terms.

## Inputs

- `deal-type`: The type of deal (service agreement, NDA, license, purchase order, partnership)
- `deal-parameters`: Key terms: parties, scope, pricing, duration, special conditions

## Outputs

- `selected-template`: The contract template chosen for this deal type
- `template-variables`: List of fields that need to be populated in the template

## Process

1. Match the deal type to the available contract templates.
2. Verify the template version is current and approved by legal.
3. Identify all variable fields that require population.
4. Note any optional clauses to include or exclude based on deal parameters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
