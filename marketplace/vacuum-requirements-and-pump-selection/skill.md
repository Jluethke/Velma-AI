# Vacuum Requirements And Pump Selection

Define vacuum requirements from physics and select appropriate pumping systems for each pressure regime.

## Inputs

- `application-requirements`: Required base pressure, gas species, and process conditions
- `chamber-dimensions`: Volume and surface area of the vacuum system

## Outputs

- `pressure-budget`: Gas load inventory: outgassing, leaks, process gas, beam-induced desorption
- `pump-selection`: Pump types, speeds, and locations for each section
- `pumpdown-estimate`: Time to reach operating pressure from atmospheric

## Process

1. Define required pressure from physics: accelerator beam lifetime from gas scattering cross-section, fusion plasma purity from impurity influx rate, semiconductor process contamination level. Typical: accelerator 10^-9 mbar, fusion 10^-7 mbar before plasma, semiconductor 10^-8 mbar.
2. Build the gas load budget. Thermal outgassing: stainless steel after 150C bakeout ~10^-12 mbar*L/s/cm2; aluminum ~10^-11 mbar*L/s/cm2. Beam-induced desorption in accelerators: eta molecules/ion at the molecular desorption yield. Process gas and virtual leaks from trapped volumes.
3. Select pumps by pressure range and gas species: roughing (scroll, dry roots: 1000 to 10^-3 mbar), high vacuum (turbomolecular: 10^-3 to 10^-10 mbar, good for all gases), UHV (ion pump: 10^-6 to 10^-11 mbar, no hydrocarbons; titanium sublimation pump for reactive gases; NEG coating for distributed pumping in narrow chambers; cryopump for high throughput and noble gases).
4. Calculate effective pumping speed: S_eff = S_pump / (1 + S_pump/C) where C is the conductance of the duct connecting pump to chamber. In molecular flow, C = 12.1 * A * (T/M)^0.5 L/s for an aperture of area A (cm2). Long tubes: C = 12.1 * d^3 / (L * 4) for circular tube.
5. Estimate pumpdown time: for the high vacuum phase, t ~ V * ln(P_start/P_target) / S_eff for volume-limited gas. For the UHV phase, pumpdown is outgassing-limited: P = Q_outgas / S_eff where Q_outgas decreases as ~1/t after bakeout.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
