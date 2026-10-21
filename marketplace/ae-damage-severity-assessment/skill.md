# Ae Damage Severity Assessment

Assess damage severity using AE intensity analysis and load history correlation.

## Inputs

- `classified-events`: Events with source mechanism labels
- `load-history`: Applied load or stress over time
- `classification-statistics`: Cumulative event and energy data by class

## Outputs

- `severity-assessment`: Damage severity rating based on AE intensity, Kaiser effect, and Felicity ratio
- `ae-monitoring-report`: Complete AE report with setup, data, analysis, damage assessment, and recommendations

## Process

1. Calculate cumulative AE energy and event count as functions of load
2. Evaluate the Kaiser effect: check whether AE resumes below the previous maximum load (Felicity ratio < 1 indicates damage)
3. Compute AE intensity (log of cumulative signal strength divided by area) for severity grading
4. Write the monitoring report covering the test setup, loading protocol, AE results, damage assessment, and structural recommendations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
