# Md Experimental Validation

Compare simulation results against experimental observables to assess accuracy.

## Inputs

- `structural-metrics`: RMSD, RMSF, and structural data from the trajectory analysis
- `interaction-analysis`: Computed interaction energies and contacts
- `experimental-data`: Published or measured experimental values for comparison

## Outputs

- `validation-report`: Side-by-side comparison of simulated vs experimental values with deviations
- `md-summary-report`: Complete MD study report covering system setup, protocol, results, and validation

## Process

1. Tabulate simulated observables alongside their experimental counterparts
2. Compute agreement metrics (correlation, RMSE, percent deviation) for each property
3. Identify where the simulation diverges from experiment and possible causes (force field, sampling, system size)
4. Write the final report combining methods, results, and validation assessment

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
