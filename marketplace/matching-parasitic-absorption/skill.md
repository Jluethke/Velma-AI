# Matching Parasitic Absorption

Account for real component parasitics by absorbing them into the matching network design rather than treating them as errors.

## Inputs

- `element-values`: Ideal calculated element values
- `network-schematic`: Network schematic

## Outputs

- `adjusted-element-values`: Element values corrected for parasitics: inductor self-resonance, capacitor ESL, PCB pad capacitance, via inductance
- `parasitic-model`: The parasitic model for each component and PCB feature used in the correction

## Process

1. For each inductor: model as ideal L in series with resistance (DCR + AC loss) and in parallel with parasitic capacitance (sets self-resonant frequency, SRF). The inductor is only usable below about 0.7 * SRF. Above SRF, it behaves as a capacitor.
2. For each capacitor: model as ideal C in series with ESR and ESL (equivalent series inductance). The capacitor has a series resonance at f_res = 1/(2*pi*sqrt(ESL*C)). Above this frequency, it behaves as an inductor.
3. Account for PCB parasitics: each pad adds approximately 0.2 to 0.5 pF depending on pad size and substrate. Each via adds approximately 0.5 to 1.5 nH depending on via length and diameter.
4. Absorb PCB pad capacitance into the nearest shunt capacitor: reduce the required capacitor value by the pad capacitance. Absorb via inductance into the nearest series inductor.
5. For transmission line matching elements: account for the step discontinuity at impedance transitions, open-end fringing capacitance, and T-junction parasitic effects. Use discontinuity models from Gupta or EM simulation.
6. Recalculate the network response with all parasitics included. If the match has shifted, adjust element values iteratively until the response at the operating frequency meets the return loss target.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
