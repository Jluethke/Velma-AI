# Repair Estimate Builder

Build the repair estimate with parts, labor, and any sublet work.

## Inputs

- `diagnostic-findings`: What was found during diagnostic inspection
- `recommended-repairs`: List of repairs needed

## Outputs

- `repair-estimate`: Itemized estimate with parts, labor hours, labor rate, sublet costs, and total
- `parts-list`: Parts needed with part numbers, sources, and prices

## Process

1. Look up the labor guide time for each repair operation.
2. Price the parts from the supplier catalog or inventory.
3. Add shop supplies, environmental fees, and any sublet charges.
4. Calculate the total and organize by priority (needed now vs. recommended).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
