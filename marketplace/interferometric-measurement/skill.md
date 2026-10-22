# Interferometric Measurement

Measure surface form, flatness, or optical path difference using interferometry with phase-shifting analysis.

## Inputs

- `measurement-target`: What to measure (surface flatness, radius of curvature, transmitted wavefront, surface roughness), target accuracy, surface type (reflective, transmissive), size
- `environment-conditions`: Vibration level, temperature stability, air turbulence, cleanroom class

## Outputs

- `interferometer-setup`: Interferometer type (Fizeau, Twyman-Green, Michelson), reference surface specification, light source (HeNe 633nm, tunable diode), camera resolution, phase-shifting method (PZT, wavelength tuning)
- `surface-map`: Height map (nm RMS), Zernike decomposition (piston, tilt, power, astigmatism, coma, spherical removed as appropriate), PSD (power spectral density), surface statistics (Ra, RMS, PV)

## Process

1. Select the interferometer type: Fizeau is the standard for flat and spherical surface testing (common path: reference and test beams share most of the optics, reducing sensitivity to vibration). Twyman-Green for testing lenses and prisms in transmission. Michelson for measuring surface roughness or thin-film step height.
2. Phase-shifting interferometry (PSI): introduce known phase steps between frames (typically 4 or 5 frames with pi/2 step). For 4-frame PSI, the phase at each pixel: phi(x,y) = atan2(I4-I2, I1-I3). The height is: h(x,y) = phi(x,y) * lambda / (4*pi) for reflection. Phase resolution: lambda/1000 is achievable (0.3nm for HeNe at 633nm).
3. For vibrating environments where PSI fails: use dynamic (simultaneous) phase measurement. Pixelated phase-mask: a micro-polarizer array in front of the camera captures 4 phase-shifted images simultaneously. Or carrier-fringe analysis: tilt the reference to introduce spatial fringes and extract the phase from a single frame using Fourier analysis. Lower accuracy than PSI but vibration-immune.
4. Remove systematic errors: subtract the reference surface map (measured by the three-flat test or calibrated against a master). Remove the alignment terms (piston, tilt) and power if testing flatness. Decompose the residual into Zernike polynomials to identify specific aberrations.
5. Uncertainty budget: sources include phase measurement noise (from camera noise and vibration), reference surface error, retrace error (ray tracing through the test optic), environmental effects (air index change: dn/dT_air = -1e-6 /K), and pixel calibration. Combine by root-sum-square for the total measurement uncertainty.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
