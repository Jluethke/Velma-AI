# Lcl Filter Design For Harmonics

Design the LCL output filter for grid-connected inverters to meet harmonic injection limits while minimizing losses, size, and cost.

## Inputs

- `control-architecture`: Control bandwidth and modulation strategy affecting harmonic spectrum
- `stability-analysis`: Impedance characteristics affecting filter resonance damping

## Outputs

- `filter-design`: LCL filter component values (inductors and capacitors), damping method, and predicted harmonic spectrum at the POI
- `filter-loss-analysis`: Copper and core losses in filter inductors, capacitor ESR losses, and total filter efficiency impact

## Process

1. Set the design targets. The LCL filter must attenuate switching-frequency harmonics to meet IEEE 519 limits at the POI: individual harmonics below the limits in Table 2 (dependent on ISC/IL ratio), total demand distortion (TDD) below 5% for typical utility-scale. The filter resonant frequency must be between 10x the fundamental (600 Hz for 60 Hz systems) and 0.5x the switching frequency to avoid exciting resonance with either the control bandwidth or the switching harmonics.
2. Size the inverter-side inductor L1. L1 limits the peak-to-peak current ripple at the switching frequency. Target ripple of 10-25% of rated peak current. L1 = Vdc / (8 x fsw x delta_I_pp) for a two-level inverter with SVPWM. For a three-level inverter, the effective switching frequency seen by L1 doubles, so L1 can be halved for the same ripple. L1 inductance is typically 5-15% of base impedance.
3. Size the filter capacitor Cf. The capacitor provides a low-impedance path for switching-frequency current, shunting it away from the grid. Limit reactive power absorbed by Cf to less than 5% of rated power: Cf less than 0.05 x Prated / (omega x Vline2). Typical values: 1-5% of base impedance. Larger Cf improves filtering but increases reactive current and may cause leading power factor at light load.
4. Size the grid-side inductor L2. The resonant frequency of the LCL filter is f_res = 1/(2pi) x sqrt((L1+L2)/(L1 x L2 x Cf)). Choose L2 to place the resonant frequency in the target range. L2 is typically 0.5-2x L1. Verify that the total inductance (L1 + L2) does not exceed the maximum that allows the inverter to deliver rated current at the minimum DC bus voltage.
5. Design the damping. Passive damping: a resistor in series with Cf dissipates resonant energy but adds losses (typically 0.5-1% of rated power). Active damping: the inverter control loop adds virtual resistance at the resonant frequency (capacitor current feedback or notch filter). Active damping eliminates the power loss but requires accurate resonant frequency knowledge and adequate control bandwidth. For utility-scale inverters, active damping is standard; passive damping is a fallback for simpler control systems.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
