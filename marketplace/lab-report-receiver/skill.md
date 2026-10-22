# Lab Report Receiver

Receive and parse the lab report.

## Inputs

- `lab-order-id`: Identifier for the lab order
- `patient-id`: Patient identifier

## Outputs

- `parsed-results`: Structured lab values with test names and units
- `report-metadata`: Lab name, collection time, specimen type

## Process

1. Receive the lab report from the interface or fax.
2. Parse each test result into structured data.
3. Record the collection time, specimen type, and performing lab.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
