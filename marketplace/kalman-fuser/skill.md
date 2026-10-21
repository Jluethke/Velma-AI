# Kalman Fuser

Fuse the sensor streams using a Kalman filter or weighted average: combine measurements at each time step with optimal gain.

## Inputs

- `aligned-data`: Time-aligned sensor streams
- `fusion-weights`: Optimal weights for each sensor

## Outputs

- `fused-estimate`: The combined output signal with timestamp and value
- `fused-uncertainty`: Time-varying uncertainty (standard deviation) of the fused estimate

## Process

1. Initialize the state estimate from the first available measurements.
2. At each time step, predict the state forward (using a process model if available).
3. Update the prediction by incorporating each sensor's measurement with its weight.
4. Record the fused estimate and its uncertainty at each time step.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
