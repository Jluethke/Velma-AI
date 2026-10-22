# Sanctions List Screener

Screen against OFAC, EU, UN, and other applicable sanctions lists.

## Inputs

- `screening-request`: Formatted screening request
- `applicable-lists`: Lists to screen against

## Outputs

- `screening-results`: Raw screening results with match scores
- `potential-matches`: Potential matches requiring human review

## Process

1. Run the screening request against each applicable sanctions list.
2. Apply fuzzy matching to account for name variations and transliterations.
3. Score each potential match by confidence level.
4. Separate clear negatives from potential matches.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
