# Reactor Sizing Calculation

Size the reactor from the design equation using residence time and conversion targets.

## Inputs

- `reactor-type`: Selected reactor type
- `rate-law`: Reaction rate expression with kinetic parameters
- `production-requirements`: Feed flow rate, target conversion, operating temperature and pressure

## Outputs

- `reactor-volume`: Required reactor volume with design margin
- `residence-time`: Mean residence time at operating conditions
- `reactor-dimensions`: Diameter, length or height, and aspect ratio based on type-specific heuristics

## Process

1. For PFR: integrate the design equation V = F_A0 * integral(dX/(-rA)) from 0 to target conversion. Use numerical integration (Simpson's rule or adaptive quadrature) when the rate expression does not have a closed-form integral.
2. For CSTR: solve the algebraic design equation V = F_A0 * X / (-rA_exit). For nonlinear rate expressions, this requires iteration because exit concentration depends on conversion which depends on volume.
3. For batch: solve t_batch = N_A0 * integral(dX/(-rA*V)) + t_downtime. The total cycle time determines the number of batch reactors needed to meet continuous production targets.
4. Apply a design factor of 1.1 to 1.2 on volume to account for non-ideal mixing, catalyst aging, and feed composition variability. For catalytic reactors, size for end-of-run catalyst activity, not fresh catalyst.
5. Set dimensions from type-specific heuristics: for tubular PFR, L/D ratios of 10 to 100 depending on heat transfer needs. For CSTR, H/D ratio of 1.0 to 1.5 with standard dish heads. Check that residence time distribution is acceptable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
