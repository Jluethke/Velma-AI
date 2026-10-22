# Dead Time And Shoot Through Prevention

Calculate dead time between complementary switches to prevent shoot-through, accounting for propagation delay mismatch, MOSFET turn-off tail, and body diode conduction losses.

## Inputs

- `bootstrap-capacitor-value`: Bootstrap capacitor and charging circuit parameters
- `bootstrap-diode-spec`: Bootstrap diode characteristics

## Outputs

- `dead-time-value`: Dead time in nanoseconds for both rising and falling edges, with breakdown of each contributing factor
- `body-diode-loss`: Power dissipated in MOSFET body diode during dead time, which determines the efficiency penalty of conservative dead time

## Process

1. Identify all propagation delay sources: driver IC internal delay (tpd_on, tpd_off from datasheet, typically 20-100ns), gate RC time constant (Rg * Ciss), and MOSFET turn-off tail (time from Vgs = Vth to Vds rises, depends on Qgd/Ig).
2. Calculate minimum dead time: td_min = max(tpd_on) - min(tpd_off) + t_fall_margin. Account for worst-case skew between high and low side driver propagation delays. Add temperature margin (propagation delay increases 10-20% from 25C to 125C).
3. Calculate body diode conduction loss during dead time. During dead time, the inductor current flows through the body diode (or external Schottky): P_dt = Vf * Iload * 2 * td * fsw. With Vf = 0.7V (Si body diode), Iload = 10A, td = 100ns, fsw = 100kHz: P_dt = 140mW. For GaN FETs with no body diode, reverse conduction is through the channel at higher voltage drop.
4. For adaptive dead time, the controller detects zero-voltage switching conditions and minimizes dead time dynamically. This reduces body diode losses and enables ZVS in resonant topologies. Implementation requires fast comparators to detect the Vs node voltage transition.
5. Set dead time value with margin: td = td_min * 1.5, rounded up to the nearest 10ns. For half-bridge drivers with integrated dead time (e.g., 100ns typical in ICs like IR2110), verify that the IC default is adequate. If not, use a driver with programmable dead time or generate non-overlapping signals externally.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
