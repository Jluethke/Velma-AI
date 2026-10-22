# Transmitter And Antenna Sizing

Size transmit power and antenna gain into an effective isotropic radiated power.

## Inputs

- `link_requirements`: Band and duplex plan.
- `required_data_rate`: Rate that drives the needed radiated power.

## Outputs

- `eirp_budget`: Effective isotropic radiated power from the transmit chain.
- `antenna_design`: Antenna type, size, gain, and beamwidth.
- `transmit_chain`: Amplifier type and line losses.

## Process

1. Parabolic antenna gain G = efficiency * (pi * D / lambda)^2; a 0.5 m dish at 8.4 GHz with 55 percent efficiency gives about 31 dBi.
2. Half-power beamwidth is about 70 * lambda / D degrees, so higher gain narrows the beam and tightens the pointing requirement.
3. Effective isotropic radiated power EIRP = transmit power (dBW) + antenna gain (dBi) - line loss (dB).
4. Pick the amplifier by power and efficiency: solid-state amplifiers suit lower power and S-band, traveling-wave-tube amplifiers suit higher power at X- and Ka-band.
5. Account for antenna pointing loss from the beamwidth and the attitude error, and for a low-gain omni backup used in safe mode.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
