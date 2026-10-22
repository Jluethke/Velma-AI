# Zopa Assessor

Assess whether a ZOPA exists. If your reservation price is better than their estimated reservation price (from their perspective), there is overlap and a deal is possible.

## Inputs

- `own-reservation-price`: Your reservation prices by issue
- `estimated-counterpart-reservation`: Their estimated reservation prices by issue

## Outputs

- `zopa-assessment`: Whether a ZOPA exists, its estimated size on each issue, and where the value lies
- `negotiation-strategy`: If ZOPA exists: aim for deals closer to their reservation price. If no ZOPA: change the deal structure or walk away.

## Process

1. Compare the two reservation prices on each issue. If your worst acceptable price is lower than their worst acceptable price (for a seller; reversed for buyer), a ZOPA exists on that issue.
2. Estimate the ZOPA size: the distance between the two reservation prices. Larger ZOPA means more room to negotiate.
3. If no ZOPA exists on the primary issue: can you change the deal structure to create one? Add issues, change timing, bundle or unbundle.
4. If no ZOPA exists and the structure cannot change: walk away. No amount of negotiation skill creates a deal where none is possible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
