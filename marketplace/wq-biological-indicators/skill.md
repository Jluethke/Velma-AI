# Wq Biological Indicators

Measure biological indicators of water quality: fecal coliform, chlorophyll-a, and benthic index.

## Inputs

- `collected-samples`: Samples collected for biological analysis

## Outputs

- `biological-results`: Fecal coliform (CFU/100mL), E. coli, chlorophyll-a (ug/L), and benthic index score
- `biological-status`: Each indicator rated against applicable standards

## Process

1. Enumerate fecal coliforms and E. coli by membrane filtration.
2. Measure chlorophyll-a by acetone extraction and spectrophotometry.
3. If applicable, collect and identify benthic macroinvertebrates and compute the appropriate index (EPT ratio, BMWP, or IBI).
4. Rate each indicator against the applicable standard for the water body class.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
