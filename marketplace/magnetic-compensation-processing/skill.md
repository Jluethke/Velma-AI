# Magnetic Compensation Processing

Design the platform magnetic compensation and data processing pipeline to extract the target anomaly from the measured field.

## Inputs

- `magnetometer-specification`: Sensor performance and mounting configuration
- `noise-budget`: Expected noise sources and their characteristics

## Outputs

- `compensation-algorithm`: Platform magnetic compensation model with calibration procedure
- `anomaly-processing-pipeline`: Data processing chain from raw measurement to anomaly detection or survey map

## Process

1. Implement platform magnetic compensation. The Tolles-Lawson model decomposes the platform's magnetic interference into three components: permanent magnetism (constant dipole from hard iron), induced magnetism (from the Earth's field magnetizing the platform, proportional to the ambient field components through the susceptibility tensor), and eddy current effects (from changing fields during maneuvers, proportional to the rate of change of field components). The total has 18 coefficients.
2. Calibrate the compensation model. Fly a standard compensation maneuver: a series of rolls, pitches, and yaws at each of 4 cardinal headings (N, E, S, W). This provides sufficient observability for all 18 Tolles-Lawson coefficients. Solve by least squares: minimize the difference between the measured anomaly field and the model prediction. A good compensation reduces the platform noise from 1-10 nT to 0.01-0.1 nT (improvement ratio of 100:1 or better).
3. Remove the regional geomagnetic field. Subtract the International Geomagnetic Reference Field (IGRF) model evaluated at the measurement location and altitude. For survey work, also remove the diurnal variation using a base station magnetometer recording at a fixed site. The base station correction: anomaly = total_field_mobile - total_field_base + constant.
4. Apply spatial filtering. For survey data collected along flight lines, apply a low-pass filter along-track to suppress noise above the spatial Nyquist of the target (targets at depth d produce anomalies with wavelength > ~2*d, so filter out shorter wavelengths). For detection: apply a matched filter tuned to the expected anomaly shape (dipole at expected depth).
5. For survey mapping: grid the line data using minimum curvature or kriging interpolation. Apply a micro-leveling correction to remove residual heading errors visible as line-to-line offsets. Compute the analytic signal (sqrt of the sum of squared horizontal and vertical gradients) to produce a depth-independent anomaly map. For detection: apply a threshold to the filtered data and report detections with estimated position and amplitude.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
