# Phase Transformation Analysis

Analyze the alloy phase diagram and transformation behavior to determine the target microstructure and the heat treatment path to achieve it.

## Inputs

- `alloy-specification`: Alloy composition (grade, specific heat), component geometry (section size, shape), and target mechanical properties (hardness, tensile strength, toughness, fatigue)
- `prior-condition`: As-received condition of the material (hot-rolled, cold-drawn, cast, forged, welded) and any prior heat treatments

## Outputs

- `target-microstructure`: Description of the target microstructure (phase distribution, grain size, precipitate condition) that meets the mechanical property requirements
- `transformation-path`: TTT/CCT diagram interpretation showing the required heating temperature, time, and cooling rate to achieve the target microstructure for the actual section size

## Process

1. Start from the equilibrium phase diagram. For steel: the Fe-C diagram gives the critical temperatures (Ac1, Ac3, Acm). The austenitizing temperature must be above Ac3 for hypoeutectoid steels (complete austenitization) or between Ac1 and Acm for hypereutectoid steels (retain some carbides to prevent grain growth and retain wear resistance). For aluminum alloys: the solvus temperature defines the solution treatment window.
2. Consult the TTT/CCT diagram for the specific alloy (not a generic grade). The CCT diagram is more practical because it reflects continuous cooling (actual quench behavior) rather than isothermal holds. Identify the nose of the pearlite C-curve (must cool through this temperature range faster than the nose time to avoid pearlite formation in through-hardening steels). For the specific section size, estimate the cooling rate at the center using Grossmann's method (H-value for the quenchant, D-value for the section).
3. Define the target microstructure. For through-hardened steel: martensite (ideally > 90% at the center for full hardness). For carburized steel: high-carbon martensite case over a tough low-carbon martensite or bainite core. For precipitation-hardened aluminum (e.g., 7075-T6): supersaturated solid solution after quench, then fine GP zones and eta-prime precipitates after aging. For duplex stainless steel: 40-60% ferrite-austenite balance with no sigma or chi phase.
4. Estimate the hardenability. For steel, calculate the Jominy equivalent cooling rate at the center of the actual part using Grossmann's equivalent bar diameter and the quench severity (H-value: still water H=1.0, agitated oil H=0.5, polymer quench H=0.2-0.7). The part must achieve the critical cooling rate at its slowest-cooling point to reach the target microstructure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
