# Asset Procurement Receiver

Procure and receive an IT asset.

## Inputs

- `asset-request`: What asset is needed and the business justification
- `budget-approval`: Approved budget and vendor selection

## Outputs

- `purchase-order`: Issued purchase order
- `receiving-record`: Record of asset receipt and inspection

## Process

1. Issue the purchase order to the selected vendor.
2. Receive and inspect the asset against the order.
3. Record the serial number, model, and condition.
4. Store the asset until deployment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
