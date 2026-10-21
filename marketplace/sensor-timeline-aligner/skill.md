# Sensor Timeline Aligner

Align the time axes of multiple sensors: handle different sampling rates, clock offsets, and latency differences.

## Inputs

- `multi-sensor-data`: Data streams from each sensor with timestamps and values
- `sensor-specifications`: Sampling rates, latencies, and known clock offsets for each sensor

## Outputs

- `aligned-data`: All sensor streams resampled to a common time axis
- `alignment-log`: Clock corrections applied, interpolation method used, and samples lost

## Process

1. Identify the common time window covered by all sensors.
2. Apply known clock offsets and latency corrections.
3. Resample each sensor to a common time grid using appropriate interpolation.
4. Flag periods where any sensor has gaps exceeding its Nyquist interval.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
