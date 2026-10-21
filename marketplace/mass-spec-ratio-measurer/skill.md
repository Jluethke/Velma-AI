# Mass Spec Ratio Measurer

Measure isotope ratios on the mass spectrometer with bracketing standards and replicate analyses.

## Inputs

- `prepared-samples`: Samples loaded for measurement
- `measurement-protocol`: Instrument settings, integration time, and standard bracketing scheme

## Outputs

- `raw-ratios`: Measured isotope ratios for each sample and standard run
- `instrument-log`: Run sequence, signal intensity, and stability metrics

## Process

1. Tune the mass spectrometer and verify performance on a check standard.
2. Run samples in the standard-sample-standard bracketing sequence.
3. Record raw ratio, signal intensity, and internal precision for each measurement.
4. Flag runs with low signal, drift, or interference.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
