# Lidar Range Equation Analysis

Compute the signal-to-noise ratio and maximum range from the lidar range equation for the target reflectance and atmospheric conditions.

## Inputs

- `lidar-requirements`: Maximum range, range resolution, angular resolution, update rate, target reflectance (diffuse Lambertian or specular), wavelength, eye safety class
- `operating-environment`: Atmospheric visibility, rain/fog/dust conditions, ambient background level (sunlight), temperature range

## Outputs

- `link-budget-results`: Transmitted pulse energy, received signal power vs range, noise equivalent power, SNR vs range curve, maximum range at minimum SNR
- `wavelength-and-power-selection`: Selected wavelength (905nm or 1550nm), pulse energy, pulse repetition rate, average power, eye safety classification and NOHD

## Process

1. Write the lidar range equation for a diffuse (Lambertian) target: P_received = (P_tx * rho * A_rx * eta_atm^2 * eta_opt) / (pi * R^2) where P_tx is the transmitted power (or pulse energy / pulse_width), rho is the target reflectance (10% for dark surfaces, 80% for white), A_rx is the receiver aperture area, eta_atm is the one-way atmospheric transmission, and eta_opt is the system optical efficiency.
2. Compute the atmospheric transmission: eta_atm = exp(-alpha * R) where alpha is the extinction coefficient. Clear air at 905nm: alpha = 0.2/km. Light rain: alpha = 1-3/km. Dense fog: alpha = 10-30/km. At 1550nm, alpha is similar for aerosol scattering but lower for molecular absorption in clear conditions.
3. Compute the noise: N_total = N_signal_shot + N_background + N_dark + N_electronic. Shot noise from signal: variance = 2*e*I_signal*B. Background noise from solar illumination: P_bg = L_sun * A_rx * Omega_fov * delta_lambda * eta_opt where L_sun is the solar spectral radiance and Omega_fov is the solid angle of the receiver field of view. Narrow bandpass filter (1-10nm) reduces background.
4. Select the wavelength: 905nm uses cheaper Si detectors (APD or SPAD) but has lower eye-safe power limit (AEL at 905nm is much lower than 1550nm because the cornea focuses 905nm onto the retina). 1550nm is eye-safe at higher power (cornea absorbs, does not focus on retina) but requires InGaAs detectors (more expensive, higher dark current).
5. Compute the required pulse energy for the target range at the minimum acceptable SNR (typically SNR = 10 for single-pulse detection). If the required energy exceeds the eye-safe limit, either: (1) use 1550nm for higher AEL, (2) use a larger beam divergence to reduce the irradiance at the cornea, or (3) use multi-pulse accumulation (N pulses improve SNR by sqrt(N) at the cost of update rate).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
