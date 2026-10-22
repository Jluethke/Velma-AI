# Mtf And Stray Light Analysis

Verify the modulation transfer function meets the resolution requirement and analyze stray light paths that degrade contrast.

## Inputs

- `lens-prescription`: Complete surface data for the optical system
- `aberration-budget`: Residual aberration by field point

## Outputs

- `mtf-curves`: MTF vs spatial frequency at each field point, tangential and sagittal, polychromatic, with diffraction limit for comparison
- `stray-light-report`: Ghost image locations, relative irradiance of each ghost, narcissus analysis (for IR systems), scattered light contribution to background

## Process

1. Compute the polychromatic MTF at the image plane from the OPD (optical path difference) data. For each field point, Fourier-transform the pupil function to get the PSF, then take the modulus of the Fourier transform of the PSF to get the MTF.
2. Compare the system MTF against the Nyquist frequency of the detector: f_Nyquist = 1 / (2 * pixel_pitch). The system MTF at Nyquist must exceed the minimum contrast requirement (typically 0.2 to 0.5 depending on application).
3. Trace ghost rays by reflecting from each pair of surfaces. For N surfaces, there are N*(N-1)/2 ghost paths. Calculate the ghost image position and relative irradiance: I_ghost / I_signal = R1 * R2 * (f / d_ghost)^2 where R1, R2 are the reflectances and d_ghost is the ghost image distance from the focal plane.
4. For thermal IR systems, compute narcissus: cold reflections from the detector back through the optics that create a non-uniformity pattern on the detector. The narcissus contribution depends on the reflectance variation across the last lens surface.
5. Specify baffles and aperture masks to block direct illumination of the detector from out-of-field sources. Compute the point source transmittance (PST) as a function of off-axis angle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
