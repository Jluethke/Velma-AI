# Miller Turn On Prevention

Analyze and prevent parasitic Miller turn-on caused by high dv/dt on the drain coupling through Cgd to the gate, potentially causing catastrophic shoot-through in half-bridge configurations.

## Inputs

- `dead-time-value`: Dead time settings for complementary switches
- `body-diode-loss`: Body diode loss during dead time

## Outputs

- `miller-mitigation-design`: Design measures to prevent Miller turn-on: gate pull-down resistance, active Miller clamp, negative gate bias, or Kelvin source connection
- `dv-dt-immunity`: Calculated dv/dt immunity in V/ns showing the maximum drain slew rate the gate can withstand without false turn-on

## Process

1. Calculate the Miller-induced gate voltage. When the complementary switch turns on, the drain of the off switch slews at dv/dt. The capacitive divider Cgd and Cgs couples this to the gate: Vgs_induced = dv/dt * Cgd * Rg / (1 + Cgd/Cgs). If this exceeds Vgs(th), the off device turns on and shoot-through occurs.
2. Calculate dv/dt immunity: (dv/dt)_max = Vgs(th) / (Rg_off * Cgd). For Vgs(th) = 3V, Rg_off = 10 ohms, Cgd = 100pF: (dv/dt)_max = 3V / (10 * 100e-12) = 3 V/ns. If the half-bridge switching speed exceeds this, false turn-on will occur.
3. Mitigation option 1: reduce gate pull-down impedance. Use a low-value Rg_off (1-2 ohms) or a dedicated low-impedance pull-down path with a PNP transistor or N-channel MOSFET clamping the gate to source. Some drivers have an active Miller clamp pin that shorts the gate to source when the output is low.
4. Mitigation option 2: apply negative gate bias. Driving the gate to -2V to -5V instead of 0V gives (Vgs(th) + |Vneg|) of immunity. Requires a negative supply rail from a charge pump or auxiliary winding. Standard approach for SiC MOSFETs which need -3 to -5V off-state gate voltage.
5. Mitigation option 3: Kelvin source connection. Use a separate source pin (available on power MOSFET packages with 4+ pins) for the gate return path. This eliminates the common-source inductance that adds to the gate voltage during high di/dt switching. The power source carries the load current; the Kelvin source carries only the gate current.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
