# Hot Swap Inrush Protection

Design the hot-swap and inrush current limiting circuit for boards inserted into a live backplane, protecting both the board and the backplane from damage.

## Inputs

- `bus-voltage`: Backplane voltage (12V, 48V, etc.), allowed voltage transient on the bus during insertion
- `load-capacitance`: Total capacitance on the board that must be charged during insertion (bulk capacitors, MLCC, etc.)
- `steady-state-current`: Normal operating current after the board is fully inserted and powered

## Outputs

- `hot-swap-circuit`: Hot-swap controller IC, series MOSFET (rating and SOA verification), sense resistor, and timing capacitor for dV/dt and current limiting
- `soa-analysis`: FET safe operating area plot showing the insertion transient trajectory (voltage across FET vs current through FET vs time) stays within the SOA boundary

## Process

1. During insertion, the board's bulk capacitance is at 0V while the backplane is at Vbus. Without limiting, the inrush current is I_peak = Vbus / (R_connector + R_trace), which can be hundreds of amps for a low-impedance bus. This current can weld connector pins, cause a bus voltage dip affecting other boards, and damage capacitors.
2. A series N-channel MOSFET controlled by a hot-swap controller limits the inrush current by operating in the linear region during startup. The controller ramps the gate voltage slowly (controlled by an external capacitor on the GATE pin), which limits dV/dt across the load capacitance: dV/dt = I_limit / C_load. The charging time is t_charge = C_load * Vbus / I_limit.
3. Current limiting: a sense resistor in series with the MOSFET source provides current feedback to the controller. When the current exceeds the limit (set by the controller's threshold voltage divided by the sense resistor), the controller reduces the gate voltage to maintain constant current. Typical I_limit = V_threshold / R_sense, e.g., 50mV / 10 mohm = 5A.
4. FET SOA verification: during the inrush event, the FET simultaneously carries the limit current and blocks (Vbus - V_load). The power dissipation is P = I_limit * (Vbus - V_load), which is maximum at the start (V_load = 0, so P = I_limit * Vbus). The FET must survive this power for the duration of the charging event. Plot the I_limit, Vds trajectory on the FET's SOA curve and verify it stays within the DC or pulsed SOA boundary for the charging duration.
5. After the load capacitance is charged and the FET is fully on (Vds = I_load * Rds_on), the hot-swap controller monitors for overcurrent and short circuit faults. An overcurrent fault (current exceeding the limit for a programmable time) triggers the controller to turn off the FET, disconnecting the board. A fast comparator detects short circuits (current exceeding 2 to 3x the limit) and turns off the FET within microseconds.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
