# Species Interaction Mapper

Map species interactions at the study site: predator-prey, competition, mutualism, and parasitism from observation, diet analysis, or network metrics.

## Inputs

- `target-species`: Focal species and co-occurring species
- `sampling-design`: Observation schedule and methods

## Outputs

- `interaction-network`: Species interaction graph with edge types (predation, competition, mutualism)
- `network-metrics`: Connectance, nestedness, modularity, and keystone indices
- `interaction-evidence`: Supporting data (diet contents, behavioral observations, co-occurrence patterns)

## Process

1. Record direct interactions from behavioral observations
2. Analyze diet contents or stable isotopes for trophic links
3. Calculate co-occurrence patterns and test against null models
4. Build the interaction network and compute graph metrics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
