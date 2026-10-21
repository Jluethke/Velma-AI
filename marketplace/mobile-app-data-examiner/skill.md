# Mobile App Data Examiner

Examine application data, databases, and cached content on the device.

## Inputs

- `extracted-data`: The device data extraction
- `communication-analysis`: Communication findings for context

## Outputs

- `app-analysis`: Analysis of application data, databases, and cached files
- `app-artifacts`: Extracted artifacts from applications (photos, documents, tokens)

## Process

1. Inventory installed applications and their data directories
2. Parse SQLite databases for each application of interest
3. Extract cached files, images, and documents
4. Analyze application tokens and authentication data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
