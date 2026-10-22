# Isolation Requirement Analysis

Define isolation requirements from forcing frequency, amplitude, and target transmissibility or floor vibration criterion.

## Inputs

- `vibration-source`: Description of the vibration source including forcing frequencies, amplitudes, and operating speed range
- `isolation-target`: Required isolation performance (transmissibility ratio, floor vibration criterion VC curve, or force reduction)
- `installation-constraints`: Weight, space, environmental conditions, and mounting interface constraints

## Outputs

- `required-natural-frequency`: Maximum allowable natural frequency of the isolated system to achieve the target transmissibility at the forcing frequency
- `static-deflection-target`: Required static deflection corresponding to the natural frequency target
- `isolation-specification`: Complete specification including frequency ratio, damping requirements, and load per mount

## Process

1. Identify all forcing frequencies. For rotating machinery: 1x running speed (unbalance), 2x (misalignment), blade pass frequency (number of blades times RPM), and any structural resonances near these. For reciprocating machines: 1x, 2x, and higher orders.
2. Calculate the required frequency ratio r = f_forcing / f_natural for the target transmissibility T. For a SDOF system: T = 1/sqrt((1-(r)^2)^2 + (2*zeta*r)^2). For 90% isolation (T = 0.1), r must be about 3.3 with 5% damping. For 95% isolation, r must be about 4.6.
3. Convert the natural frequency to static deflection: f_n = (1/2*pi)*sqrt(g/delta_static). A 3 Hz natural frequency requires about 28 mm static deflection; 5 Hz requires about 10 mm; 10 Hz requires about 2.5 mm.
4. For sensitive equipment (electron microscope, metrology): use VC curves (VC-A through VC-G) as the floor vibration criterion. Measure the existing floor vibration spectrum and determine which VC curve the floor meets. Design isolation to bring equipment vibration below the required VC curve at all frequencies.
5. Calculate the load per mount from the total supported weight divided by the number of mounts. Account for center-of-gravity offset: mounts closer to the CG carry more load. Unequal loading shifts the system natural frequencies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
