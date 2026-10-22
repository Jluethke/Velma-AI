# Active Clamp Circuit Design

Design an active clamp circuit that recovers the leakage energy instead of dissipating it, improving efficiency at the cost of added complexity and an auxiliary switch.

## Inputs

- `rcd-clamp-design`: Passive clamp design for comparison
- `clamp-waveform-analysis`: Drain voltage waveform and energy analysis

## Outputs

- `active-clamp-topology`: Active clamp circuit: auxiliary MOSFET and capacitor placement (high-side or low-side), auxiliary switch timing, and resonant transition for ZVS
- `efficiency-improvement`: Quantified efficiency gain from energy recovery: Pclamp_recovered vs Pclamp_dissipated in RCD, minus the additional switching loss of the auxiliary switch

## Process

1. Choose active clamp configuration. High-side: auxiliary MOSFET and clamp cap from drain to Vin+. The clamp cap voltage equals the reflected voltage plus leakage overshoot. Low-side: from source to ground. High-side is more common for flyback because it naturally integrates with the reset mechanism.
2. Size the clamp capacitor for the active clamp. It must be large enough that its voltage does not change significantly during the leakage energy transfer: Cclamp >> Lleak * Ipk^2 / Vclamp^2. Typical: 10x the value used for an RCD clamp, since the energy is stored (not dissipated) and voltage stability matters.
3. Design the auxiliary switch timing. After the main switch turns off, the leakage inductance current charges the drain node. When the drain reaches the clamp voltage, the auxiliary MOSFET body diode conducts. The controller turns on the auxiliary MOSFET (ZVS turn-on, since the body diode is already conducting). The leakage energy transfers to the clamp capacitor. Before the main switch turns on, the auxiliary switch turns off, and the clamp cap energy resonates with the leakage inductance to discharge the main MOSFET drain capacitance, achieving ZVS on the main switch.
4. Calculate the ZVS condition. The energy stored in the clamp capacitor must be sufficient to discharge the main MOSFET Coss: 0.5 * Cclamp * Vclamp^2 > 0.5 * Coss * Vds^2. Since Cclamp >> Coss, this is usually satisfied. The resonant period: Tres = 2*pi*sqrt(Lleak * Coss). The dead time between auxiliary off and main on must be Tres/4 for the drain to reach zero.
5. Quantify the efficiency gain. The RCD clamp dissipates Pclamp = 0.5 * Lleak * Ipk^2 * fsw in heat. The active clamp recovers this energy (returns it to the input or output). Subtract the auxiliary MOSFET gate drive loss and any conduction loss during the clamp period. Net gain is typically 1-3% at full load for converters with significant leakage inductance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
