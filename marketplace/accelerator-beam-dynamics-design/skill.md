# Accelerator Beam Dynamics Design

Design the beam optics lattice and calculate the key beam parameters for the target energy and luminosity.

## Inputs

- `beam-energy-target`: Target particle energy and species (electrons, protons, heavy ions)
- `beam-current-luminosity`: Target beam current or luminosity for the physics program
- `accelerator-type`: Linac, synchrotron, storage ring, or fixed-field alternating gradient

## Outputs

- `lattice-design`: Magnet arrangement (FODO cells, chicanes, insertion regions) with Twiss parameters
- `beam-parameters`: Emittance, beta functions, beam size, and energy spread
- `rf-requirements`: RF frequency, voltage, and harmonic number from the lattice circumference

## Process

1. Design the basic lattice cell. The FODO cell (focusing-drift-defocusing-drift) is the standard building block. Quadrupole strengths set the betatron tune (number of oscillations per revolution): Q_x and Q_y must avoid resonance conditions (not near integer, half-integer, or low-order fractions). Phase advance per cell of 60-90 degrees is typical. The maximum beta function in the cell determines the required magnet aperture.
2. Calculate beam size from emittance and beta function: sigma = sqrt(epsilon * beta) where epsilon is the geometric emittance (invariant for protons if no radiation, decreasing with energy for electrons due to synchrotron radiation). For a proton synchrotron, normalized emittance epsilon_n = beta_rel * gamma * epsilon is conserved. For an electron ring, equilibrium emittance is set by the balance of quantum excitation and radiation damping.
3. Design insertion regions. Interaction points (for colliders) need low-beta insertions to squeeze the beam to small size (high luminosity: L = N1*N2*f*gamma / (4*pi*sigma_x*sigma_y)). The final focus triplet provides the squeeze but generates high beta at the triplet (chromatic aberration). Injection and extraction regions need kicker magnets with fast rise time and septum magnets for beam separation.
4. Determine RF parameters. RF frequency: h * f_rev where h is the harmonic number (number of buckets) and f_rev is the revolution frequency. The RF voltage must provide sufficient bucket area for the beam energy spread: V_rf = 2*pi*h*eta*delta_E / (q*cos(phi_s)) where eta is the slip factor, delta_E is the energy spread, and phi_s is the synchronous phase. For acceleration, phi_s shifts from 0 to provide net energy gain per turn.
5. Analyze collective effects. Space charge tune shift: delta_Q = -N*r_p / (4*pi*epsilon_n*beta^2*gamma^3*B_f) where N is particles per bunch, r_p is classical proton radius, B_f is the bunching factor. This limits intensity in low-energy rings. Impedance-driven instabilities (resistive wall, beam-beam) set current limits at high energy. Simulate with tracking codes (MAD-X for optics, elegant for tracking with collective effects).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
