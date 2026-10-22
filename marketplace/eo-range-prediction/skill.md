# Eo Range Prediction

Predict the detection, recognition, and identification ranges using the Johnson criteria and atmospheric transmission models.

## Inputs

- `detector-specification`: Detector and optics design with NETD and resolution
- `optical-design`: System MTF and FOV

## Outputs

- `range-prediction`: Detection, recognition, and identification ranges for specified targets and atmospheric conditions
- `atmospheric-effects-analysis`: Impact of atmosphere on system performance

## Process

1. Apply the Johnson criteria. Detection requires 1 line pair across the target's critical dimension. Recognition requires 3-4 line pairs. Identification requires 6-8 line pairs. A line pair is one cycle of the system resolution. The resolvable cycles across a target at range R: N_cycles = (target_dimension * f) / (2 * pixel_pitch * R) for a Nyquist-sampled system.
2. Account for the system MTF. The Johnson criteria assume adequate contrast and resolution. The system MTF at the spatial frequency corresponding to N_cycles on the target reduces the effective contrast. MTF_system = MTF_optics * MTF_detector * MTF_electronics * MTF_motion. If MTF_system at the relevant frequency is less than the required minimum recognizable contrast, the range is reduced.
3. Model atmospheric transmission. Use MODTRAN or a simplified model (Beer-Lambert law with extinction coefficient). In the MWIR (3-5 um), CO2 absorption near 4.2 um creates a notch. In the LWIR (8-12 um), the atmospheric window is broader but ozone absorption near 9.6 um reduces transmission. Aerosol scattering reduces transmission at all wavelengths, with stronger effect at shorter wavelengths.
4. Compute the target-to-background contrast. For thermal imaging: delta_T = T_target - T_background. A vehicle engine exhaust might be 100-300 C above ambient. A person is 10-15 C above an outdoor background. The apparent temperature difference at the sensor is delta_T * tau_atm where tau_atm is the atmospheric transmission.
5. Calculate the detection range. The minimum resolvable temperature difference (MRT) at the spatial frequency corresponding to 1 line pair on the target at range R must be less than the apparent delta_T. MRT is approximately 2.5 * NETD at low spatial frequencies and degrades (increases) at higher frequencies following the system MTF. Iterate on R to find where the target's apparent contrast equals the MRT at the required spatial frequency.
6. Present range predictions as a table: target type, critical dimension, temperature contrast, atmosphere (clear, haze, fog), and detection/recognition/identification range. Include a probability of detection curve (cumulative normal based on the Johnson criteria probability model: 50% at the criterion, reaching 95% at approximately 1.5x the criterion).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
