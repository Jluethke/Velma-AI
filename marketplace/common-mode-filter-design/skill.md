# Common Mode Filter Design

Design the common mode EMC filter using CM chokes, Y-class capacitors (within safety leakage current limits), and ground connections to suppress common mode noise.

## Inputs

- `dm-filter-topology`: DM filter design (shared components may serve dual purpose)
- `dm-component-specs`: DM components already selected

## Outputs

- `cm-filter-topology`: CM filter schematic: CM choke inductance, Y-capacitor values, number of stages, and connection to safety ground
- `cm-choke-specification`: CM choke requirements: CM inductance, DM leakage inductance, saturation current (CM chokes do not saturate from differential load current since the fluxes cancel), impedance vs frequency curve

## Process

1. Calculate the required CM attenuation vs frequency. CM noise is typically dominated by higher frequencies (above 1MHz) where parasitic capacitances to chassis/earth couple the switching node dv/dt. Required attenuation at each harmonic of fsw.
2. Select the CM choke. Two windings on a single high-permeability core (nanocrystalline or MnZn ferrite). CM flux adds (both windings carry CM current in the same direction), providing high impedance to CM current. DM flux cancels (equal and opposite), so the choke does not saturate from load current. Typical CM inductance: 1mH to 30mH for 50/60Hz applications.
3. Select Y-class capacitors. Y1 rated for double-insulated connection to earth, Y2 for basic insulation. Safety limits: leakage current through Y-caps to earth must be below 0.5mA for Class I equipment (IEC 60950/62368) at rated voltage and frequency. At 250V/50Hz with 0.5mA limit: Cy_max = 0.5mA / (2*pi*50*250) = 6.4nF. Use 4.7nF standard value.
4. Verify CM choke impedance. The impedance curve from the datasheet shows a peak (typically at 1-10MHz for MnZn ferrite) and then rolloff at higher frequencies due to interwinding capacitance. If attenuation is needed above the peak frequency, add a second smaller CM choke with a higher resonance, or use a bead-on-lead approach for high-frequency CM current.
5. Integrate CM and DM filters. The standard pi-filter arrangement: Y-caps to ground, CM choke, X-caps, DM inductor (or use CM choke leakage), X-caps. Place the filter at the power entry point, before any other circuitry. The ground connection from Y-caps must go directly to the chassis/earth terminal, not through a long trace.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
