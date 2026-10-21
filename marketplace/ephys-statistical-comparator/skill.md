# Ephys Statistical Comparator

Run statistical comparisons across experimental conditions or cell types.

## Inputs

- `event-features`: Features per event or cell
- `cell-classifications`: Cell type assignments
- `recording-catalog`: Experimental conditions for each recording

## Outputs

- `statistical-results`: Test statistics, p-values, and effect sizes for each comparison
- `ephys-analysis-report`: Full analysis report with methods, results, and figures

## Process

1. Group data by experimental condition and cell type
2. Select appropriate tests (paired/unpaired, parametric/non-parametric)
3. Run the comparisons and correct for multiple testing
4. Compile the report with representative traces, summary plots, and statistical results

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
