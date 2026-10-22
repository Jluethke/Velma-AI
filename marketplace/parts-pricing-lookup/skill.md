# Parts Pricing Lookup

Price the required parts from the parts catalog or supplier price lists.

## Inputs

- `repair-operations`: Repair operations to look up parts for
- `vehicle-info`: Vehicle information for accurate part fitment

## Outputs

- `parts-pricing`: Each part with part number, description, source, cost, and retail price
- `parts-availability`: Stock status and delivery time for each part

## Process

1. Identify the parts needed for each repair operation.
2. Look up the part numbers for the specific vehicle application.
3. Price each part at the shop retail rate (cost plus markup).
4. Check availability and note any back-ordered or special-order parts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
