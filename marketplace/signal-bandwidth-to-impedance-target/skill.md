# Signal Bandwidth To Impedance Target

Derive target impedance from signal rise time and protocol specification. Calculate knee frequency (0.35/t_rise for 10-90, 0.22/t_rise for 20-80), determine wavelength at knee frequency, set trace length threshold at lambda/10 for lumped vs distributed treatment, and extract impedance target from protocol spec (e.g., 50 ohm single-ended, 85/90/100 ohm differential for USB/HDMI/Ethernet).

## Inputs

- `signal-protocol`: Protocol name and version (e.g., PCIe Gen4, USB 3.2, DDR4)
- `rise-time-spec`: Signal rise time from transmitter datasheet in picoseconds
- `trace-lengths`: Estimated longest trace length in millimeters

## Outputs

- `knee-frequency`: Bandwidth limit in GHz calculated from rise time
- `critical-wavelength`: Wavelength at knee frequency in the PCB dielectric, using effective Dk
- `impedance-target`: Target impedance (single-ended and differential) with tolerance band from protocol spec
- `distributed-treatment-flag`: Whether trace length exceeds lambda/10 and requires transmission line treatment

## Process

1. Extract rise time from the transmitter datasheet (use 20-80% if specified, otherwise 10-90%). Calculate knee frequency: f_knee = 0.35/t_r (10-90%) or 0.22/t_r (20-80%).
2. Calculate wavelength in the PCB medium: lambda = c / (f_knee * sqrt(Dk_eff)). For microstrip, Dk_eff is approximately (Dk+1)/2 for a rough first pass. For stripline, Dk_eff = Dk of the laminate.
3. Compare trace length to lambda/10. If trace length exceeds this threshold, the trace is a transmission line and impedance control is mandatory, not optional.
4. Look up the protocol impedance target. Record the nominal value and the tolerance (typically +/- 10% for most protocols, tighter for some). This is the number the stackup must hit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
