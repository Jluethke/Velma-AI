# Component Failure Rate Estimation

Estimate failure rates for each component using handbook methods, field data, and test data, applying environmental and quality factors.

## Inputs

- `reliability-block-diagram`: RBD with all functional blocks
- `block-to-hardware-mapping`: Hardware implementing each block

## Outputs

- `component-failure-rates`: Failure rate (lambda, in failures per million hours) for each component, with source (handbook, field data, test data), environmental factors applied, and confidence level
- `failure-rate-method-selection`: For each component: whether parts count (less accurate, less effort) or parts stress (more accurate, requires operating point data) was used, and why
- `environmental-profile`: Operating environment definition for each component: temperature, vibration, humidity, altitude, power cycling frequency

## Process

1. Select the prediction method based on the design phase and available data. Parts count method uses generic failure rates from handbooks, suitable for early design trade studies. Parts stress method adjusts for actual operating conditions (temperature, electrical stress, vibration), required for detailed design. When field data from identical or similar equipment exists, it supersedes handbook predictions.
2. For MIL-HDBK-217F parts stress: look up the base failure rate for each component type and quality level. Apply pi factors for temperature (pi_T from the Arrhenius model), electrical stress (pi_S from voltage/current derating), environment (pi_E from ground fixed to airborne fighter), and quality (pi_Q from commercial to military grade). Lambda = lambda_base * pi_T * pi_S * pi_E * pi_Q.
3. For FIDES methodology (European alternative to 217F): the failure rate is lambda = lambda_physical * pi_process * pi_induced. The physical contribution uses the same stress-based model. The process contribution accounts for the manufacturer's quality system, and the induced contribution covers failures caused by other components or external events. FIDES typically predicts higher failure rates than 217F for commercial components.
4. Apply a sanity check by comparing the prediction to field data from similar products. If the prediction differs from field experience by more than a factor of 3, investigate the source of the discrepancy: is the operating environment different, is the component quality different, or is the handbook model inaccurate for this component type?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
