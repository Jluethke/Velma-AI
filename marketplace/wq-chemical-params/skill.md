# Wq Chemical Params

Measure chemical water quality parameters: dissolved oxygen, nutrients, metals, and pH.

## Inputs

- `collected-samples`: Preserved water samples

## Outputs

- `chemical-results`: DO, BOD, COD, pH, alkalinity, nitrate, phosphate, ammonia, and metals concentrations
- `chemical-status`: Each parameter rated against applicable standards

## Process

1. Measure dissolved oxygen by Winkler titration or optical sensor.
2. Measure BOD5 by the 5-day incubation method and COD by dichromate digestion.
3. Analyze nutrients (nitrate, ammonia, total phosphorus) by colorimetry or ion chromatography.
4. Analyze metals by ICP-MS or ICP-OES after acid digestion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
