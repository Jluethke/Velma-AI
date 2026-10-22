# Lidar Scanner And Detector Design

Select the scanning mechanism and detector technology for the required angular coverage, resolution, frame rate, and detection range.

## Inputs

- `link-budget-results`: Required pulse energy, received power vs range, noise budget
- `wavelength-and-power-selection`: Wavelength, pulse format, eye safety constraints

## Outputs

- `scanner-specification`: Scanner type (mechanical, MEMS, OPA, flash), FOV (horizontal and vertical), angular resolution, scan rate, number of points per second
- `detector-specification`: Detector type (APD, SPAD, SiPM, linear-mode InGaAs), responsivity, gain, dark count rate, timing jitter, pixel count for array detectors

## Process

1. For a rotating mechanical scanner (e.g., spinning mirror or Velodyne-style multi-beam): horizontal FOV = 360 degrees, vertical FOV set by the number of laser/detector channels. Rotation rate 10-20 Hz gives 100k-2M points per second depending on channel count and pulse rate per channel. High reliability concern: bearings, slip ring or optical data transfer.
2. For MEMS mirror scanner: FOV typically 60-120 degrees horizontal, 20-30 degrees vertical. Resonant frequency determines the max scan rate: f_res = (1/(2*pi)) * sqrt(k/J) where k is the torsion spring constant and J is the mirror moment of inertia. Larger mirrors (for lower divergence) have lower resonant frequency. Trade: angular range * mirror size * scan speed.
3. For optical phased array (OPA): no moving parts. Steering angle: theta = arcsin(lambda * delta_phi / (2*pi*d)) where d is the element pitch and delta_phi is the phase shift between elements. FOV limited by grating lobes: FOV < arcsin(lambda/d). Requires d < lambda for hemisphere steering. At 1550nm, element pitch < 1.55um (challenging at scale).
4. For flash lidar: illuminate the entire FOV simultaneously and use a detector array (InGaAs SPAD array or linear-mode APD array). No scanner needed. Trade: high instantaneous power required (spread over the full FOV), detector pixel count limits resolution. Good for short-range (< 30m) high-resolution applications.
5. Detector selection for 905nm: Si APD (gain 50-200, NEP ~1e-14 W/sqrt(Hz), bandwidth to 1GHz), Si SPAD (single-photon sensitivity, timing jitter 50-200ps, dead time 10-100ns, dark count rate 100-10k cps). For 1550nm: InGaAs APD (gain 10-30, higher dark current than Si, lower bandwidth), InGaAs SPAD (higher dark count rate, afterpulsing limits max count rate). SiPM (array of SPADs in parallel): high fill factor, photon-number resolution, but high DCR and limited dynamic range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
