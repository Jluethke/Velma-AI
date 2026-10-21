# Fossil Record Applicator

Apply the validated transfer function to fossil proxy data to reconstruct past climate.

## Inputs

- `transfer-function`: Validated proxy-climate model
- `fossil-proxy-data`: Down-core or time-series proxy measurements from the geological record

## Outputs

- `climate-reconstruction`: Reconstructed climate variable through time
- `analogue-quality`: Goodness-of-fit or analogue distance at each fossil sample

## Process

1. Apply the transfer function to each fossil sample to produce a climate estimate
2. Check whether each fossil assemblage has a good modern analogue in the calibration set
3. Flag samples with poor analogues or that fall outside the calibration range
4. Produce the raw reconstruction time series

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
