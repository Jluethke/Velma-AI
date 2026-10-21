# Mobile Data Extractor

Extract data from the mobile device using logical or physical acquisition.

## Inputs

- `device-documentation`: Documented device information and access details
- `extraction-method`: Logical, filesystem, or physical extraction method to use

## Outputs

- `extracted-data`: The complete device data extraction
- `extraction-log`: Log of extraction process including tool and method used

## Process

1. Place the device in airplane mode to prevent remote wipe
2. Connect via the selected extraction method and tool
3. Perform the acquisition and verify data integrity
4. Hash the extraction output and log the process

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
