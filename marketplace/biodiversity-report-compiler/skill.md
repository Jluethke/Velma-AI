# Biodiversity Report Compiler

Compile a biodiversity report with species richness, diversity indices, community composition, and conservation recommendations.

## Inputs

- `species-checklist-template`: Observed species with abundance data
- `habitat-profile`: Habitat context for the community
- `phylogenetic-tree`: Evolutionary relationships among sampled species

## Outputs

- `biodiversity-report`: Species richness, Shannon index, evenness, rarefaction curves, and community composition
- `conservation-flags`: Threatened species detected and habitat concerns
- `management-recommendations`: Actions to maintain or improve biodiversity at the site

## Process

1. Calculate species richness and abundance-based diversity indices
2. Build rarefaction and accumulation curves to assess sampling completeness
3. Describe community composition and compare to reference sites
4. Flag species of conservation concern from IUCN or regional lists
5. Write management recommendations based on habitat and species status

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
