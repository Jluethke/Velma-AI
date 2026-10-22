# Gain Medium And Resonator Selection

Select the gain medium and resonator geometry to meet the required wavelength, power, beam quality, and pulse format. Compute the threshold pump power, slope efficiency, and cavity stability.

## Inputs

- `laser-requirements`: Wavelength, CW or pulsed (rep rate, pulse duration, pulse energy), average power, beam quality (M-squared), linewidth, polarization, environmental constraints
- `application-context`: End use (materials processing, communications, sensing, medical), beam delivery distance, target material properties if relevant

## Outputs

- `gain-medium-selection`: Medium type, emission cross-section, upper-state lifetime, absorption band, thermal conductivity, doping concentration, crystal or fiber length
- `resonator-layout`: Mirror radii, cavity length, stability parameters g1 and g2, output coupler reflectivity, intracavity elements (polarizer, etalon, Q-switch)

## Process

1. From the wavelength requirement, narrow the gain medium candidates. 1064nm: Nd:YAG (high gain, short upper-state lifetime 230us) or Nd:YVO4 (higher cross-section, lower thermal conductivity). 1030-1080nm: Yb:YAG (quasi-three-level, long upper-state lifetime 1ms, good for ultrafast). 1550nm: Er:fiber (eye-safe, telecom compatible). 10.6um: CO2 gas. 800nm: Ti:sapphire (broadest bandwidth for ultrafast).
2. Compute the threshold pump power: P_th = (h * v_p * pi * w_p^2) / (sigma_e * tau * eta_p) * (delta + T_oc) where delta is the round-trip loss, T_oc is the output coupler transmission, w_p is the pump waist, sigma_e is the emission cross-section, tau is the upper-state lifetime, and eta_p is the pump quantum efficiency.
3. Choose the resonator geometry for the required beam quality. Plane-parallel: simple but alignment-sensitive and mode-degenerate. Hemispherical (one flat, one curved): stable and easy to align. Confocal: minimizes diffraction loss. Check stability: 0 < g1*g2 < 1 where g = 1 - L/R.
4. Compute the TEM00 mode waist: w0 = sqrt(lambda * L / pi) * (g1*g2*(1-g1*g2) / (g1+g2-2*g1*g2)^2)^(1/4). Verify that the mode fills the gain medium for efficient extraction but does not clip on apertures.
5. Optimize the output coupler reflectivity using the Rigrod analysis for CW or the Lowdermilk-Murray analysis for pulsed. Maximum output power at R_opt = 1 - sqrt(delta * (2*g0*l - delta)) where g0 is the small-signal gain coefficient and l is the gain length.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
