# Gage Repeatability Reproducibility

Conduct a Gage R&R study to quantify the measurement system variation relative to part variation and tolerance.

## Inputs

- `measurement-process`: The measurement system to be evaluated
- `uncertainty-budget`: Known uncertainty sources for context

## Outputs

- `gage-rr-results`: Repeatability (EV), reproducibility (AV), and total measurement system variation (%GRR) relative to tolerance and part variation
- `measurement-system-verdict`: Whether the measurement system is adequate for the intended use (AIAG MSA criteria)

## Process

1. Design the study. Select 10 parts spanning the expected process variation (not just good parts). Select 2-3 operators who normally use the instrument. Each operator measures each part 2-3 times in random order. The operators should not know which part they are measuring or see their previous results. Total measurements: 10 parts x 3 operators x 3 trials = 90.
2. Compute repeatability (Equipment Variation, EV): the variation when the same operator measures the same part multiple times. EV = R_bar * k1 where R_bar is the average range across all operator-part combinations and k1 is a constant from the d2* distribution table based on the number of trials and the number of parts*operators.
3. Compute reproducibility (Appraiser Variation, AV): the variation between operators measuring the same part. AV = sqrt((X_diff * k2)^2 - (EV^2 / (n*r))) where X_diff is the range of operator averages, k2 depends on the number of operators, n is the number of parts, and r is the number of trials. If the term under the sqrt is negative, AV = 0.
4. Compute GRR = sqrt(EV^2 + AV^2). Express as %GRR = GRR / tolerance * 100 and %GRR_TV = GRR / total_variation * 100 where total_variation = sqrt(GRR^2 + PV^2) and PV is the part variation.
5. Apply the AIAG MSA criteria. %GRR < 10%: measurement system is adequate. 10-30%: may be acceptable depending on application, importance, and cost of improvement. > 30%: measurement system is not adequate, must be improved before use for process control or acceptance. Also evaluate the number of distinct categories (ndc = 1.41 * PV/GRR). ndc >= 5 means the measurement system can distinguish enough categories for process control.
6. If %GRR is too high, diagnose the root cause from the components. High EV (repeatability): investigate instrument resolution, fixturing, contact force variation, thermal drift within the measurement cycle. High AV (reproducibility): investigate operator technique differences, training, measurement procedure clarity, setup differences.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
