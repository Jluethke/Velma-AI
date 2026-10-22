# Asset Inventory Registrar

Register the asset in the inventory and CMDB.

## Inputs

- `receiving-record`: Asset receipt details
- `purchase-order`: Purchase order with cost data

## Outputs

- `asset-record`: CMDB record for the asset
- `asset-tag`: Assigned asset tag and barcode

## Process

1. Create the asset record in the CMDB with all hardware and software details.
2. Assign the asset tag and affix the barcode label.
3. Record the purchase cost, warranty terms, and vendor contact.
4. Link the asset to its configuration items.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
