# Dynamic Ir Drop Analysis

Analyze the transient voltage droop during high-activity events (clock edges, burst computation) and design the decoupling capacitor network to limit dynamic IR drop.

## Inputs

- `power-grid-layout`: Power grid from static analysis
- `switching-activity`: Time-domain current waveform showing current spikes during switching events

## Outputs

- `dynamic-drop-profile`: Worst-case voltage droop magnitude and duration during switching events
- `decoupling-capacitor-plan`: Placement and sizing of on-chip decoupling capacitors

## Process

1. Dynamic IR drop occurs when current demand changes faster than the power grid plus package can respond. The voltage droops by delta_V = L_pkg * di/dt + R_grid * delta_I, where L_pkg is the package inductance (typically 100 pH to 1 nH per bump).
2. The worst case is typically the first clock edge after a period of inactivity, when all gates switch simultaneously. The current step can be 10-100x the average current, lasting for one clock period. This creates a voltage droop that can cause timing failures.
3. On-chip decoupling capacitors provide local charge storage to supply the transient current before the package can respond. The required decoupling: C_decap > I_transient * dt / delta_V_allowed, where dt is the response time of the package inductance.
4. MOS decoupling capacitors: thin-oxide NMOS in accumulation mode provides approximately 10 fF/um^2. Place in unused spaces (white space) throughout the digital core. For a 10 mm^2 die with 10% white space, available decap is approximately 10 nF. Compare to the requirement.
5. Placement matters: decoupling capacitors must be physically close to the current consumers. A decap 500 um away is connected through grid resistance and inductance that limits its effectiveness at high frequencies. Distribute decaps evenly, with extra concentration near high-activity blocks (clock buffers, wide bus drivers).
6. Simulate the dynamic IR drop: apply the time-domain current waveform to the power grid RLC model (including package model). Check the voltage at each node versus time. The worst droop must stay within the dynamic IR drop budget (typically 10-15% of VDD for digital, 2-5% for analog).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
