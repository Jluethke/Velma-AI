# Magnetometer Selection Configuration

Select the magnetometer technology and configure it for the application's sensitivity, bandwidth, and dynamic range requirements.

## Inputs

- `detection-target`: Target type (ferrous object, geological feature, navigation anomaly) and expected signal strength
- `platform-environment`: Platform type, magnetic noise sources, and operating conditions

## Outputs

- `magnetometer-specification`: Selected magnetometer type, sensitivity, bandwidth, dynamic range, and mounting requirements
- `noise-budget`: Sensor noise, platform noise, and environmental noise contributions

## Process

1. Select the magnetometer type by sensitivity and application. Fluxgate: 10-100 pT/sqrt(Hz) noise floor, 0-1 kHz bandwidth, vector measurement, moderate cost, most common for airborne/marine survey. Optically-pumped cesium or potassium: 1-10 pT/sqrt(Hz), scalar measurement (total field), high absolute accuracy, used for high-sensitivity survey. SQUID: <1 fT/sqrt(Hz), requires cryogenic cooling, used for submarine detection and biomagnetic measurement. Magneto-resistive (AMR, GMR, TMR): 1-100 nT/sqrt(Hz), small, cheap, used for compassing and consumer.
2. Determine the required sensitivity from the target signal. A magnetic dipole moment m (A*m^2) produces a field anomaly of approximately mu_0 * m / (4 * pi * r^3) at distance r. A 1000 kg steel object might have m ~ 100 A*m^2. At 100 m range: anomaly ~ 1 nT. At 1 km: anomaly ~ 1 pT. The sensor noise floor must be below the target anomaly with margin for detection (typically 3:1 to 10:1 SNR).
3. For gradiometer configuration: use two magnetometers separated by a baseline. The gradient measurement rejects uniform background fields (Earth's field, diurnal variation) and measures the spatial gradient that is stronger for nearby sources. Baseline selection: longer baseline gives stronger gradient signal but also picks up more platform gradient. Typical: 0.5-3 m for airborne, 0.1-0.5 m for UUV.
4. Analyze the noise budget. Sensor intrinsic noise (from datasheet). Platform magnetic noise: engines, actuators, electrical systems produce time-varying fields. Environmental noise: geomagnetic micropulsations (0.1-10 nT at 0.001-1 Hz), cultural noise (power lines: 50/60 Hz), lightning (broadband). The noise budget determines whether the sensor can detect the target.
5. Specify the mounting requirements. Distance from ferrous platform components (inverse-cube falloff means doubling the distance reduces interference by 8x). For aircraft: boom-mounted or towed bird. For ship: towed fish behind the vessel. For UUV: nose-mounted with non-magnetic construction forward. Specify the heading error tolerance for vector magnetometers (hard iron and soft iron calibration will be needed).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
