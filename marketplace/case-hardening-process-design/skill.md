# Case Hardening Process Design

Design a case hardening process (carburizing, nitriding, or induction hardening) to achieve the target case depth and surface hardness while maintaining core properties.

## Inputs

- `alloy-specification`: Base alloy and its carburizing or nitriding response
- `target-microstructure`: Target case depth, surface hardness, and core hardness requirements

## Outputs

- `case-hardening-specification`: Complete case hardening process specification with atmosphere composition or power/frequency settings, time at temperature, and quench parameters
- `expected-case-profile`: Predicted hardness vs depth profile showing effective case depth, total case depth, and core hardness

## Process

1. Select the case hardening method. Gas carburizing for deep cases (0.5-2.5mm) on low-carbon steels (8620, 9310). Carbon diffuses into the surface at 870-950C in an endothermic atmosphere enriched to 0.8-1.0% carbon potential. Nitriding for high surface hardness without quench distortion (ion nitriding or gas nitriding at 500-580C on alloy steels containing nitride formers: Cr, Mo, V, Al). Induction hardening for localized hardening of medium-carbon steels (1045, 4140) where only specific areas need a hard case.
2. For carburizing: calculate the required time from Fick's second law of diffusion. The carbon concentration profile c(x,t) = cs - (cs - co) * erf(x / (2 * sqrt(D*t))) where cs is the surface carbon potential, co is the base carbon, D is the diffusion coefficient at temperature, and erf is the error function. At 925C, D for carbon in austenite is approximately 1.3 * 10^-7 cm^2/s. For a 1.0mm effective case depth (defined at 0.40% C or 550 HV), the total carburizing time is approximately 4-6 hours.
3. For nitriding: the case depth is much shallower (typically 0.1-0.6mm) and the process time is longer (20-80 hours at 500-580C). The compound zone (white layer) thickness must be controlled: epsilon phase for maximum hardness but brittleness, gamma-prime for a less brittle surface. Pulse plasma nitriding gives better control of the compound zone composition. Specify the maximum white layer thickness or the requirement to remove it by post-process lapping.
4. For induction hardening: select the frequency based on the required case depth. Higher frequency (100-400 kHz) for shallow cases (0.5-2mm). Lower frequency (1-10 kHz) for deep cases (3-10mm). The relationship is approximately: depth of current penetration = 503 * sqrt(resistivity / (frequency * permeability)). Power density drives the heating rate; the scanning speed along with power determines the austenitized depth. Quench immediately follows heating (integral quench head).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
