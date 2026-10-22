# Filter Tuning Verification

Tune and verify the fabricated filter to meet the specification, diagnosing and correcting discrepancies between measured and designed performance.

## Inputs

- `physical-filter-design`: The fabricated filter
- `expected-performance`: Predicted response from simulation
- `filter-specification`: Original specification to verify against

## Outputs

- `filter-measurement-result`: Measured S21 (insertion loss) and S11 (return loss) across frequency, compared to specification and simulation
- `filter-tuning-record`: Any adjustments made during tuning, the root cause of each discrepancy, and the final as-built element values or dimensions

## Process

1. Measure S21 and S11 on a calibrated VNA across a frequency range wider than the filter passband (at least 3x the bandwidth on each side) to capture stopband behavior.
2. Compare measured to simulated response. Common discrepancies: shifted center frequency (dielectric constant different from assumed), wider bandwidth (coupling stronger than designed), higher insertion loss (lower Q than expected), asymmetric response (parasitic coupling between non-adjacent resonators).
3. For lumped filters: tune by replacing components with adjusted values. Change one element at a time, starting from the input and working toward the output. Each element primarily affects one feature of the response.
4. For distributed filters: tune by adjusting physical dimensions. For coupled-line filters, the gap controls coupling (bandwidth) and the resonator length controls frequency. Trim with conductive paint or by removing metal.
5. For cavity filters: tune by adjusting the tuning screws. Each screw changes one resonator frequency or one coupling. Follow the manufacturer's alignment procedure: first tune all resonators to the center frequency (monitor return loss), then adjust couplings for bandwidth.
6. Record the final measured performance against every specification parameter. Document any deviations and whether they are acceptable. Archive the tuning record for production repeatability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
