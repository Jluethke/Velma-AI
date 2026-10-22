# Core Material And Geometry Selection

Select core material grade and geometry using the area product method, matching material properties to operating frequency and geometry to mechanical and thermal constraints.

## Inputs

- `flux-swing`: Required AC flux density swing
- `energy-storage`: Energy storage or VA rating requirement

## Outputs

- `selected-core`: Core part number, material grade, geometry (EE, ETD, PQ, toroid, RM), Ae (effective area), le (effective length), Ve (volume), AL value
- `core-loss-density`: Specific core loss in mW/cm^3 at the operating frequency and flux swing, from the material datasheet Steinmetz parameters

## Process

1. Select material by frequency range. Below 500kHz: MnZn ferrite (3C90/3C95 for low loss, 3F3/N87 for general purpose). 500kHz to 3MHz: MnZn high-frequency grades (3F4/N49). Above 1MHz: NiZn ferrite or powdered iron for very high frequency. For inductors with large DC bias, consider powdered iron (Kool Mu, MPP) which has distributed gap and better energy density.
2. Calculate required area product: AP = Ae * Aw = (L * Ipk^2) / (Kw * J * delta_B * Ku). Kw is winding fill factor (0.3-0.4 for round wire, 0.5-0.7 for foil), J is current density (3-6 A/mm^2 for natural convection, 6-10 for forced air), Ku is utilization factor.
3. Select geometry. EE cores: cheapest, easiest to wind, good for cost-sensitive designs. ETD: round center post gives better winding fill than EE. PQ: lower profile than ETD at same AP. RM: shielded, good for EMI-sensitive designs. Toroid: lowest EMI (closed magnetic path), but hardest to wind and no practical air gap for inductors.
4. From the manufacturer catalog, find cores with AP >= calculated minimum. Take the next size up for margin. Record Ae, Aw, le, Ve, and AL (inductance per turn squared without gap).
5. Look up Steinmetz parameters for the selected material: Pv = k * f^alpha * B^beta (in mW/cm^3 with f in kHz, B in mT). Typical ferrite: alpha = 1.5-1.8, beta = 2.3-2.8. Calculate core loss at operating point: Pcore = Pv * Ve.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
