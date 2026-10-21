# Location History Extractor

Extract and analyze location history from GPS, Wi-Fi, and cell tower data.

## Inputs

- `extracted-data`: The device data extraction
- `app-artifacts`: Application artifacts that may contain location data

## Outputs

- `location-history`: Chronological location data with sources and accuracy
- `location-map`: Visual map of device locations over time

## Process

1. Extract GPS coordinates from system location databases
2. Parse Wi-Fi connection logs for approximate locations
3. Analyze cell tower records for movement patterns
4. Correlate location data from map and photo applications

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
