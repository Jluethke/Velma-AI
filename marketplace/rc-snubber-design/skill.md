# Rc Snubber Design

Design an RC (or RCD) turn-off snubber for the main switch to limit the peak voltage and damp the ringing caused by the resonance between parasitic inductance and device capacitance.

## Inputs

- `parasitic-inductance-map`: Identified parasitic inductances and their values
- `spike-energy`: Energy to be absorbed per switching cycle

## Outputs

- `snubber-component-values`: Snubber capacitor value (sized to absorb the spike energy without excessive voltage rise), snubber resistor value (to damp the ringing and dissipate the energy before the next cycle)
- `snubber-power-dissipation`: Power dissipated in the snubber resistor: Psnub = 0.5 * Cs * Vs^2 * fsw for a capacitor-charge snubber, or Psnub = 0.5 * Lpar * Ipk^2 * fsw for total spike energy

## Process

1. For a turn-off snubber (capacitor across the switch, charged through a diode at turn-off and discharged through a resistor at turn-on): size the capacitor to limit the voltage rise. Cs >= Ipk^2 * Lpar / (Vclamp - Vbus)^2 where Vclamp is the maximum allowable drain voltage.
2. The snubber capacitor must be fully discharged before the next turn-off. The RC time constant must be less than about 1/3 of the on-time: Rs * Cs < D_min / (3 * fsw). This sets the minimum R for a given C.
3. Calculate the resistor power dissipation. The energy stored in Cs each cycle is E = 0.5 * Cs * Vclamp^2. This is dissipated in Rs during the on-time: Psnub = E * fsw = 0.5 * Cs * Vclamp^2 * fsw. Size the resistor for this power with margin.
4. For a simple RC snubber (R in series with C, across the switch, no diode): the resistor damps the LC ringing. Optimal damping: Rs = sqrt(Lpar / Coss) for critical damping of the parasitic ring. Cs should be 2-3 times Coss (the switch output capacitance) so the snubber capacitor dominates the resonance.
5. Evaluate the efficiency impact. A 1W snubber dissipation on a 50W converter is 2% efficiency loss. If the snubber loss exceeds 1-2% of output power, consider: reducing parasitic inductance through better layout, using an active clamp to recover the energy, or accepting the loss if the spike would otherwise destroy the MOSFET.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
