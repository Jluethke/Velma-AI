# Hormesis Threshold Tester

Test whether the dose-response data show hormesis (low-dose stimulation) or a threshold below which no effect occurs.

## Inputs

- `cleaned-data`: Validated dose-response dataset
- `parameter-estimates`: Fitted model parameters and potency metrics

## Outputs

- `threshold-test-results`: Statistical test results for hormesis and threshold hypotheses
- `threshold-estimate`: Estimated threshold dose if supported, or null if not

## Process

1. Test low-dose groups against control using Dunnett's or Williams' test.
2. Fit a hormetic model (Brain-Cousens or Cedergreen-Ritz-Streibig) and compare to monotone.
3. If hormesis is not supported, test for a threshold using segmented regression.
4. Report the test statistics, p-values, and conclusion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
