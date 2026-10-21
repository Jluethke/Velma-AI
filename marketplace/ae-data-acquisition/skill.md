# Ae Data Acquisition

Acquire acoustic emission signals during loading and record waveforms with timing data.

## Inputs

- `sensor-layout`: Installed sensor configuration
- `acquisition-parameters`: Threshold, hit definition time, peak definition time, and sampling rate

## Outputs

- `raw-ae-data`: Recorded AE hits with waveforms, timestamps, amplitudes, durations, and energy
- `load-history`: Synchronized load or stress data for correlation with AE activity

## Process

1. Set the amplitude threshold above the background noise floor
2. Configure hit definition timing parameters to separate discrete events
3. Begin loading the structure and record AE data synchronized with the load signal
4. Monitor hit rates in real time to detect sudden increases indicating damage onset

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
