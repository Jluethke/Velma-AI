# Laser Requirements To Gain Medium

Select the gain medium from wavelength, power, beam quality, and pulse requirements using absorption and emission cross-section data.

## Inputs

- `wavelength-requirement`: Target wavelength or wavelength range in nm
- `power-requirement`: CW average power or pulse energy target
- `beam-quality-requirement`: M-squared target and divergence spec
- `pulse-format`: CW, Q-switched, or modelocked with target pulse duration

## Outputs

- `gain-medium-selection`: Selected gain medium with justification (gas, solid-state crystal/ceramic, fiber, semiconductor diode)
- `emission-cross-section-data`: Emission cross-section, upper state lifetime, saturation intensity for the selected medium
- `pump-requirements`: Pump wavelength, absorption bandwidth, and minimum pump power for threshold

## Process

1. Map the target wavelength to available gain media. Gas lasers (HeNe 632.8nm, CO2 10.6um, excimer UV), solid-state (Nd:YAG 1064nm, Yb:YAG 1030nm, Ti:Sapphire 650-1100nm, Er:glass 1550nm), fiber (Yb 1030-1080nm, Er 1550nm, Tm 2000nm), semiconductor (650-1550nm depending on material system).
2. Filter by power level. Semiconductor diodes top out around tens of watts per chip. Fiber lasers scale to multi-kW CW. Solid-state bulk lasers handle high pulse energy. Gas lasers are wavelength-driven choices.
3. For pulsed operation, check the upper state lifetime against the desired pulse format. Q-switching needs long upper state lifetime (Nd:YAG 230us). Modelocking needs broad emission bandwidth (Ti:Sapphire 128THz, Yb:KGW 25nm). Short upper state lifetimes (semiconductor: ns) suit gain switching or external modulation.
4. Calculate the small-signal gain coefficient: g0 = sigma_e * N * pump_rate / (1 + I/I_sat). Verify that the chosen medium can reach threshold gain at a practical pump power given the resonator round-trip loss.
5. Document thermal conductivity of the gain medium for high-power applications. Yb:YAG ceramic has better thermal shock resistance than crystal. Fiber geometry gives high surface-to-volume ratio for cooling.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
