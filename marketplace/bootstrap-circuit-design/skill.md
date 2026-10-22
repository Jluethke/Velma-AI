# Bootstrap Circuit Design

Design the bootstrap power supply for high-side gate drivers in half-bridge and full-bridge topologies, including capacitor sizing, diode selection, and refresh considerations.

## Inputs

- `driver-current-requirement`: Peak gate current and total gate charge per cycle
- `gate-resistor-value`: Gate resistor values for switching speed control

## Outputs

- `bootstrap-capacitor-value`: Minimum bootstrap capacitor value in uF, calculated from charge balance: Cboot >= Qg / delta_Vboot where delta_Vboot is allowable droop (typically 0.5-1V)
- `bootstrap-diode-spec`: Bootstrap diode requirements: reverse voltage rating, forward recovery time, reverse recovery charge, and maximum forward current

## Process

1. Calculate the total charge drawn from the bootstrap capacitor per switching cycle: Qtotal = Qg + Iqbs * t_on + Qls where Iqbs is the driver quiescent current and Qls is level shifter charge. The bootstrap cap must supply this without excessive voltage droop.
2. Size the bootstrap capacitor: Cboot = Qtotal / delta_Vboot_max. Allow 0.5 to 1V droop. With Qtotal = 100nC and delta_V = 0.5V: Cboot = 200nF minimum. Use 10x larger (2.2uF) for margin and to handle startup charging transients. Ceramic X7R or X5R is preferred for low ESR.
3. Select the bootstrap diode. The diode must block Vbus when the high-side switch is on. Rating: Vr >= Vbus + margin. Forward recovery must be fast enough (< 50ns) to charge the bootstrap cap during the low-side on-time. Ultra-fast recovery or Schottky diodes for low reverse recovery charge to prevent shoot-through current during high-side turn-on.
4. Check refresh conditions. The bootstrap capacitor recharges only when the low-side switch is on (Vs node near ground). For high duty cycles (D > 0.95), the recharge time may be insufficient. Maximum duty cycle: D_max = 1 - (t_refresh / Tsw) where t_refresh accounts for diode forward recovery + RC charging time constant. If 100% duty cycle is needed, use a charge pump or isolated supply instead.
5. Calculate worst-case undervoltage lockout (UVLO) margin. At startup, the bootstrap cap starts uncharged. The IC typically has UVLO at Vboot = 8-9V. First pulse width must be limited until the bootstrap is charged. Verify that the initial low-side pulse charges the cap above UVLO before the first high-side pulse.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
