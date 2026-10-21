# Quantum Benchmark Execution

Execute the circuit on hardware with and without error mitigation, collecting sufficient shots for statistical analysis.

## Inputs

- `transpiled-circuit`: Circuit ready for execution
- `mitigation-strategy`: Error mitigation configuration to apply

## Outputs

- `raw-counts`: Measurement outcome distributions for unmitigated and mitigated runs
- `execution-metadata`: Timestamps, shot counts, device calibration snapshot, and job IDs

## Process

1. Submit the unmitigated circuit for the baseline shot count
2. Submit the mitigated circuit variants (noise-scaled, etc.) with the required additional shots
3. Record device calibration data at execution time for reproducibility
4. Verify that result distributions pass basic sanity checks (bitstring format, total counts)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
