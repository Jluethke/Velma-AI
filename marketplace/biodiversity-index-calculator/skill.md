# Biodiversity Index Calculator

Calculate species richness, Shannon diversity, Simpson index, evenness, and beta diversity across survey sites.

## Inputs

- `species-list`: Species abundance data from all transects
- `site-metadata`: Habitat type, depth, and environmental conditions per transect
- `comparison-datasets`: Previous surveys or regional reference data for context

## Outputs

- `diversity-indices`: Shannon H, Simpson D, Pielou evenness, and species richness per site
- `beta-diversity`: Bray-Curtis dissimilarity or Jaccard index between sites
- `rarefaction-curves`: Species accumulation curves showing sampling adequacy

## Process

1. Tabulate species abundance matrices by site and habitat
2. Calculate alpha diversity indices (Shannon, Simpson, richness, evenness) per site
3. Compute beta diversity metrics (Bray-Curtis, Jaccard) between all site pairs
4. Generate rarefaction curves to evaluate whether sampling effort was sufficient
5. Run ordination (NMDS or PCA) to visualize community composition across sites

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
