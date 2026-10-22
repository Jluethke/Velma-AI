# Illumination Design For Imaging

Design the illumination system to maximize the contrast of the features of interest while minimizing artifacts from specular reflections, shadows, and non-uniformity.

## Inputs

- `sensor-selection`: Sensor spectral response, sensitivity, frame rate (which sets the maximum integration time)
- `imaging-requirements`: Feature type (surface defect, edge detection, 3D measurement, fluorescence), sample material and geometry

## Outputs

- `illumination-design`: Source type (LED, laser, halogen, xenon), wavelength, geometry (bright field, dark field, backlight, coaxial, dome, structured light), uniformity specification, power required to achieve the target SNR within the integration time
- `contrast-analysis`: Predicted contrast for the features of interest vs background under the selected illumination, rejection of unwanted reflections or fluorescence

## Process

1. Select the illumination geometry based on what needs to be visible. Bright field (on-axis or near-axis): shows color, texture, and printed features. Dark field (high-angle): makes surface scratches and edges bright against a dark background. Backlight (transmission): silhouettes for edge detection and dimensional measurement. Coaxial (beamsplitter): flat specular surfaces reflect back into the camera, non-specular defects appear dark.
2. For machine vision, LED illumination dominates: long lifetime, stable output, fast strobing (< 1us), narrow spectral band available. Select the LED wavelength to maximize the contrast of the target feature. Example: for inspecting red objects against a red background, use a narrow-band blue or green LED (the red feature absorbs blue/green differently than the background). For fluorescence excitation, use UV LEDs (365nm or 395nm) with a longpass emission filter.
3. Compute the required illumination power: the sensor needs S_min photons per pixel per frame. The illumination must deliver: P_illum = S_min * h*v * (pi * f/#^2) / (QE * rho * t_int * A_pixel * tau_lens) where rho is the object reflectance and tau_lens is the lens transmission. For high-speed inspection (short integration time), consider pulsed illumination (strobe) to freeze motion without motion blur.
4. Structured light for 3D measurement: project a pattern (stripe, grid, or random dot) onto the object. The deformation of the pattern encodes the surface height. Phase-shifting: project sinusoidal fringes at 3 or 4 phase shifts, compute the phase at each pixel: phi = atan2(I1-I3, I2-I4) for 4-step. Phase unwrapping recovers the absolute height. Accuracy depends on the fringe period and the triangulation angle.
5. Verify illumination uniformity across the field of view: capture an image of a white reference target. The pixel-to-pixel variation should be < 10% for quantitative measurement or < 20% for defect detection (correct residual non-uniformity with flat-field division: I_corrected = I_raw * mean(I_flat) / I_flat).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
