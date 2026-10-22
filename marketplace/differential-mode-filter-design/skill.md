# Differential Mode Filter Design

Design the differential mode EMC filter using LC stages, accounting for capacitor ESL, inductor parasitics, and the interaction between filter and converter input impedance.

## Inputs

- `emission-spectrum`: Emission levels requiring attenuation
- `cm-dm-separation`: DM noise spectrum and required DM attenuation in dB vs frequency

## Outputs

- `dm-filter-topology`: DM filter schematic: number of LC stages, component values, damping network. Each stage provides -40dB/decade attenuation above its resonance
- `dm-component-specs`: X-class capacitors (X2 for 250Vac, X1 for 440Vac) with ESR and ESL, DM inductors or leakage inductance of CM choke, with saturation current rating

## Process

1. Calculate the required DM filter order. One LC stage gives -40dB/decade above resonance. If 60dB attenuation is needed at the switching frequency: single stage resonance must be 3 decades below, which is impractical. Two stages give -80dB/decade. Place resonances to spread attenuation across the spectrum.
2. Select X-class capacitors. X2 rated for 250Vac or X1 for higher voltage. Film capacitors (polyester, polypropylene) are preferred for their low ESR and self-healing properties. Ceramic capacitors have lower ESL but no self-healing and may crack under thermal stress. Size: typically 0.1uF to 2.2uF per stage.
3. Account for capacitor parasitics. Above the self-resonant frequency (SRF = 1/(2*pi*sqrt(L_parasitic*C))), a capacitor becomes inductive and provides no filtering. Film cap SRF: 1-10MHz depending on size. Use multiple smaller caps in parallel to push the effective SRF higher, or add a small ceramic in parallel for high-frequency bypass.
4. Design the DM inductor. This can be the leakage inductance of the CM choke (typically 1-2% of CM inductance) or a separate inductor. For a dedicated DM inductor, powdered iron cores handle the DC bias current well. Size from required inductance and saturation current.
5. Check filter input impedance vs converter input impedance. The converter looks like a negative resistance to the input: Zin_conv = -Vout^2 / (Pin * eta). If the filter output impedance (resonance peak) exceeds |Zin_conv|, the system oscillates (Middlebrook criterion). Add damping: Rd in series with a Cd across the filter output. Rd = sqrt(Lf/Cf), Cd >= 4*Cf.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
