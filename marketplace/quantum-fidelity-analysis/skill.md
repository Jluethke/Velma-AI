# Quantum Fidelity Analysis

Analyze execution results: compute expectation values, compare hardware to ideal and noisy simulation, assess error mitigation effectiveness, and report fidelity.

## Inputs

- `raw-counts`: Hardware measurement results, mitigated and unmitigated
- `simulated-baseline`: Noisy and ideal simulation results for comparison

## Outputs

- `fidelity-report`: Expectation values, fidelity metrics, and error mitigation improvement factor
- `experiment-summary`: Full experiment report: device, circuit, noise model, mitigation, and results with reproducibility notes

## Process

1. Compute expectation values and confidence intervals from the raw count distributions
2. Calculate fidelity metrics (Hellinger fidelity, state fidelity) against the ideal simulation
3. Quantify the improvement from error mitigation by comparing mitigated vs. unmitigated fidelity
4. Write the experiment summary with all parameters, results, and instructions for reproduction

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
