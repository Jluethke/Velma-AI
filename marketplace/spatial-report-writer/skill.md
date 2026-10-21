# Spatial Report Writer

Compile the geospatial analysis into a report with maps, autocorrelation results, interpolation surfaces, hotspot maps, and validation summary.

## Inputs

- `hotspot-map`: Hot and cold spot map
- `validation-metrics`: Holdout validation results
- `global-autocorrelation`: Moran's I results

## Outputs

- `spatial-analysis-report`: Complete geospatial analysis report with maps and statistics
- `spatial-figures`: All maps and plots from the analysis

## Process

1. Assemble the choropleth, interpolation, and hotspot maps.
2. Write the methods narrative covering CRS, interpolation, and hotspot detection.
3. Summarize validation results and autocorrelation findings.
4. Compile all elements into the final report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
