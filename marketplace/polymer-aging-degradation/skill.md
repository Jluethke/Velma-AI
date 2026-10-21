# Polymer Aging Degradation

Subject polymer specimens to accelerated aging (thermal, UV, hydrolytic) and track property retention over time.

## Inputs

- `mechanical-data`: Baseline mechanical properties for comparison
- `application-requirements`: Service environment: temperature, UV exposure, humidity, chemical contact

## Outputs

- `aging-curves`: Property retention vs. aging time for each degradation mode
- `lifetime-estimate`: Projected service lifetime using Arrhenius or time-temperature superposition

## Process

1. Expose specimen sets to accelerated conditions: 85C/85%RH thermal, UV-A 340nm, or immersion
2. Pull specimens at defined intervals and remeasure mechanical properties and molecular weight
3. Plot property retention curves and identify the failure threshold
4. Apply Arrhenius extrapolation or time-temperature superposition to estimate real-world service life

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
