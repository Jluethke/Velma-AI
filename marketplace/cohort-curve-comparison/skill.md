# Cohort Curve Comparison

Compare cohort curves to find the real trends. The aggregate average of all cohorts combined is a single number that hides everything. The cohort curves show whether each successive cohort is better, worse, or the same as the one before it.

## Inputs

- `cohort-table`: The cohort table with metric values over time
- `cohort-sizes`: The size of each cohort

## Outputs

- `cohort-comparison`: For each time period: how newer cohorts compare to older ones (improving, declining, or stable)
- `inflection-points`: Cohorts where the curve shape changed noticeably, indicating something happened between those cohorts

## Process

1. Plot each cohort as a line on the same chart. The x-axis is time since entry. The y-axis is the metric. Each line is one cohort.
2. Compare the lines at the same age. At month 3, is the January cohort higher or lower than the December cohort? Is there a consistent direction across successive cohorts?
3. Look for inflection points: cohorts where the curve shape changes. If cohorts before March look one way and cohorts after March look different, something changed in March. That is the signal.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
