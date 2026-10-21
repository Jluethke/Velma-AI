# Particle Batch Comparator

Compare particle size distributions across samples or batches to detect differences.

## Inputs

- `distribution-metrics`: D10, D50, D90, and span for each sample or batch
- `specification-limits`: Target values and acceptance ranges if applicable

## Outputs

- `comparison-results`: Statistical comparison of distributions across samples with pass/fail against spec
- `trend-analysis`: Time trends in particle size if multiple batches are included

## Process

1. Overlay distribution curves from all samples for visual comparison
2. Test for statistically significant differences (t-test on D50, F-test on span)
3. Compare each sample against specification limits and flag out-of-spec results
4. Plot time trends if batch data spans a production period

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
