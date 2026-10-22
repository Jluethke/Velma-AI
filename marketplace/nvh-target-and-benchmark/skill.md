# Nvh Target And Benchmark

Set NVH performance targets from competitive benchmarking and customer expectations.

## Inputs

- `vehicle-or-machine-type`: Type of product and its primary NVH-sensitive operating conditions
- `competitor-benchmarks`: Measured NVH data from competitor products or previous generation, if available
- `customer-requirements`: Subjective quality expectations and regulatory noise limits

## Outputs

- `nvh-targets`: Quantified targets for interior noise (dBA overall and spectral), vibration (mm/s or g at steering wheel, seat rail, floor), and exterior noise (pass-by per regulation)
- `operating-conditions`: Defined test conditions for each target (speed, RPM, road surface, gear)
- `frequency-bands-of-concern`: Specific frequency ranges where the product must meet or beat competition

## Process

1. Measure the current product (or prototype) and competitor products under identical standardized conditions. Interior noise: driver's ear, passenger ear, rear seat. Vibration: steering wheel, seat rail, floor. Exterior noise: SAE J1470 or ECE R51 pass-by.
2. Compare spectra in third-octave or narrowband. Identify frequency bands where the product exceeds competitors by more than 3 dB (perceptible difference). These are the priority bands for NVH improvement.
3. Set targets: match best-in-class competitor in each frequency band, or set a dB improvement target over the current product. For new vehicles, industry expectations set the floor: a compact car targets 65-70 dBA at 100 km/h cruise; a luxury sedan targets 58-62 dBA.
4. Define the operating conditions for each target: idle, cruise speeds (60, 80, 100, 120 km/h), wide-open-throttle acceleration in each gear, rough road, expansion joints. Each condition excites different sources and paths.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
