# Benchmark Comparison Reporter

Compare each building's EUI against benchmarks and produce the benchmarking report.

## Inputs

- `normalized-eui`: Normalized EUI for each building
- `normalization-notes`: Normalization methods documentation

## Outputs

- `benchmark-rankings`: Buildings ranked by EUI performance relative to their benchmark (Energy Star, CBECS median)
- `benchmarking-report`: Complete benchmarking report with rankings, outliers, and recommended next steps

## Process

1. Compare each building's EUI to the appropriate benchmark: Energy Star score, CBECS median, or portfolio average.
2. Rank buildings from best to worst performing relative to their benchmark.
3. Identify the top underperformers as candidates for energy audits.
4. Compile the report with the rankings, the comparison methodology, and recommended next steps for underperformers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
