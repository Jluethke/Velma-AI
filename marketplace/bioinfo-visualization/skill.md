# Bioinfo Visualization

Create publication-quality figures: volcano plots, heatmaps, network diagrams, and pathway maps.

## Inputs

- `call-results`: Differential expression or variant data for plotting
- `network-graph`: Network with module and centrality data
- `enrichment-results`: Pathway enrichment data for dot plots

## Outputs

- `figure-set`: Publication-ready figures with captions and source data
- `figure-legends`: Draft figure legends describing each panel

## Process

1. Generate volcano plot of log2 fold change vs. adjusted p-value with labeled top hits
2. Draw a clustered heatmap of top differentially expressed genes across all samples
3. Render the network graph with module coloring and hub gene labels
4. Create enrichment dot plots showing top GO and KEGG terms by gene ratio and significance

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
