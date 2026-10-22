# Filter Frequency Impedance Scaling

Transform the normalized lowpass prototype to the actual filter type (lowpass, highpass, bandpass, or bandstop) at the required frequency and impedance.

## Inputs

- `prototype-element-values`: Normalized g-values
- `filter-specification`: Actual frequency edges and system impedance

## Outputs

- `scaled-element-values`: Actual L and C values for each element after frequency and impedance scaling
- `filter-schematic`: Circuit schematic showing the filter topology with element values, source and load impedances

## Process

1. For impedance scaling: multiply all inductors by Z0, divide all capacitors by Z0, where Z0 is the system impedance (typically 50 ohms).
2. For frequency scaling to lowpass: divide all L and C values by omega_c = 2*pi*f_cutoff.
3. For lowpass to highpass transformation: replace each series inductor gk with a series capacitor 1/(omega_c * gk * Z0), and each shunt capacitor gk with a shunt inductor Z0/(omega_c * gk).
4. For lowpass to bandpass transformation: replace each series inductor with a series LC resonator and each shunt capacitor with a parallel LC resonator. The element values depend on the fractional bandwidth: delta = (f2 - f1)/f0 where f0 = sqrt(f1*f2). Series L becomes L_s = gk*Z0/(omega_0*delta), C_s = delta/(omega_0*gk*Z0). Shunt C becomes C_p = gk/(omega_0*Z0*delta), L_p = Z0*delta/(omega_0*gk).
5. For bandstop: the dual of bandpass. Replace each series inductor with a parallel LC and each shunt capacitor with a series LC.
6. Verify that all element values are physically realizable. Bandpass filters at narrow bandwidth produce very large inductors and very small capacitors that may be impractical.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
