# Laser Beam Delivery Design

Design the beam delivery system from the laser output to the target: beam expansion, steering, focusing, fiber coupling, and safety interlocks.

## Inputs

- `resonator-layout`: Output beam diameter, divergence, M-squared, polarization
- `thermal-design`: Thermal lens effects that modify the output beam parameters

## Outputs

- `beam-delivery-layout`: Beam expander magnification and element focal lengths, steering mirror angles and scan speed, focusing lens focal length and working distance, fiber coupling efficiency and fiber NA/core diameter
- `safety-classification`: Laser class per IEC 60825-1, required engineering controls, interlocks, enclosure design, nominal ocular hazard distance

## Process

1. Design the beam expander from the output beam diameter to the delivery aperture. Galilean (negative-positive): shorter, no intermediate focus (safer for high power). Keplerian (positive-positive): allows spatial filter at intermediate focus. Magnification M = -f2/f1. Output divergence = input divergence / M.
2. For scanning applications, select galvanometer mirrors for scan speeds up to 10 m/s with 20mm aperture. Polygon mirrors for higher speed, fixed scan pattern. For the scan lens (f-theta), specify: f-theta distortion < 1%, telecentricity if needed, flat field over the scan area.
3. For fiber delivery: compute the coupling efficiency from the beam parameter product (BPP = w0 * theta) into the fiber acceptance (NA * core_radius / 2). The beam BPP must be less than or equal to the fiber BPP. For single-mode fiber: BPP = lambda / pi. Multi-mode: BPP = NA * D_core / 4. Use a coupling lens with f = (D_beam/2) / NA_fiber.
4. Laser safety classification: compute the accessible emission limit (AEL) for the wavelength and pulse format from IEC 60825-1 tables. For a Class 4 laser, compute the nominal ocular hazard distance (NOHD) = sqrt(4*P / (pi * MPE)) / divergence. Specify interlocks: door switches, beam dump, emission indicator, key switch, remote interlock connector.
5. For high-power beam transport in atmosphere, account for thermal blooming at P > 10kW: the beam heats the air, creating a negative lens that defocuses the beam. Mitigation: slew the beam to use fresh air, use shorter wavelength (less absorption), or use adaptive optics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
