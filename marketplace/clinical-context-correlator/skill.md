# Clinical Context Correlator

Correlate results with the patient's clinical context.

## Inputs

- `flagged-values`: Abnormal results
- `patient-record`: Current diagnoses and medications

## Outputs

- `clinical-correlation`: Explanation of abnormal values in clinical context
- `trending-data`: Comparison with previous results for trending

## Process

1. Compare against previous results to identify trends.
2. Correlate abnormalities with known diagnoses and medications.
3. Identify values that suggest a new or worsening condition.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
