# Laser Pulse Generation

Implement Q-switching or mode-locking to generate the required pulse format. Calculate pulse energy, peak power, pulse duration, and repetition rate.

## Inputs

- `gain-medium-selection`: Medium properties including upper-state lifetime, emission cross-section, saturation fluence
- `resonator-layout`: Cavity geometry, round-trip time, intracavity loss

## Outputs

- `pulse-parameters`: Pulse energy, peak power, pulse duration (FWHM), repetition rate, temporal pulse shape, spectral bandwidth, time-bandwidth product
- `pulse-module-specification`: Q-switch type and timing (AO: RF drive power and frequency; EO: half-wave voltage, Pockels cell material) or mode-locker specification (SESAM: modulation depth, recovery time; Kerr lens: slit position and width)

## Process

1. For Q-switching: compute the stored energy E_stored = P_pump * tau * eta_abs * eta_qd (for pump duration >> tau, use steady-state inversion). The extractable energy is E_pulse = E_stored * eta_extraction where eta_extraction depends on the initial-to-threshold inversion ratio r = n_i/n_th.
2. Q-switched pulse duration: t_pulse = (3.5 * t_rt) / (r - 1 - ln(r)) where t_rt is the round-trip time. For Nd:YAG at 10cm cavity length, t_rt = 0.67ns, giving ns-class pulses. Peak power = E_pulse / t_pulse.
3. For active Q-switching, select AO (acousto-optic) for rep rates above 1kHz (rise time limits max rep rate) or EO (electro-optic) for single-pulse or low-rep-rate with fast switching. AO: specify the RF drive power (typically 10-50W at 24-80MHz), TeO2 or fused silica. EO: specify the half-wave voltage (BBO ~4kV, RTP ~1.6kV, KD*P ~6kV at 1064nm).
4. For mode-locking: the pulse duration is limited by the gain bandwidth. Transform-limited: t_pulse * delta_v >= 0.315 (sech^2 pulse) or 0.441 (Gaussian). Ti:sapphire with 128THz bandwidth supports sub-10fs. Yb:YAG with 5nm bandwidth supports ~200fs. Nd:YAG with 0.45nm bandwidth supports ~8ps.
5. For Kerr lens mode-locking (KLM): the nonlinear index n2 of the gain crystal creates a self-focusing lens proportional to intensity. Design the cavity so that the mode size on a hard or soft aperture decreases for pulsed operation (lower loss for high peak power). For SESAM mode-locking: specify the modulation depth (0.5-5%), saturation fluence (10-100 uJ/cm^2), and recovery time (faster than round-trip time for clean starting).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
