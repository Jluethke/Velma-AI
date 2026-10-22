# Contract Populator

Populate the contract template with deal-specific data.

## Inputs

- `selected-template`: The contract template to populate
- `deal-parameters`: Deal-specific data for the variable fields

## Outputs

- `draft-contract`: The populated contract draft ready for review
- `population-log`: Record of which fields were populated and from what source

## Process

1. Map deal parameters to template variable fields.
2. Populate each field with the correct value (parties, dates, amounts, terms).
3. Include or exclude optional clauses based on the deal structure.
4. Generate the draft contract document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
