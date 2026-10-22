# Three Phase Inverter Design

Design the three-phase inverter power stage including MOSFET or IGBT selection, gate driver circuit, dead time, and DC bus capacitor.

## Inputs

- `motor-selection`: Motor voltage rating, maximum phase current, switching frequency requirement
- `electrical-constraints`: DC bus voltage, maximum continuous and peak current, cooling method

## Outputs

- `power-stage-design`: Switch selection (MOSFET or IGBT, voltage/current rating, Rds_on or Vce_sat), gate driver IC, dead time value, DC bus capacitor value and type
- `loss-analysis`: Conduction loss, switching loss, and gate drive loss for each switch, total inverter efficiency at rated operating point

## Process

1. Select switch technology. For bus voltage under 100V: silicon MOSFETs (low Rds_on at low voltage). For 100 to 600V: silicon MOSFETs, SiC MOSFETs (lower switching loss but higher cost), or IGBTs (lower conduction loss at high current but higher switching loss). For above 600V: IGBTs or SiC MOSFETs. SiC saves 50 to 70 percent of switching loss compared to silicon at the same voltage and current.
2. Rate switches at minimum 20 percent above the DC bus voltage for MOSFETs (avalanche-rated devices can be closer), 50 percent above for IGBTs (no avalanche capability). Current rating: the RMS phase current for sinusoidal drive is I_phase_rms = I_peak / sqrt(2). Each switch conducts for half the electrical cycle, so switch RMS current is I_phase_rms / sqrt(2) = I_peak / 2.
3. Gate driver selection: the gate driver must provide peak gate current Ig_peak = Qg / t_transition to switch the FET in the required time. For a FET with Qg = 100nC and desired transition time of 50ns: Ig_peak = 2A. The driver must handle the high-side bootstrap voltage (for N-channel high-side MOSFETs) or use an isolated gate driver for each switch.
4. Dead time: the time between turning off one switch in a half-bridge and turning on the complementary switch, to prevent shoot-through. Minimum dead time = max(toff_high + margin, ton_low + margin) from the gate driver datasheet. Typical values: 100ns to 1us. Too long dead time introduces voltage distortion (dead-time effect) and generates low-order harmonics in the motor current.
5. DC bus capacitor: sized to supply the ripple current and limit bus voltage ripple during commutation. The RMS ripple current for a three-phase inverter is approximately I_ripple_rms = I_phase_peak * sqrt(3*M/(4*pi) * (2-M)) where M is the modulation index. Use film capacitors (low ESR, high ripple current) or a mix of electrolytic (bulk energy) and ceramic (high-frequency ripple).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
