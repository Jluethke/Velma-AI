# Restricted Party Screener

Screen parties against restricted and denied party lists.

## Inputs

- `customs-documents`: Commercial invoice, packing list, and certificate of origin
- `product-descriptions`: Descriptions and specifications of products

## Outputs

- `screening-results`: Pass/fail results for each party screened
- `screening-record`: Audit trail of all screening checks performed

## Process

1. Screen all parties (buyer, seller, freight forwarder, end user) against denied party lists
2. Check products against export control classifications
3. Document the results of each screening check
4. Flag any matches for further review

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
