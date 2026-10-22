# Material Receipt Inspector

Inspect materials on receipt for quantity and quality.

## Inputs

- `delivery-status`: Status of deliveries
- `material-list`: Expected materials with specifications

## Outputs

- `receipt-record`: Record of materials received with inspection results
- `rejection-notices`: Notices for rejected or deficient materials

## Process

1. Verify the quantity received against the packing slip and purchase order.
2. Inspect the materials for damage, correct specifications, and quality.
3. Issue rejection notices for deficient materials.
4. Store accepted materials in the designated laydown area.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
