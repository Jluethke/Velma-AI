# Device Fleet Inventory

Maintain the device inventory with type, location, firmware, and status.

## Inputs

- `fleet-scope`: The scope of the device fleet (all devices, a region, a product line)
- `device-data-sources`: Where device information is stored (management platform, spreadsheets, databases)

## Outputs

- `fleet-inventory`: Complete inventory with device ID, type, location, firmware, status
- `inventory-gaps`: Devices missing data or not yet registered

## Process

1. Collect device records from all data sources into a single inventory.
2. Reconcile duplicates and fill in missing fields.
3. Flag devices with outdated firmware, unknown status, or missing location data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
