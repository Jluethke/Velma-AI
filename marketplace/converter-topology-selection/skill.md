# Converter Topology Selection

Select the power converter topology that meets the input/output voltage ratio, power level, isolation requirement, and efficiency target.

## Inputs

- `power-spec`: Input voltage range (Vin_min to Vin_max), output voltage Vout, output current Iout, efficiency target, isolation requirement (yes/no), ripple limits (output voltage ripple, input current ripple)
- `constraints`: Board area, height, thermal environment, cost targets, EMI standard to meet

## Outputs

- `selected-topology`: The chosen topology (buck, boost, buck-boost, flyback, forward, half-bridge, full-bridge, LLC resonant) with operating mode (CCM or DCM) and rationale
- `topology-parameters`: Duty cycle range, switch voltage stress, switch current stress, and diode reverse voltage for the selected topology

## Process

1. Calculate the voltage conversion ratio M = Vout/Vin. For step-down (M < 1) without isolation: buck. For step-up (M > 1) without isolation: boost. For inverting or M near 1 without isolation: buck-boost or SEPIC. For isolated converters under 100W: flyback. For 100W to 500W isolated: forward or half-bridge. Above 500W: full-bridge or phase-shifted full-bridge.
2. Calculate the duty cycle for the nominal input voltage. Buck: D = Vout/Vin. Boost: D = 1 - Vin/Vout. Flyback: D = Vout*N/(Vin + Vout*N) where N is the turns ratio. Verify D stays between 0.1 and 0.9 across the full input range; extreme duty cycles degrade transient response and increase losses.
3. For resonant topologies (LLC), the benefit is zero-voltage switching (ZVS) of the primary FETs and zero-current switching (ZCS) of the secondary diodes, achieving 95 to 98 percent efficiency at high power. The cost is a more complex transformer (magnetizing inductance, leakage inductance, and resonant capacitor form the tank). Use LLC when efficiency above 95 percent is required at power levels above 200W.
4. Calculate switch stress. For a buck converter: Vds_max = Vin_max, Id_peak = Iout + delta_IL/2 where delta_IL is the inductor ripple current. For a flyback: Vds_max = Vin_max + Vout/N + voltage spike from leakage inductance (add snubber or clamp). Select switches rated at least 20 percent above the maximum stress.
5. Determine CCM vs DCM. In CCM (continuous conduction mode), the inductor current never reaches zero; in DCM it does. CCM gives lower peak currents and easier control loop design. DCM is sometimes chosen at light load to avoid reverse recovery losses in the diode. The boundary condition is L_crit = D*(1-D)^2*R/(2*fsw) for a buck, where R = Vout/Iout and fsw is the switching frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
