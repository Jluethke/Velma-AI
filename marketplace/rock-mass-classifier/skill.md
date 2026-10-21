# Rock Mass Classifier

Classify the rock mass using standard systems (RMR, Q-system, GSI) from lab and field data.

## Inputs

- `ucs-values`: Lab UCS and elastic property values
- `field-observations`: Joint spacing, condition, groundwater, RQD, and discontinuity data

## Outputs

- `rmr-rating`: Rock Mass Rating (RMR) score and class
- `q-value`: NGI Q-system value and support recommendation

## Process

1. Score each RMR parameter: UCS, RQD, joint spacing, joint condition, groundwater, and orientation adjustment
2. Sum for total RMR and classify (I through V)
3. Compute Q from RQD, Jn, Jr, Ja, Jw, and SRF parameters
4. Compare classifications and note any disagreements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
