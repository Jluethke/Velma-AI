# Noise Floor Characterizer

Profile the noise in the raw measurement: compute the power spectral density, identify noise sources, and establish the baseline noise floor.

## Inputs

- `raw-signal-data`: unprocessed measurement time series or spatial array
- `acquisition-metadata`: sampling rate, sensor specs, environment conditions

## Outputs

- `noise-profile`: power spectral density, noise floor level, and identified noise sources
- `signal-band-estimate`: estimated frequency band where the target signal lives

## Process

1. Compute the power spectral density of the raw data
2. Identify spectral peaks from known noise sources (mains hum, sensor drift, aliasing)
3. Estimate the noise floor level across the frequency range
4. Mark the frequency band where the target signal is expected

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
