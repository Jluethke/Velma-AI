# Hv Cable Design And Ampacity

Design high-voltage cables: insulation selection, conductor sizing for ampacity, thermal analysis, and installation method considerations.

## Inputs

- `insulation-levels`: Required insulation level for cable voltage rating
- `clearance-requirements`: Installation constraints from clearance and separation requirements

## Outputs

- `cable-specification`: Cable type, conductor size, insulation material and thickness, shield design, and jacket material
- `ampacity-calculation`: Continuous ampacity for the installation conditions, with derating factors for ambient temperature, soil thermal resistivity, depth of burial, and mutual heating

## Process

1. Select the cable insulation. XLPE (cross-linked polyethylene) is standard for new installations at 69-500kV: low dielectric losses, no oil maintenance, 90C continuous conductor temperature rating. EPR (ethylene propylene rubber) offers better flexibility for difficult routing but higher dielectric losses. Fluid-filled cables (HPFF, SCFF) remain in service but are rarely specified for new installations due to environmental concerns. For submarine cables, XLPE with lead sheath and wire armor is standard.
2. Size the conductor. Start with the required ampacity (current from the power flow study, including emergency and future load growth). The conductor cross section determines the DC resistance. Apply the AC resistance factor (skin effect and proximity effect) which increases resistance by 5-20% above DC resistance for large conductors at 60Hz. Common conductor materials: copper for minimum size, aluminum for minimum weight and cost.
3. Calculate the ampacity using IEC 60287 or Neher-McGrath method. The cable temperature rise above ambient is: delta_T = (Wc + 0.5 x Wd) x T1 + (Wc + Wd + Ws) x n x T2 + (Wc + Wd + Ws) x n x T3, where Wc = conductor losses, Wd = dielectric losses, Ws = shield losses, T1 = thermal resistance of insulation, T2 = thermal resistance of jacket and bedding, T3 = thermal resistance of surrounding medium. Solve for the current that makes the conductor temperature equal to 90C.
4. Apply derating factors. Ambient soil temperature above 20C: derate using the square root of (90 - Tamb)/(90 - 20). Soil thermal resistivity above 90 C-cm/W: increases T3. Multiple cables in the same trench: mutual heating reduces ampacity by 10-30% depending on spacing (use the Kennelly formula or IEC 60287 grouping factors). Depth of burial: deeper cables have worse heat dissipation. Duct bank installations have higher thermal resistance than direct burial.
5. Specify the cable accessories. Joints (straight joints for cable lengths exceeding shipping length, typically 500-1000m): the joint must have equal or better insulation integrity than the cable. Terminations: outdoor or GIS terminations with stress cones to manage the electric field at the insulation screen cutback. Both joints and terminations are the most common failure points in cable systems; specify factory-tested, pre-molded components and require installer certification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
