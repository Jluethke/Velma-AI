# Kinetics Mechanism Tester

Compare the proposed mechanism against one or more alternative mechanisms.

## Inputs

- `validation-results`: Fit quality for the current mechanism
- `alternative-mechanisms`: Alternative reaction schemes to test

## Outputs

- `mechanism-comparison`: AIC, BIC, and residual comparison across mechanisms
- `best-mechanism`: The selected mechanism with justification

## Process

1. Fit each alternative mechanism to the same experimental data.
2. Compare using AIC and BIC to penalize for additional parameters.
3. Check whether the alternative resolves systematic deviations identified in validation.
4. Select the mechanism that best balances fit quality and parsimony.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
