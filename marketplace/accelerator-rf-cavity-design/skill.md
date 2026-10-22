# Accelerator Rf Cavity Design

Design the RF acceleration system from frequency and voltage requirements through cavity geometry, power source, and control.

## Inputs

- `rf-requirements`: Frequency, voltage, and power from beam dynamics
- `beam-energy-target`: Energy gain per pass or turn
- `accelerator-type`: Linac (single-pass) vs ring (multi-pass)

## Outputs

- `cavity-design`: Cavity geometry, material, operating mode, and Q factor
- `rf-power-source`: Klystron, IOT, or solid-state amplifier specification
- `rf-control-system`: Low-level RF feedback for amplitude and phase stability

## Process

1. Select cavity technology. Normal-conducting copper cavities: simple, moderate Q (10,000-50,000), limited by wall losses (surface resistance scales as sqrt(f)), suitable for low duty cycle (pulsed linacs) or lower frequency (cyclotrons). Superconducting niobium cavities: high Q (1e9 to 1e11), much lower wall power but require cryogenic cooling (2K or 4K), standard for CW and high-duty-cycle machines (e.g., LCLS-II, ESS, LHC).
2. Design the cavity geometry. The fundamental mode (TM010 for a pillbox) gives an accelerating electric field along the axis. The shunt impedance R/Q (a geometry-only figure of merit) determines the voltage per unit stored energy. Elliptical cavities (TESLA/ILC shape) have R/Q ~ 1000 ohm at 1.3 GHz, with optimized cell shape to minimize peak surface fields (Epk/Eacc < 2, Bpk/Eacc < 4 mT/(MV/m)) to avoid field emission and quench.
3. Calculate the required RF power. For a superconducting cavity: P_beam = V_acc * I_beam (beam loading), P_wall = V_acc^2 / (R/Q * Q0) (cavity wall dissipation, small for SRF). Total RF power includes beam loading, wall losses, and power reflected due to detuning. The coupling factor (Q_ext) is set to match: Q_ext = Q0 at zero beam loading, or Q_ext = V_acc^2 / (R/Q * P_beam) for heavy beam loading.
4. Select the RF power source. Klystron: high power (hundreds of kW to MW), efficient at narrow bandwidth, standard for large accelerators. IOT (inductive output tube): better efficiency at lower power, used for storage rings. Solid-state amplifiers: modular, redundant, lower power per unit but scalable, increasingly used for new facilities. Match the source bandwidth and power to the cavity requirement including Lorentz force detuning compensation.
5. Design the low-level RF (LLRF) control. Feedback loops stabilize the cavity field amplitude (to 0.01% for FEL-quality beams) and phase (to 0.01 degrees). The control bandwidth must be faster than the dominant perturbation (microphonics at 1-100 Hz for SRF, beam transients at revolution frequency). Digital LLRF systems sample at tens of MHz, apply IQ demodulation, and compute correction signals in an FPGA. Feedforward for known perturbations (Lorentz detuning, beam loading) plus feedback for unknown disturbances.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
