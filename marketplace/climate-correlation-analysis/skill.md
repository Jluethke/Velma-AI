# Climate Correlation Analysis

Correlate the site chronology with instrumental climate records to identify which climate variables the tree rings respond to.

## Inputs

- `site-chronology`: Final site chronology
- `climate-records`: Monthly or seasonal temperature, precipitation, and drought index records for the region

## Outputs

- `correlation-results`: Monthly and seasonal correlation coefficients with significance tests
- `response-function`: Bootstrap response function showing the climate window the trees respond to

## Process

1. Compute Pearson correlations between the chronology and each monthly climate variable over the calibration period
2. Run a bootstrap response function analysis to assess stability of the correlations
3. Identify the seasonal window with the strongest and most stable correlation
4. Test for temporal instability in the growth-climate relationship

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
