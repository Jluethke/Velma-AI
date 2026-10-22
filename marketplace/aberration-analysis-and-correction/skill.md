# Aberration Analysis And Correction

Analyze and correct the five Seidel aberrations plus chromatic aberration in the optical design. Select lens forms, materials, and aspheric surfaces to meet the image quality target.

## Inputs

- `first-order-prescription`: Focal length, f-number, field angle, magnification from the first-order layout
- `gaussian-beam-parameters`: Beam parameters if coherent source, otherwise null

## Outputs

- `lens-prescription`: Surface radii, thicknesses, glass types, aspheric coefficients, aperture stop position for every element
- `aberration-budget`: Residual wavefront error by field point: spherical, coma, astigmatism, field curvature, distortion, axial color, lateral color in waves at the primary wavelength

## Process

1. Start with a thin-lens solution that meets the first-order requirements. For a doublet, choose glass pair with Abbe numbers V1 and V2 separated by at least 15 to correct axial chromatic aberration: f1 = f * (V1 / (V1 - V2)), f2 = f * (-V2 / (V1 - V2)).
2. Compute the Seidel sums S_I through S_V and the chromatic sums C_I, C_II for the starting design. Identify which aberrations dominate at the edge of the field.
3. Bend lens elements (vary the shape factor q = (R2 + R1) / (R2 - R1)) to minimize coma while holding the focal length. The minimum-coma shape for a single thin lens at the stop: q_min_coma = -(2*(n^2 - 1)) / (n + 2) * (y_bar / y).
4. Add aspheric surfaces where needed. Place the first asphere on the surface with the largest beam footprint for maximum leverage on spherical aberration. Use conic constant and polynomial coefficients A4, A6, A8.
5. Evaluate the design at three or more field points (on-axis, 0.7 field, full field) and three wavelengths (short, center, long). Target: wavefront error below lambda/4 RMS for diffraction-limited performance, or the MTF specification at Nyquist.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
