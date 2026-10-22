# Ep Thruster Selection And Sizing

Select the electric propulsion thruster type and size it for the mission: match specific impulse, thrust, and power to the mission delta-v, trip time, and available spacecraft power.

## Inputs

- `mission-requirements`: Delta-v budget, trip time constraint, payload mass, and spacecraft wet mass
- `available-power`: Spacecraft power available for propulsion (solar array or nuclear) and its variation with distance from the Sun
- `mission-type`: Station-keeping, orbit raising, interplanetary, or drag compensation

## Outputs

- `thruster-type-selection`: Selected thruster type with specific impulse, thrust, and efficiency
- `propellant-mass-estimate`: Required propellant mass from the rocket equation at the selected Isp
- `power-thrust-trade`: Power-to-thrust ratio and system-level trade between trip time and propellant mass

## Process

1. Map the mission to the EP performance space: plot delta-v vs trip time constraint. Short trip times require high thrust-to-weight (favoring Hall thrusters at 1000 to 3000 s Isp, 50 to 70% efficiency). Long trip times allow high Isp (favoring gridded ion at 3000 to 10000 s Isp, 60 to 80% efficiency). Station-keeping needs low thrust and long life (Hall or electrospray).
2. Calculate propellant mass from the Tsiolkovsky equation at the selected Isp: m_prop = m_initial * (1 - exp(-delta_v / (Isp * g))). Note that higher Isp reduces propellant mass but requires more power for the same thrust: P = T * Isp * g / (2 * eta) where eta is thruster efficiency.
3. Size the thruster: thrust F = m_dot * v_e where v_e = Isp * g. Power P = F * v_e / (2 * eta). For a given available power, this determines the maximum thrust. Calculate trip time from the thrust and total impulse required.
4. Evaluate thruster options: Hall effect thrusters (1000-3000 s Isp, 50-70% eta, simple, flight heritage: SPT-100, BHT-600, X3 nested channel for high power). Gridded ion engines (2000-10000 s Isp, 60-80% eta, higher Isp but lower thrust density: NSTAR, XIPS, T6). Pulsed plasma (low power, low Isp, simple: good for CubeSats). Electrospray (very low thrust, very high Isp: for fine attitude control or micro-propulsion).
5. Select propellant: xenon is the baseline (high atomic mass = high thrust per unit power, easily storable as supercritical fluid, but expensive ~$3000/kg and supply-constrained). Krypton is 5 to 10x cheaper, 15 to 20% less efficient in Hall thrusters, and harder to store (lower density). Iodine stores as a solid (high density), but is corrosive and requires careful materials selection.
6. Perform system mass trade: total system mass = thruster mass + PPU mass + propellant mass + tankage mass + solar array mass for the EP power. Minimize total system mass, not just propellant mass. The optimal Isp balances propellant mass (decreases with Isp) against power system mass (increases with Isp).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
