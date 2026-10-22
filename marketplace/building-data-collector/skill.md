# Building Data Collector

Collect building characteristics and energy consumption data for benchmarking.

## Inputs

- `building-portfolio`: List of buildings with type, size, location, and year built
- `energy-data`: 12 months of energy consumption data for each building

## Outputs

- `building-profiles`: Standardized building profiles with characteristics and annual energy use
- `data-completeness`: Assessment of data completeness and any gaps

## Process

1. Collect building characteristics: gross floor area, building type, climate zone, occupancy hours, and occupant count.
2. Collect 12 months of energy data (electricity and fuel) for each building.
3. Standardize the data into consistent units (kBtu, kWh/sqft).
4. Flag any buildings with incomplete data and note the gaps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
