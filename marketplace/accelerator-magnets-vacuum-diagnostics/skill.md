# Accelerator Magnets Vacuum Diagnostics

Design the magnet system, vacuum system, and beam diagnostics for reliable accelerator operation.

## Inputs

- `lattice-design`: Magnet positions, strengths, and aperture requirements
- `beam-parameters`: Beam size, current, and energy
- `beam-energy-target`: Maximum beam rigidity (B*rho = p/q)

## Outputs

- `magnet-specifications`: Dipole and quadrupole designs with field quality requirements
- `vacuum-system-design`: Beam pipe material, pumping scheme, and target pressure
- `diagnostics-suite`: BPM, beam profile, current, and loss monitor specifications

## Process

1. Design dipole magnets. For a given beam rigidity B*rho = p/(q*c), the bending radius is rho = B*rho / B. Higher field means smaller radius and smaller machine. Normal conducting iron-core magnets: up to 1.8T. Superconducting NbTi at 4.2K: up to 8-9T (LHC). Nb3Sn at 4.5K: up to 12-16T (HL-LHC upgrade). HTS (REBCO): potentially 20T+, under development. Field quality requirement: field homogeneity better than 1e-4 over the good field region (beam aperture) to avoid resonance driving terms.
2. Design quadrupole magnets. The gradient G = d^2B/dx^2 is specified by the lattice design. Aperture = beam pipe diameter + alignment tolerance + good field region margin. For superconducting quadrupoles, the gradient is limited by the conductor at the pole tip: B_pole = G * r_aperture. Iron saturation limits normal-conducting quadrupoles to about 20 T/m at 50mm aperture. Field quality multipoles (sextupole, octupole) must be below 1e-4 of the main quadrupole at the reference radius.
3. Design the vacuum system. For electron storage rings: synchrotron radiation desorbs gas from the beam pipe wall; the design pressure (1e-9 mbar) is achieved by distributed pumping (NEG coating on the inner beam pipe surface, plus discrete ion pumps). For proton rings: beam-induced electron cloud can cause pressure rise; mitigate with surface treatment (amorphous carbon coating, sawtooth chamber). Beam pipe material: stainless steel (standard), copper (for synchrotron radiation power), aluminum (reduced impedance, LHC). All-metal seals (Conflat) for UHV integrity.
4. Design beam position monitors (BPMs). Button or stripline pickups detect the beam image current. Four electrodes (top, bottom, left, right) give horizontal and vertical position from the difference-over-sum signal. Resolution of 1-10 um RMS is typical for modern digital BPM electronics. Orbit correction uses BPM data and corrector dipole magnets in a feedback loop (beam-based alignment, orbit response matrix inversion).
5. Design beam loss monitors. Ionization chambers or scintillator-PMT detectors around the ring detect particle losses. A machine protection system (MPS) uses loss monitor signals to trigger a beam dump if losses exceed safe thresholds (quench protection for superconducting magnets, or activation limits). Loss maps (measured loss pattern versus artificial orbit bump) verify the collimation system performance. The beam dump system must extract the full beam within one revolution for fast failures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
