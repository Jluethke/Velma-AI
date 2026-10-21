# Quantification Report Producer

Produce the image quantification report: representative images, measurement distributions, spatial analysis, and statistical comparisons between groups.

## Inputs

- `morphometry-table`: All object measurements
- `spatial-statistics`: Spatial analysis results
- `colocalization-metrics`: Colocalization results if applicable

## Outputs

- `quantification-report`: Structured report with figures, tables, and statistical tests
- `exportable-data`: Clean CSV of all measurements for downstream analysis

## Process

1. Present representative images showing the segmentation overlaid on the original.
2. Plot distributions of key measurements (area, intensity) as histograms or violin plots.
3. If comparing experimental groups, run appropriate statistical tests on each measurement.
4. Export all measurements as a structured CSV for external analysis tools.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
