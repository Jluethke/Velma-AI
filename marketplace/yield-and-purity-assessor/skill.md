# Yield And Purity Assessor

Calculate isolated yield, assess purity from chromatographic data, compare against predicted values, and identify loss points.

## Inputs

- `optimized-conditions`: The reaction conditions that were run
- `characterization-protocol`: Analytical methods used
- `purity-method`: Chromatographic method for purity

## Outputs

- `yield-report`: Isolated yield per step and overall, with mass balance
- `purity-report`: Measured purity with chromatogram references
- `loss-analysis`: Identified steps with yield loss and suggested improvements

## Process

1. Calculate isolated yield per step from mass recovered vs theoretical
2. Compute overall yield as the product of step yields
3. Report purity from chromatographic integration
4. Identify the highest-loss steps and propose improvements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
