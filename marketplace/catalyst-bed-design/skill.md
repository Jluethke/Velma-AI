# Catalyst Bed Design

Design the catalyst bed for a fixed-bed or fluidized-bed reactor including pellet sizing, bed geometry, pressure drop, and mass transfer analysis.

## Inputs

- `reactor-volume`: Required catalyst volume
- `reactor-dimensions`: Reactor diameter and length
- `rate-law`: Intrinsic kinetics on catalyst surface

## Outputs

- `catalyst-specification`: Pellet size, shape, loading, and bed voidage
- `pressure-drop`: Pressure drop across the bed from Ergun equation
- `effectiveness-factor`: Internal and external mass transfer limitations quantified via Thiele modulus and effectiveness factor

## Process

1. Select pellet size and shape. Smaller pellets reduce internal mass transfer resistance (shorter diffusion path) but increase pressure drop. Typical trade-off: 1 to 5 mm for fixed beds. Shaped pellets (rings, trilobe) reduce pressure drop at equivalent external area.
2. Calculate pressure drop with the Ergun equation: dP/dz = (150*mu*u*(1-eps)^2)/(dp^2*eps^3) + (1.75*rho*u^2*(1-eps))/(dp*eps^3). Pressure drop must be acceptable relative to operating pressure (typically less than 10% for gas-phase).
3. Evaluate internal mass transfer: calculate the Thiele modulus phi = (R/3) * sqrt(k_v / D_eff) for a first-order reaction. The effectiveness factor eta = (1/phi) * (1/tanh(3*phi) - 1/(3*phi)). If eta is less than 0.9, internal diffusion limits the observed rate; use smaller pellets or increase porosity.
4. Evaluate external mass transfer: calculate the mass transfer coefficient k_c from the Ranz-Marshall or Thoenes-Kramers correlation. The external effectiveness factor is 1/(1 + k_v*R/(3*k_c*a_p)). If external resistance matters, increase linear velocity or decrease pellet size.
5. For fluidized beds: calculate minimum fluidization velocity from the Wen-Yu or Ergun equation at incipient fluidization. Size the distributor plate for uniform gas distribution (minimum 30% of bed pressure drop). Account for bubble bypass in the reaction model using the Kunii-Levenspiel two-phase model.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
