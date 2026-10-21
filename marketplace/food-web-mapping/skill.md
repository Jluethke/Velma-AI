# Food Web Mapping

Map the food web structure from isotope data showing energy flow pathways.

## Inputs

- `trophic-positions`: Trophic level estimates for each species
- `isotopic-niches`: Niche positions showing carbon source use
- `niche-overlap-matrix`: Overlap between species indicating shared resources

## Outputs

- `food-web-diagram`: Visual food web with species positioned by delta-13C (x) and trophic position (y)
- `dietary-overlap-analysis`: Which species share resources and the degree of competition implied

## Process

1. Position each species on a biplot with delta-13C on the x-axis (carbon source) and trophic position on the y-axis
2. Draw links between consumers and likely prey based on isotopic mixing model outputs or literature diet data
3. Identify the dominant energy channels (e.g., pelagic vs benthic, C3 vs C4)
4. Highlight species with high dietary overlap that may compete for resources

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
