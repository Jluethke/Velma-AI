# Extraction Validator

Validate the extracted signal against known references, injected test signals, or physical constraints.

## Inputs

- `filtered-signal`: extracted signal
- `residual-noise`: the removed noise component

## Outputs

- `validation-report`: comparison against references, injected signal recovery rate, residual structure check
- `artifact-flags`: any detected filtering artifacts (ringing, phase shift, amplitude distortion)

## Process

1. Compare the extracted signal against any available reference or calibration signals
2. Inject a synthetic test signal into the raw data and verify recovery after filtering
3. Inspect the residual for structure (should be white noise if extraction is clean)
4. Flag any filtering artifacts for correction or documentation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
