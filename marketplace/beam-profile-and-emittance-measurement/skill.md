# Beam Profile And Emittance Measurement

Design beam profile measurement systems and emittance diagnostics for characterizing beam quality.

## Inputs

- `bpm-design`: BPM system design
- `resolution-and-accuracy`: BPM performance specifications
- `orbit-feedback-design`: Orbit feedback system

## Outputs

- `profile-monitor-design`: Wire scanner, screen, or non-intercepting profile monitor specifications
- `emittance-measurement-method`: Quadrupole scan or multi-monitor emittance measurement procedure
- `beam-quality-report`: Measured Twiss parameters, emittance, and comparison to design

## Process

1. Select profile monitor type: wire scanner (carbon, SiC, or tungsten wire, 10-100um diameter, scanned through beam, detect secondary particles) for high-energy beams, fluorescent screen (YAG:Ce, OTR foil) with camera for single-pass machines, synchrotron radiation monitor for electron rings (non-intercepting), laser wire for highest energy (Compton scattering).
2. Measure emittance by quadrupole scan: vary one quadrupole strength, measure beam size at a downstream screen for each setting. The beam size squared is a quadratic function of the quad strength: sigma^2 = f(K). Fit to extract the three Twiss parameters (beta, alpha, gamma) and emittance.
3. Alternative: three-screen method or multi-BPM method. Measure beam size at three (or more) locations with known transport matrix between them. Reconstruct the beam matrix Sigma from the measured sizes: sigma_ii = R * Sigma * R^T. Requires accurate knowledge of lattice optics.
4. For bunch length: streak camera (optical, sub-ps resolution from synchrotron radiation), RF deflector (converts temporal to transverse structure, then measured on a screen), electro-optical sampling (uses Pockels crystal near beam to sample field of passing bunch).
5. Beam loss monitoring: ionization chambers (long, gas-filled) along the beamline for integrated loss measurement, scintillator (plastic) + PMT for fast response and turn-by-turn loss detection, diamond detectors for radiation-hard applications. Loss map for aperture identification and machine protection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
