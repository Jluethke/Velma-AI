# Esd Specification And Model Selection

Define ESD protection targets from the applicable test standards and translate to device-level requirements using the ESD design window.

## Inputs

- `product-esd-requirements`: Customer or standard ESD withstand levels (HBM, CDM, system-level IEC 61000-4-2)
- `io-voltage-domains`: List of I/O types with their voltage levels and speed requirements

## Outputs

- `esd-design-window`: For each I/O type: trigger voltage, holding voltage, on-resistance, and maximum clamping voltage
- `test-current-waveforms`: HBM and CDM current waveforms with peak currents for the target withstand levels

## Process

1. HBM (Human Body Model): 100 pF capacitor through 1.5 kOhm resistor. 2 kV HBM produces 1.33 A peak current with approximately 150 ns pulse. 4 kV doubles the peak. This tests I/O to I/O and I/O to supply combinations.
2. CDM (Charged Device Model): models the IC itself accumulating charge, then discharging through a single pin to ground. 500 V CDM produces approximately 10 A peak current in a sub-nanosecond pulse. CDM is the dominant failure mode in automated manufacturing.
3. The ESD design window: the protection device must trigger (turn on) below the gate oxide breakdown voltage of the protected circuit (BVox, typically 6-8 V for thin oxide). It must clamp the voltage during the ESD event below BVox with margin (at least 20%). It must not trigger during normal operation (trigger voltage > VDD + 10% guard band).
4. For each I/O type, define the window: trigger voltage (V_t1 > VDD_max), holding voltage (V_hold > VDD_max to prevent latch-up during normal power-up), clamping voltage at peak ESD current (V_clamp < BVox * 0.8), and the on-resistance (Ron = (V_clamp - V_hold) / I_peak).
5. For power domain clamps: must sink the full ESD current from any I/O to any supply rail. The trigger mechanism is typically RC-triggered (transient detection) since there is no voltage above VDD during ESD to trigger a simple diode.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
