# First Order Optical Layout

Derive the first-order parameters of an optical system: focal length, magnification, f-number, field of view, entrance and exit pupil positions, and working distance from the application requirements.

## Inputs

- `application-requirements`: Target specifications: object distance, image size or sensor size, resolution, wavelength band, packaging constraints
- `system-constraints`: Physical envelope, weight budget, cost target, environmental conditions (temperature range, vibration)

## Outputs

- `first-order-prescription`: Focal length, back focal distance, f-number, full field angle, working distance, track length, magnification
- `gaussian-beam-parameters`: Beam waist, Rayleigh range, M-squared, divergence half-angle, waist location for each propagation stage (if coherent source)

## Process

1. From sensor size and required field of view, compute focal length: f = sensor_half / tan(half_FOV).
2. Compute f-number from the required resolution and diffraction limit: f/# = 1.22 * lambda * (1 + mag) / (2 * spot_diameter). Check that this is achievable within the cost and complexity budget.
3. For coherent sources, propagate the Gaussian beam through the system using the ABCD matrix method: q_out = (A*q_in + B) / (C*q_in + D). Compute beam waist and Rayleigh range at each conjugate plane.
4. Check back focal distance against the mechanical clearance required for filters, fold mirrors, or detector windows.
5. Document entrance pupil position and diameter. For telecentric systems, verify that the chief ray is parallel to the optical axis in the required space (object-side, image-side, or both).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
