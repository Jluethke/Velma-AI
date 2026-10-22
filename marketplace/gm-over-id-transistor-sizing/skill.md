# Gm Over Id Transistor Sizing

Size each transistor using the gm/Id methodology, which provides a systematic way to navigate the inversion region trade-off between speed, gain, and power without relying on square-law approximations.

## Inputs

- `selected-topology`: Op-amp topology with annotated schematic
- `process-parameters`: Technology node and transistor models

## Outputs

- `transistor-dimensions`: W/L for every transistor, with the gm/Id operating point and inversion coefficient
- `bias-currents`: Branch current for each stage

## Process

1. Generate the gm/Id lookup tables from SPICE simulation: sweep a single NMOS and PMOS transistor across Vgs at the nominal Vds. Plot gm/Id vs Id/(W/L), which is the intrinsic current density. This curve is independent of width.
2. For each transistor, determine the required gm from the specification it must meet. For the input pair, gm1 = GBW * 2 * pi * Cc (for a two-stage Miller). For current mirrors, gm is set by matching requirements.
3. Choose the gm/Id operating point on the lookup curve. High gm/Id (>20 V^-1, weak inversion) gives maximum gain and minimum power but is slow and noisy (higher flicker noise due to large W). Low gm/Id (<10 V^-1, strong inversion) gives speed and low area but wastes power.
4. For the input pair, target gm/Id of 15-20 V^-1 for a balance of noise and bandwidth. For cascode devices, gm/Id of 10-15 V^-1 is typical (they need moderate speed). For current mirrors, gm/Id of 5-10 V^-1 gives good matching (strong inversion).
5. From the chosen gm/Id and required gm, calculate Id = gm / (gm/Id). From Id and the current density at that gm/Id, calculate W/L. Choose L > Lmin for analog transistors to improve output resistance (ro proportional to L) and matching (mismatch proportional to 1/sqrt(W*L)).
6. Verify Vdsat at the operating point: Vdsat = 2 / (gm/Id). Ensure all transistors in a cascode stack fit within the available voltage headroom.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
