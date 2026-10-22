# Energy Use Normalizer

Normalize energy use for weather and occupancy to enable fair comparison.

## Inputs

- `building-profiles`: Building profiles with characteristics and energy data
- `data-completeness`: Data gap assessment

## Outputs

- `normalized-eui`: Weather-normalized energy use intensity (EUI) for each building in kBtu per sqft
- `normalization-notes`: Documentation of normalization methods and weather data sources

## Process

1. Obtain heating and cooling degree day data for each building's climate zone.
2. Apply weather normalization to separate weather-dependent from base energy use.
3. Calculate the energy use intensity (EUI) in kBtu per square foot per year.
4. Adjust for occupancy differences where data is available.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
