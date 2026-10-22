# Radar Requirements Architecture

Derive radar performance requirements from the operational mission and select the system architecture.

## Inputs

- `operational-requirements`: Detection range, target types (RCS), revisit rate, angular resolution, environment
- `platform-constraints`: Size, weight, power, antenna aperture, and cost constraints

## Outputs

- `radar-architecture`: Selected architecture (pulsed, CW, FMCW, phased array, SAR) with key parameters
- `performance-budget`: Range equation budget showing required transmit power, antenna gain, receiver sensitivity

## Process

1. Start with the radar range equation: R_max = ((Pt * G^2 * lambda^2 * sigma) / ((4*pi)^3 * kT * B * F * SNR_min * L))^(1/4). Rearrange to find the required power-aperture product from the detection range and target RCS.
2. Select the operating frequency. Lower frequency (L, S band): longer range, better weather penetration, larger antenna for given beamwidth. Higher frequency (X, Ka band): finer resolution, smaller antenna, more atmospheric loss. X-band is the most common compromise for tactical radar.
3. Choose the architecture. Pulsed: standard for long-range surveillance, fire control. CW: Doppler-only measurement, good for speed enforcement and proximity fuzing. FMCW: range and velocity, low power, short range, common in automotive and level measurement. Phased array: electronic beam steering for rapid scan and multi-function operation. SAR: synthetic aperture for imaging.
4. Size the antenna. Beamwidth = k * lambda / D where k ~ 1.2 for uniform illumination, D is the aperture dimension. For a search radar with required beamwidth of 2 degrees at X-band (3 cm), D ~ 1.2 * 0.03 / (2 * pi/180) ~ 1 m. Antenna gain G ~ 4*pi*A_eff / lambda^2 where A_eff = eta * A_physical, eta ~ 0.5-0.7.
5. Close the range equation. With the antenna sized, compute the gain. Set the receiver noise figure (2-5 dB for a low-noise amplifier front-end). Choose the required SNR for detection (13 dB for Pd = 0.9, Pfa = 1e-6 with Swerling I target). Include system losses (2-5 dB for transmission line, radome, beam shape, signal processing losses). Solve for the required peak transmit power.
6. Verify the average power and duty cycle are achievable. Average power = peak power * duty cycle. The transmitter technology limits peak and average power: solid-state (GaN AESA): 5-50 W per element, high duty cycle. Klystron/TWT: kW to MW peak, low duty cycle. Magnetron: simple, cheap, limited waveform flexibility. Document the performance budget showing each term in the range equation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
