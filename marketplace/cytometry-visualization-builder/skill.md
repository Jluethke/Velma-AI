# Cytometry Visualization Builder

Produce publication-quality visualizations including dimensionality reduction overlays.

## Inputs

- `compensated-events`: Compensated event data for dimensionality reduction
- `gated-populations`: Population labels for coloring
- `comparison-results`: Statistical comparison results for annotation

## Outputs

- `visualization-panel`: tSNE/UMAP plots, histograms, box plots, and heatmaps
- `cytometry-report`: Full analysis report with methods, statistics, and figures

## Process

1. Downsample events and run tSNE or UMAP for the overview visualization
2. Color by population or marker expression to show structure
3. Generate box plots or violin plots for population comparisons with significance annotations
4. Compile the full analysis report with methods, gating strategy, and figures

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
