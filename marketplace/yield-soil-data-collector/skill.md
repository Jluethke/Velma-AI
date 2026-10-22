# Yield Soil Data Collector

Collect and clean yield monitor and soil sampling data.

## Inputs

- `field-boundary-map`: GPS field boundaries
- `raw-data-files`: Yield monitor files and soil sample results

## Outputs

- `cleaned-yield-data`: Multi-year yield data with outliers removed
- `soil-data-layers`: Georeferenced soil nutrient and texture data

## Process

1. Import yield monitor data and remove header/end-of-pass errors.
2. Normalize yield data across years for comparison.
3. Georeference soil samples to field coordinates.
4. Combine data layers into a single field database.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
