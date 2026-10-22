# Lidar Architecture Selection

Select the lidar ranging method and scanner architecture from range, resolution, and cost requirements.

## Inputs

- `range-requirement`: Maximum detection range for the target reflectivity (e.g., 200m at 10% reflectivity)
- `resolution-requirements`: Angular resolution, range precision, and point rate
- `application-constraints`: Size, weight, power, cost, and environmental requirements

## Outputs

- `ranging-method`: Direct time-of-flight, FMCW, or phase-based with justification
- `scanner-architecture`: Mechanical spinning, MEMS, OPA, flash, or hybrid
- `laser-source-selection`: Wavelength, pulse format, and power level with eye safety analysis

## Process

1. Select the ranging method. Direct time-of-flight (dToF): measures the round-trip time of a short laser pulse. Simple, long range (200m+), but range precision limited by timing jitter (typically 2-5 cm). FMCW (frequency-modulated continuous wave): sweeps a coherent laser and measures beat frequency. Gives simultaneous range and velocity, sub-mm precision, immune to ambient light, but limited range (currently 200-300m max) and requires coherent laser source. Phase-based: CW modulated, measures phase of returned signal; high precision but ambiguity range limits application.
2. Select scanner architecture by angular coverage and point rate. Mechanical spinning (Velodyne style): 360-degree horizontal, 16-128 channels vertically, 300K-6M points/sec. Mature but large, expensive, and has moving parts. MEMS mirror: compact, moderate FOV (120x30 degrees), single-beam scanning at 1-2M points/sec. Solid-state flash: no moving parts, limited range (30-50m) due to eye safety (energy spread over full FOV), good for short-range. OPA (optical phased array): solid-state beam steering, promising but immature (limited aperture, sidelobe issues).
3. Select laser wavelength. 905nm: cheap, efficient InGaAs diode lasers, silicon APD detectors, but eye safety limits peak power (Class 1 AEL at 905nm is more restrictive than 1550nm because 905nm reaches the retina). 1550nm: 10x higher Class 1 AEL (cornea absorbs, does not reach retina), InGaAs APD or SiGe SPAD detectors (more expensive), fiber laser sources available for FMCW. 905nm dominates for cost-sensitive automotive. 1550nm for long-range or eye-safe applications.
4. Calculate required transmit power from the lidar range equation. For dToF: SNR = (P_tx * rho * A_rx * eta_sys) / (4 * pi * R^4 * NEP * BW) where P_tx is peak power, rho is target reflectivity, A_rx is receive aperture area, eta_sys is system efficiency, R is range, NEP is receiver noise equivalent power, BW is detection bandwidth. Solve for P_tx given the minimum SNR for detection (typically SNR > 10 for reliable detection). Verify that the transmitted power meets eye safety per IEC 60825 for the beam divergence and scan pattern.
5. Compare SWaP-C (size, weight, power, cost) across architectures. Mechanical spinning: large, heavy, $500-$10K depending on channel count. MEMS: compact (fist-sized), moderate cost ($100-$500 at volume), moderate range. Flash: smallest, lowest cost potential, shortest range. FMCW: moderate size, highest cost (coherent source), best precision and velocity sensing. Select based on the application priority (automotive mass-market vs. survey vs. robotics).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
