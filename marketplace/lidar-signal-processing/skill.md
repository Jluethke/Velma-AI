# Lidar Signal Processing

Process the raw lidar returns into range measurements and point clouds: timing extraction, multi-return detection, background rejection, and coordinate transformation.

## Inputs

- `scanner-specification`: Scan pattern, angular positions for each pulse
- `detector-specification`: Detector response, timing resolution, dynamic range

## Outputs

- `point-cloud-specification`: Point density (points per square meter at reference range), range accuracy and precision, maximum number of returns per pulse, intensity calibration method
- `processing-architecture`: FPGA or ASIC signal processing blocks, TDC resolution, matched filter or threshold detection, coordinate frame and timestamp synchronization

## Process

1. For direct detection (ToF): the range is R = c * t_round_trip / 2. Range resolution = c * t_pulse / 2 for pulse detection, or c / (2 * B_chirp) for FMCW. Timing precision determines range precision: 1ns timing jitter = 15cm range uncertainty.
2. Implement multi-return detection: a single pulse can produce returns from multiple surfaces (e.g., tree canopy and ground). Use a constant-fraction discriminator (CFD) to detect each return above a threshold while rejecting noise. The CFD triggers at a fixed fraction of the pulse amplitude, reducing walk error (timing shift with amplitude).
3. For FMCW lidar: the laser frequency chirps linearly over bandwidth B during time T_chirp. The beat frequency between transmitted and received signals: f_beat = (2*R*B) / (c*T_chirp). Range resolution = c / (2*B). Velocity from the Doppler shift: v = (f_up - f_down) * lambda / 4 where f_up and f_down are the beat frequencies for the up-chirp and down-chirp.
4. Convert each range measurement to a 3D point: (x, y, z) = R * (sin(theta_h)*cos(theta_v), cos(theta_h)*cos(theta_v), sin(theta_v)) where theta_h and theta_v are the horizontal and vertical scanner angles at the time of the pulse. Synchronize the scanner angle encoder with the pulse timestamp to better than 1/10 of the angular resolution.
5. Background rejection: use time-gating to accept returns only within the range window of interest. Narrow optical bandpass filter (1-3nm FWHM) centered on the laser wavelength rejects broadband solar background. For SPAD detectors, time-correlated single photon counting (TCSPC) with histogram accumulation rejects uncorrelated background photons.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
