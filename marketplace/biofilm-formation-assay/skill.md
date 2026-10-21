# Biofilm Formation Assay

Quantify biofilm formation capacity using crystal violet staining and confocal microscopy to assess clinical or environmental persistence risk.

## Inputs

- `pure-isolate`: Pure culture to assess for biofilm formation
- `optimal-conditions`: Growth conditions optimized in earlier step

## Outputs

- `biofilm-quantification`: Crystal violet OD measurements with strong/moderate/weak/none classification
- `biofilm-images`: Confocal z-stack images showing biofilm architecture

## Process

1. Grow the isolate in 96-well polystyrene plates under static conditions for 24 and 48 hours
2. Wash, fix, and stain adherent biomass with crystal violet, then solubilize and measure OD570
3. Classify biofilm capacity against reference strain controls
4. Image representative wells by confocal laser scanning microscopy with live/dead staining

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
