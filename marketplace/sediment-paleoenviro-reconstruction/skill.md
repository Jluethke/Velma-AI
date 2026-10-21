# Sediment Paleoenviro Reconstruction

Reconstruct paleoenvironmental conditions by combining all proxy data on the age model.

## Inputs

- `age-model`: Age-depth relationship
- `microfossil-counts`: Microfossil assemblage data
- `loi-results`: Organic and carbonate content
- `grain-size-results`: Grain size data

## Outputs

- `paleoenvironment-reconstruction`: Narrative and quantitative reconstruction of past environmental conditions through time
- `summary-diagram`: Multi-proxy summary diagram plotted against the age model

## Process

1. Plot all proxies on the common age scale.
2. Identify zones of similar proxy behavior using constrained cluster analysis (CONISS).
3. Apply transfer functions to microfossil data if calibration datasets are available.
4. Write the paleoenvironmental narrative for each zone, noting cause-and-effect relationships between proxies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
